import { useEffect } from "react";
import { Button } from "@/components/ui/button";

interface ConfigureModelStepProps {
  onRun: () => void;
  onNext: () => void;
  status: string;
}

export function ConfigureModelStep({
  onRun,
  onNext,
  status,
}: ConfigureModelStepProps) {
  useEffect(() => {
    if (status === "pending") {
      onRun();
    }
  }, [status, onRun]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Configuring <code className="rounded bg-muted px-1.5 py-0.5 text-xs">ollama/daemon</code> as
        the default model for OpenClaw.
      </p>

      {status === "running" && (
        <div className="rounded-lg border p-4 text-sm text-muted-foreground">
          Writing configuration...
        </div>
      )}

      {status === "done" && (
        <div className="space-y-4">
          <div className="rounded-lg border border-success/30 bg-success/5 p-4 text-sm space-y-1">
            <div>Model configured successfully.</div>
            <div className="text-xs text-muted-foreground font-mono">
              provider: ollama | model: ollama/daemon | context: 32768 | max tokens: 8192
            </div>
          </div>
          <Button onClick={onNext} className="w-full">
            Continue
          </Button>
        </div>
      )}

      {status === "error" && (
        <div className="space-y-4">
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            Failed to configure model. Check the logs for details.
          </div>
          <Button onClick={onRun} variant="outline" className="w-full">
            Retry
          </Button>
        </div>
      )}
    </div>
  );
}
