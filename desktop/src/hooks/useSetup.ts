import { useState, useCallback, useRef, useEffect } from "react";
import type { StepStatus } from "@/types";
import {
  detectOs,
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
  const selectedBaseModel = "daemon"; // stub

  const pullProgress = { status: "", percent: 0 }; // stub
  const testResponse = null; // stub
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
            addLog("Skipping Ollama check (OpenRouter transition)");
            setOllamaReachable(true);
            updateStep(stepIndex, "done");
            updateStep(stepIndex + 1, "done");
            break;
          }

          case "install-ollama": {
            // Unused
            break;
          }

          case "choose-base-model": {
            break;
          }

          case "pull-model": {
            addLog("Skipping Model Pull (OpenRouter transition)");
            updateStep(stepIndex, "done");
            break;
          }

          case "create-model": {
            addLog("Skipping Model Creation (OpenRouter transition)");
            updateStep(stepIndex, "done");
            break;
          }

          case "test-inference": {
            addLog("Skipping test inference...");
            updateStep(stepIndex, "done");
            break;
          }

          case "add-alias": {
            addLog("Skipping alias creation...");
            updateStep(stepIndex, "done");
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
    updateStep(installStepIndex, "done");
  }, [steps, updateStep]);

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
    setSelectedBaseModel: () => {}, // stub
    pullProgress,
    testResponse,
    runStep,
    retryStep,
    nextStep,
    recheckOllama,
  };
}
