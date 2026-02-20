import { useWhatsApp } from "@/hooks/useWhatsApp";
import { SetupStepper } from "@/components/setup/SetupStepper";
import { LogDrawer } from "@/components/setup/LogDrawer";
import { CheckOpenClawStep } from "@/components/whatsapp/steps/CheckOpenClawStep";
import { InstallOpenClawStep } from "@/components/whatsapp/steps/InstallOpenClawStep";
import { OnboardStep } from "@/components/whatsapp/steps/OnboardStep";
import { ConnectWhatsAppStep } from "@/components/whatsapp/steps/ConnectWhatsAppStep";
import { ConfigureModelStep } from "@/components/whatsapp/steps/ConfigureModelStep";
import { RestartGatewayStep } from "@/components/whatsapp/steps/RestartGatewayStep";
import { TestStep } from "@/components/whatsapp/steps/TestStep";
import { WhatsAppDoneStep } from "@/components/whatsapp/steps/WhatsAppDoneStep";

export default function WhatsApp() {
  const {
    steps,
    currentStep,
    setCurrentStep,
    logs,
    logsEndRef,
    openclawInstalled,
    gatewayRunning,
    qrData,
    runStep,
    nextStep,
    recheckOpenClaw,
  } = useWhatsApp();

  const current = steps[currentStep];

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-1 overflow-hidden">
        {/* Step list sidebar */}
        <div className="w-64 shrink-0 border-r overflow-auto p-4">
          <h2 className="text-sm font-semibold mb-4">WhatsApp Connector</h2>
          <SetupStepper
            steps={steps}
            currentStep={currentStep}
            onStepClick={setCurrentStep}
          />
        </div>

        {/* Step content */}
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-lg mx-auto">
            <h3 className="text-lg font-semibold mb-1">{current.label}</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Step {currentStep + 1} of {steps.length}
            </p>

            {current.id === "check-openclaw" && (
              <CheckOpenClawStep
                openclawInstalled={openclawInstalled}
                gatewayRunning={gatewayRunning}
                onRun={() => runStep(currentStep)}
                onNext={nextStep}
                status={current.status}
              />
            )}

            {current.id === "install-openclaw" && (
              <InstallOpenClawStep
                openclawInstalled={openclawInstalled}
                onRun={() => runStep(currentStep)}
                onRecheck={recheckOpenClaw}
                onNext={nextStep}
                status={current.status}
              />
            )}

            {current.id === "onboard" && (
              <OnboardStep
                onRun={() => runStep(currentStep)}
                onNext={nextStep}
                status={current.status}
              />
            )}

            {current.id === "connect-whatsapp" && (
              <ConnectWhatsAppStep
                qrData={qrData}
                onRun={() => runStep(currentStep)}
                onNext={nextStep}
                status={current.status}
              />
            )}

            {current.id === "configure-model" && (
              <ConfigureModelStep
                onRun={() => runStep(currentStep)}
                onNext={nextStep}
                status={current.status}
              />
            )}

            {current.id === "restart-gateway" && (
              <RestartGatewayStep
                onRun={() => runStep(currentStep)}
                onNext={nextStep}
                status={current.status}
              />
            )}

            {current.id === "test" && (
              <TestStep
                onRun={() => runStep(currentStep)}
                onNext={nextStep}
                status={current.status}
              />
            )}

            {current.id === "done" && <WhatsAppDoneStep />}
          </div>
        </div>
      </div>

      <LogDrawer logs={logs} logsEndRef={logsEndRef} />
    </div>
  );
}
