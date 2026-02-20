import { useSetup } from "@/hooks/useSetup";
import { SetupStepper } from "@/components/setup/SetupStepper";
import { LogDrawer } from "@/components/setup/LogDrawer";
import { DetectOsStep } from "@/components/setup/steps/DetectOsStep";
import { CheckOllamaStep } from "@/components/setup/steps/CheckOllamaStep";
import { InstallOllamaStep } from "@/components/setup/steps/InstallOllamaStep";
import { PullModelStep } from "@/components/setup/steps/PullModelStep";
import { CreateModelStep } from "@/components/setup/steps/CreateModelStep";
import { TestInferenceStep } from "@/components/setup/steps/TestInferenceStep";
import { AliasStep } from "@/components/setup/steps/AliasStep";
import { DoneStep } from "@/components/setup/steps/DoneStep";

export default function Setup() {
  const {
    steps,
    currentStep,
    setCurrentStep,
    logs,
    logsEndRef,
    detectedOs,
    ollamaReachable,
    pullProgress,
    testResponse,
    runStep,
    retryStep,
    nextStep,
    recheckOllama,
  } = useSetup();

  const current = steps[currentStep];

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-1 overflow-hidden">
        {/* Step list sidebar */}
        <div className="w-64 shrink-0 border-r overflow-auto p-4">
          <h2 className="text-sm font-semibold mb-4">Setup Wizard</h2>
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

            {current.id === "detect-os" && (
              <DetectOsStep
                detectedOs={detectedOs}
                onRun={() => runStep(currentStep)}
                onNext={nextStep}
                status={current.status}
              />
            )}

            {current.id === "check-ollama" && (
              <CheckOllamaStep
                ollamaReachable={ollamaReachable}
                onRun={() => runStep(currentStep)}
                onNext={nextStep}
                status={current.status}
              />
            )}

            {current.id === "install-ollama" && (
              <InstallOllamaStep
                detectedOs={detectedOs}
                onRecheck={recheckOllama}
                onNext={nextStep}
                status={current.status}
              />
            )}

            {current.id === "pull-model" && (
              <PullModelStep
                pullProgress={pullProgress}
                onRun={() => runStep(currentStep)}
                onNext={nextStep}
                status={current.status}
              />
            )}

            {current.id === "create-model" && (
              <CreateModelStep
                onRun={() => runStep(currentStep)}
                onNext={nextStep}
                status={current.status}
              />
            )}

            {current.id === "test-inference" && (
              <TestInferenceStep
                testResponse={testResponse}
                onRun={() => runStep(currentStep)}
                status={current.status}
              />
            )}

            {current.id === "add-alias" && (
              <AliasStep
                onRun={() => runStep(currentStep)}
                onSkip={nextStep}
                status={current.status}
              />
            )}

            {current.id === "done" && <DoneStep />}
          </div>
        </div>
      </div>

      <LogDrawer logs={logs} logsEndRef={logsEndRef} />
    </div>
  );
}
