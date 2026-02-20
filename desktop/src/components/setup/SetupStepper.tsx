import { Check, Circle, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SetupStep } from "@/hooks/useSetup";

interface SetupStepperProps {
  steps: SetupStep[];
  currentStep: number;
  onStepClick: (index: number) => void;
}

function StepIcon({ status }: { status: SetupStep["status"] }) {
  switch (status) {
    case "done":
      return <Check className="size-4 text-success" />;
    case "running":
      return <Loader2 className="size-4 animate-spin text-primary" />;
    case "error":
      return <X className="size-4 text-destructive" />;
    default:
      return <Circle className="size-4 text-muted-foreground" />;
  }
}

export function SetupStepper({
  steps,
  currentStep,
  onStepClick,
}: SetupStepperProps) {
  return (
    <div className="flex flex-col gap-1">
      {steps.map((step, index) => (
        <button
          key={step.id}
          onClick={() => onStepClick(index)}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
            "hover:bg-accent",
            index === currentStep && "bg-accent font-medium"
          )}
        >
          <div className="flex size-6 items-center justify-center rounded-full border">
            <StepIcon status={step.status} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="truncate">{step.label}</div>
            <div className="text-xs text-muted-foreground truncate">
              {step.description}
            </div>
          </div>
          {step.optional && (
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Optional
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
