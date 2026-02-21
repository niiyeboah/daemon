import { useState, useCallback, useRef, useEffect } from "react";
import type { StepStatus } from "@/types";
import { BASE_MODEL } from "@/store/constants";
import {
  detectOs,
  ollamaCheck,
  ollamaPullModel,
  ollamaChat,
  setupInit,
  setupAlias,
  onPullProgress,
  onSetupLog,
} from "@/lib/tauri";

export interface SetupStep {
  id: string;
  label: string;
  description: string;
  status: StepStatus;
  optional?: boolean;
}

export interface PullProgress {
  status: string;
  percent: number;
}

const INITIAL_STEPS: SetupStep[] = [
  {
    id: "detect-os",
    label: "Detect OS",
    description: "Auto-detect your operating system",
    status: "pending",
  },
  {
    id: "check-ollama",
    label: "Check Ollama",
    description: "Verify Ollama is installed and running",
    status: "pending",
  },
  {
    id: "install-ollama",
    label: "Install Ollama",
    description: "Install Ollama if not found",
    status: "pending",
  },
  {
    id: "choose-base-model",
    label: "Choose Base Model",
    description: "Select base model for Daemon",
    status: "pending",
  },
  {
    id: "pull-model",
    label: "Pull Model",
    description: "Download base model",
    status: "pending",
  },
  {
    id: "create-model",
    label: "Create Daemon",
    description: "Create the Daemon model from Modelfile",
    status: "pending",
  },
  {
    id: "test-inference",
    label: "Test Inference",
    description: "Send a test prompt and verify response",
    status: "pending",
    optional: true,
  },
  {
    id: "add-alias",
    label: "Shell Alias",
    description: "Add the daemon shell alias",
    status: "pending",
    optional: true,
  },
  {
    id: "done",
    label: "Done",
    description: "Setup complete!",
    status: "pending",
  },
];

