import { useEffect } from "react";
import { Button } from "@/components/ui/button";

interface OnboardStepProps {
  onRun: () => void;
  onNext: () => void;
  status: string;
}

export function OnboardStep({ onRun, onNext, status }: OnboardStepProps) {
  useEffect(() => {
    if (status === "pending") {
      onRun();
    }
  }, [status, onRun]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Running OpenClaw onboarding to set up the daemon integration.
      </p>

      {status === "running" && (
        <div className="rounded-lg border p-4 text-sm text-muted-foreground">
          Running onboarding... Check the logs below for progress.
        </div>
      )}

      {status === "done" && (
        <div className="space-y-4">
          <div className="rounded-lg border border-success/30 bg-success/5 p-4 text-sm">
            Onboarding complete.
          </div>
          <Button onClick={onNext} className="w-full">
            Continue
          </Button>
        </div>
      )}

      {status === "error" && (
        <div className="space-y-4">
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            Onboarding failed. Check the logs for details.
          </div>
          <Button onClick={onRun} variant="outline" className="w-full">
            Retry
          </Button>
        </div>
      )}
    </div>
  );
}
