import { useState, useCallback, useRef, useEffect } from "react";
import type { StepStatus } from "@/types";
import {
  detectOs,
  openrouterTestKey,
  openclawCheck,
  openclawInstall,
  openclawConfigureModel,
  onOpenClawLog,
} from "@/lib/tauri";
import { useSettings } from "@/hooks/useSettings";
import { OPENCLAW_DEFAULT_MODEL } from "@/store/constants";

export interface SetupStep {
  id: string;
  label: string;
  description: string;
  status: StepStatus;
}

const INITIAL_STEPS: SetupStep[] = [
  {
    id: "detect-os",
    label: "Detect OS",
    description: "Auto-detect your operating system",
    status: "pending",
  },
  {
    id: "configure-api-key",
    label: "OpenRouter API Key",
    description: "Enter and verify your OpenRouter API key",
    status: "pending",
  },
  {
    id: "install-openclaw",
    label: "Install OpenClaw",
    description: "Check or install the OpenClaw CLI",
    status: "pending",
  },
  {
    id: "configure-openclaw",
    label: "Configure OpenClaw",
    description: "Connect OpenClaw to OpenRouter",
    status: "pending",
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
  const [openclawInstalled, setOpenclawInstalled] = useState(false);
  // Ref for immediate read inside runStep; state for re-renders / prop passing
  const openclawCheckedRef = useRef(false);
  const [openclawChecked, setOpenclawChecked] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const { openrouterApiKey, setOpenrouterApiKey } = useSettings();
  const [apiKeyInput, setApiKeyInput] = useState("");

  // Pre-fill key input when saved settings load
  useEffect(() => {
    if (openrouterApiKey && !apiKeyInput) {
      setApiKeyInput(openrouterApiKey);
    }
  }, [openrouterApiKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const addLog = useCallback((line: string) => {
    setLogs((prev) => [...prev, line]);
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const updateStep = useCallback((index: number, status: StepStatus) => {
    setSteps((prev) =>
      prev.map((s, i) => (i === index ? { ...s, status } : s))
    );
  }, []);

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

          case "configure-api-key": {
            const key = apiKeyInput.trim();
            if (!key) {
              addLog("Error: API key cannot be empty");
              updateStep(stepIndex, "error");
              break;
            }
            addLog("Testing OpenRouter API key...");
            await openrouterTestKey(key);
            await setOpenrouterApiKey(key);
            addLog("API key verified and saved");
            updateStep(stepIndex, "done");
            break;
          }

          case "install-openclaw": {
            if (!openclawCheckedRef.current) {
              // First call: check if openclaw is installed
              openclawCheckedRef.current = true;
              setOpenclawChecked(true);
              addLog("Checking for OpenClaw in PATH...");
              const status = await openclawCheck();
              if (status.installed) {
                addLog(`OpenClaw found at ${status.path}`);
                setOpenclawInstalled(true);
                updateStep(stepIndex, "done");
              } else {
                addLog("OpenClaw not found — click Install to continue");
                setOpenclawInstalled(false);
                updateStep(stepIndex, "pending"); // wait for user to click Install
              }
            } else {
              // Second call: user clicked Install
              addLog("Installing OpenClaw...");
              const unlisten = await onOpenClawLog((event) => {
                addLog(`[${event.stream}] ${event.line}`);
              });
              try {
                await openclawInstall();
                addLog("Verifying installation...");
                const status = await openclawCheck();
                if (status.installed) {
                  addLog("OpenClaw installed successfully");
                  setOpenclawInstalled(true);
                  updateStep(stepIndex, "done");
                } else {
                  throw new Error(
                    "Installation finished but openclaw was not found in PATH. Try restarting the app or install manually."
                  );
                }
              } finally {
                unlisten();
              }
            }
            break;
          }

          case "configure-openclaw": {
            const key = openrouterApiKey || apiKeyInput.trim();
            if (!key) {
              addLog("Error: No API key found. Please complete the previous step first.");
              updateStep(stepIndex, "error");
              break;
            }
            addLog(`Configuring OpenClaw with model: ${OPENCLAW_DEFAULT_MODEL}...`);
            await openclawConfigureModel(OPENCLAW_DEFAULT_MODEL, key);
            addLog("Config written to ~/.openclaw/openclaw.json");
            addLog(
              "Auth profiles written to ~/.openclaw/agents/main/agent/auth-profiles.json"
            );
            addLog(`Model: openrouter/${OPENCLAW_DEFAULT_MODEL}`);
            updateStep(stepIndex, "done");
            break;
          }

          case "done": {
            addLog("Setup complete!");
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
    [
      steps,
      updateStep,
      addLog,
      apiKeyInput,
      openrouterApiKey,
      setOpenrouterApiKey,
      openclawInstalled,
    ]
  );

  const recheckOpenClaw = useCallback(async () => {
    const installIdx = steps.findIndex((s) => s.id === "install-openclaw");
    openclawCheckedRef.current = false;
    setOpenclawChecked(false);
    updateStep(installIdx, "running");
    try {
      const status = await openclawCheck();
      if (status.installed) {
        setOpenclawInstalled(true);
        addLog("OpenClaw is now installed!");
        updateStep(installIdx, "done");
      } else {
        openclawCheckedRef.current = true;
        setOpenclawChecked(true);
        addLog("OpenClaw still not found. Please install and try again.");
        updateStep(installIdx, "pending");
      }
    } catch (err) {
      addLog(`Check failed: ${err instanceof Error ? err.message : String(err)}`);
      updateStep(installIdx, "error");
    }
  }, [steps, updateStep, addLog]);

  const nextStep = useCallback(() => {
    const next = currentStep + 1;
    if (next < steps.length) {
      setCurrentStep(next);
    }
  }, [currentStep, steps]);

  return {
    steps,
    currentStep,
    setCurrentStep,
    logs,
    logsEndRef,
    detectedOs,
    openclawInstalled,
    openclawChecked,
    apiKeyInput,
    setApiKeyInput,
    runStep,
    nextStep,
    recheckOpenClaw,
  };
}
