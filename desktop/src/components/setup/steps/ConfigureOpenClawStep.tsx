import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { OPENCLAW_DEFAULT_MODEL } from "@/store/constants";

interface ConfigureOpenClawStepProps {
  onRun: () => void;
  onNext: () => void;
  status: string;
}

export function ConfigureOpenClawStep({
  onRun,
  onNext,
  status,
}: ConfigureOpenClawStepProps) {
  useEffect(() => {
    if (status === "pending") {
      onRun();
    }
  }, [status, onRun]);

  if (status === "running") {
    return (
      <div className="rounded-lg border p-4 text-sm text-muted-foreground">
        Writing OpenClaw configuration…
      </div>
    );
  }

  if (status === "done") {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-success/30 bg-success/5 p-4 text-sm space-y-1">
          <div className="font-medium">OpenClaw configured successfully.</div>
          <div className="text-xs font-mono text-muted-foreground">
            model: openrouter/{OPENCLAW_DEFAULT_MODEL}
          </div>
          <div className="text-xs text-muted-foreground">
            Config: ~/.openclaw/openclaw.json
          </div>
        </div>
        <Button onClick={onNext} className="w-full">
          Continue
        </Button>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Failed to configure OpenClaw. Check the logs for details.
        </div>
        <Button onClick={onRun} variant="outline" className="w-full">
          Retry
        </Button>
      </div>
    );
  }

  return null;
}