export function useSetup() {
  const [steps, setSteps] = useState<SetupStep[]>(INITIAL_STEPS);
  const [currentStep, setCurrentStep] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [detectedOs, setDetectedOs] = useState<string | null>(null);
  const [ollamaReachable, setOllamaReachable] = useState(false);
  const [selectedBaseModel, setSelectedBaseModel] = useState<string>(BASE_MODEL);
  const [pullProgress, setPullProgress] = useState<PullProgress>({
    status: "",
    percent: 0,
  });
  const [testResponse, setTestResponse] = useState<string | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const addLog = useCallback((line: string) => {
    setLogs((prev) => [...prev, line]);
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const updateStep = useCallback(
    (index: number, status: StepStatus) => {
      setSteps((prev) =>
        prev.map((s, i) => (i === index ? { ...s, status } : s))
      );
    },
    []
  );

  const runStep = useCallback(
    async (stepIndex: number) => {
      updateStep(stepIndex, "running");
      const stepId = steps[stepIndex].id;

      try {
        switch (stepId) {
          case "detect-os": {
            const os = await detectOs();
            setDetectedOs(os);
            addLog(`Detected OS: ${os}`);
            updateStep(stepIndex, "done");
            break;
          }

          case "check-ollama": {
            addLog("Checking Ollama installation...");
            const status = await ollamaCheck();
            if (status.api_reachable) {
              addLog(`Ollama is running (${status.version ?? "unknown version"})`);
              setOllamaReachable(true);
              updateStep(stepIndex, "done");
              // Skip install step since Ollama is already running
              updateStep(stepIndex + 1, "done");
            } else {
              addLog("Ollama API not reachable");
              setOllamaReachable(false);
              updateStep(stepIndex, "done");
            }
            break;
          }

          case "install-ollama": {
            // This step shows instructions — user clicks "Check again"
            addLog("Waiting for Ollama installation...");
            updateStep(stepIndex, "running");
            break;
          }

          case "choose-base-model": {
            // Selection only; Continue is handled by nextStep
            break;
          }

          case "pull-model": {
            addLog(`Pulling ${selectedBaseModel}...`);
            const unlisten = await onPullProgress((event) => {
              const percent =
                event.total && event.total > 0
                  ? Math.round((event.completed ?? 0) / event.total * 100)
                  : 0;
              setPullProgress({ status: event.status, percent });
              if (event.status !== pullProgress.status) {
                addLog(`Pull: ${event.status}`);
              }
            });
            try {
              await ollamaPullModel(selectedBaseModel);
              addLog("Model pull complete");
              updateStep(stepIndex, "done");
            } finally {
              unlisten();
            }
            break;
          }

          case "create-model": {
            addLog("Creating Daemon model...");
            const unlisten = await onSetupLog((event) => {
              addLog(`[${event.stream}] ${event.line}`);
            });
            try {
              await setupInit(selectedBaseModel);
              addLog("Daemon model created successfully");
              updateStep(stepIndex, "done");
            } finally {
              unlisten();
            }
            break;
          }

          case "test-inference": {
            addLog("Testing inference...");
            const response = await ollamaChat(
              "daemon",
              [{ role: "user", content: "Hello, who are you?" }],
              false
            );
            setTestResponse(response.message.content);
            addLog(`Response: ${response.message.content.slice(0, 100)}...`);
            if (response.tokens_per_second) {
              addLog(
                `Speed: ${response.tokens_per_second.toFixed(1)} tokens/sec`
              );
            }
            updateStep(stepIndex, "done");
            break;
          }

          case "add-alias": {
            addLog("Adding shell alias...");
            const unlistenAlias = await onSetupLog((event) => {
              addLog(`[${event.stream}] ${event.line}`);
            });
            try {
              await setupAlias();
              addLog("Shell alias added successfully");
              updateStep(stepIndex, "done");
            } finally {
              unlistenAlias();
            }
            break;
          }

          case "done": {
            addLog("Setup complete! You're all set.");
            updateStep(stepIndex, "done");
            break;
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        addLog(`Error: ${msg}`);
        updateStep(stepIndex, "error");
      }
    },
    [steps, updateStep, addLog, pullProgress.status, selectedBaseModel]
  );

  const recheckOllama = useCallback(async () => {
    const installStepIndex = steps.findIndex((s) => s.id === "install-ollama");
    updateStep(installStepIndex, "running");
    try {
      const status = await ollamaCheck();
      if (status.api_reachable) {
        setOllamaReachable(true);
        addLog("Ollama is now running!");
        updateStep(installStepIndex, "done");
      } else {
        addLog("Ollama still not reachable. Please start Ollama and try again.");
        updateStep(installStepIndex, "running");
      }
    } catch (err) {
      addLog(`Check failed: ${err instanceof Error ? err.message : String(err)}`);
      updateStep(installStepIndex, "error");
    }
  }, [steps, updateStep, addLog]);

  const retryStep = useCallback(
    (stepIndex: number) => {
      updateStep(stepIndex, "pending");
      runStep(stepIndex);
    },
    [updateStep, runStep]
  );

  const nextStep = useCallback(() => {
    const stepId = steps[currentStep].id;
    if (stepId === "choose-base-model") {
      updateStep(currentStep, "done");
    }
    const next = currentStep + 1;
    if (next < steps.length) {
      setCurrentStep(next);
      // Auto-skip install step if Ollama is already reachable
      if (steps[next].id === "install-ollama" && ollamaReachable) {
        setCurrentStep(next + 1);
      }
    }
  }, [currentStep, steps, ollamaReachable, updateStep]);

  return {
    steps,
    currentStep,
    setCurrentStep,
    logs,
    logsEndRef,
    detectedOs,
    ollamaReachable,
    selectedBaseModel,
    setSelectedBaseModel,
    pullProgress,
    testResponse,
    runStep,
    retryStep,
    nextStep,
    recheckOllama,
  };
}
