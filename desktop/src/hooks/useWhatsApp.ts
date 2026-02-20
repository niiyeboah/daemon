import { useState, useCallback, useRef, useEffect } from "react";
import type { StepStatus } from "@/types";
import {
  openclawCheck,
  openclawInstall,
  openclawOnboard,
  openclawConnectWhatsapp,
  openclawConfigureModel,
  openclawGatewayRestart,
  onOpenClawLog,
  onOpenClawQr,
} from "@/lib/tauri";

export interface WhatsAppStep {
  id: string;
  label: string;
  description: string;
  status: StepStatus;
  optional?: boolean;
}

const INITIAL_STEPS: WhatsAppStep[] = [
  {
    id: "check-openclaw",
    label: "Check OpenClaw",
    description: "Verify OpenClaw is installed and gateway is running",
    status: "pending",
  },
  {
    id: "install-openclaw",
    label: "Install OpenClaw",
    description: "Install OpenClaw if not found",
    status: "pending",
  },
  {
    id: "onboard",
    label: "Onboarding",
    description: "Run OpenClaw onboarding",
    status: "pending",
  },
  {
    id: "connect-whatsapp",
    label: "Connect WhatsApp",
    description: "Scan QR code to link your WhatsApp",
    status: "pending",
  },
  {
    id: "configure-model",
    label: "Configure Model",
    description: "Set Daemon as the default model",
    status: "pending",
  },
  {
    id: "restart-gateway",
    label: "Restart Gateway",
    description: "Restart OpenClaw gateway with new config",
    status: "pending",
  },
  {
    id: "test",
    label: "Test",
    description: "Verify WhatsApp integration works",
    status: "pending",
    optional: true,
  },
  {
    id: "done",
    label: "Done",
    description: "WhatsApp connected!",
    status: "pending",
  },
];

export function useWhatsApp() {
  const [steps, setSteps] = useState<WhatsAppStep[]>(INITIAL_STEPS);
  const [currentStep, setCurrentStep] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [openclawInstalled, setOpenclawInstalled] = useState(false);
  const [gatewayRunning, setGatewayRunning] = useState(false);
  const [qrData, setQrData] = useState<string | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

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
          case "check-openclaw": {
            addLog("Checking OpenClaw installation...");
            const status = await openclawCheck();

            if (status.installed) {
              addLog(`OpenClaw found at ${status.path}`);
              setOpenclawInstalled(true);
            } else {
              addLog("OpenClaw not found in PATH");
              setOpenclawInstalled(false);
            }

            if (status.gateway_running) {
              addLog("OpenClaw gateway is running");
              setGatewayRunning(true);
            } else {
              addLog("OpenClaw gateway is not running");
              setGatewayRunning(false);
            }

            updateStep(stepIndex, "done");

            // Auto-skip install and onboard if already installed and gateway running
            if (status.installed && status.gateway_running) {
              const installIdx = steps.findIndex(
                (s) => s.id === "install-openclaw"
              );
              const onboardIdx = steps.findIndex((s) => s.id === "onboard");
              if (installIdx >= 0) updateStep(installIdx, "done");
              if (onboardIdx >= 0) updateStep(onboardIdx, "done");
            }
            break;
          }

          case "install-openclaw": {
            if (openclawInstalled) {
              addLog("OpenClaw already installed, skipping...");
              updateStep(stepIndex, "done");
              break;
            }
            addLog("Installing OpenClaw...");
            const unlisten = await onOpenClawLog((event) => {
              addLog(`[${event.stream}] ${event.line}`);
            });
            try {
              await openclawInstall();
              addLog("OpenClaw installed successfully");
              setOpenclawInstalled(true);
              updateStep(stepIndex, "done");
            } finally {
              unlisten();
            }
            break;
          }

          case "onboard": {
            if (gatewayRunning) {
              addLog("Gateway already running, skipping onboarding...");
              updateStep(stepIndex, "done");
              break;
            }
            addLog("Running OpenClaw onboarding...");
            const unlisten = await onOpenClawLog((event) => {
              addLog(`[${event.stream}] ${event.line}`);
            });
            try {
              await openclawOnboard();
              addLog("Onboarding complete");
              updateStep(stepIndex, "done");
            } finally {
              unlisten();
            }
            break;
          }

          case "connect-whatsapp": {
            addLog("Connecting WhatsApp channel...");
            setQrData(null);

            const unlistenLog = await onOpenClawLog((event) => {
              addLog(`[${event.stream}] ${event.line}`);
            });
            const unlistenQr = await onOpenClawQr((event) => {
              setQrData(event.data);
              addLog("QR code received — scan with your phone");
            });

            try {
              await openclawConnectWhatsapp();
              addLog("WhatsApp connected successfully");
              updateStep(stepIndex, "done");
            } finally {
              unlistenLog();
              unlistenQr();
            }
            break;
          }

          case "configure-model": {
            addLog("Configuring Daemon as default model...");
            await openclawConfigureModel("daemon");
            addLog("Model configured: ollama/daemon (context: 16384, max tokens: 8192)");
            updateStep(stepIndex, "done");
            break;
          }

          case "restart-gateway": {
            addLog("Restarting OpenClaw gateway...");
            const unlisten = await onOpenClawLog((event) => {
              addLog(`[${event.stream}] ${event.line}`);
            });
            try {
              await openclawGatewayRestart();
              addLog("Gateway restarted successfully");
              updateStep(stepIndex, "done");
            } finally {
              unlisten();
            }
            break;
          }

          case "test": {
            addLog("Testing WhatsApp integration...");
            // Verify the gateway is running after restart
            const status = await openclawCheck();
            if (status.gateway_running) {
              addLog("Gateway is running — integration is ready");
              updateStep(stepIndex, "done");
            } else {
              addLog("Gateway not responding — please check the logs");
              updateStep(stepIndex, "error");
            }
            break;
          }

          case "done": {
            addLog("WhatsApp connector setup complete!");
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
    [steps, updateStep, addLog, openclawInstalled, gatewayRunning]
  );

  const recheckOpenClaw = useCallback(async () => {
    const installIdx = steps.findIndex((s) => s.id === "install-openclaw");
    updateStep(installIdx, "running");
    try {
      const status = await openclawCheck();
      if (status.installed) {
        setOpenclawInstalled(true);
        addLog("OpenClaw is now installed!");
        updateStep(installIdx, "done");
      } else {
        addLog("OpenClaw still not found. Please install and try again.");
        updateStep(installIdx, "running");
      }
    } catch (err) {
      addLog(
        `Check failed: ${err instanceof Error ? err.message : String(err)}`
      );
      updateStep(installIdx, "error");
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
    const next = currentStep + 1;
    if (next < steps.length) {
      setCurrentStep(next);
      // Auto-skip install/onboard steps if already set up
      if (steps[next].id === "install-openclaw" && openclawInstalled) {
        const afterInstall = next + 1;
        if (
          afterInstall < steps.length &&
          steps[afterInstall].id === "onboard" &&
          gatewayRunning
        ) {
          setCurrentStep(afterInstall + 1);
        } else {
          setCurrentStep(afterInstall);
        }
      } else if (steps[next].id === "onboard" && gatewayRunning) {
        setCurrentStep(next + 1);
      }
    }
  }, [currentStep, steps, openclawInstalled, gatewayRunning]);

  return {
    steps,
    currentStep,
    setCurrentStep,
    logs,
    logsEndRef,
    openclawInstalled,
    gatewayRunning,
    qrData,
    runStep,
    retryStep,
    nextStep,
    recheckOpenClaw,
  };
}
