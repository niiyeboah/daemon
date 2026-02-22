import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import type { PullProgress } from "@/hooks/useSetup";

interface PullModelStepProps {
  pullProgress: PullProgress;
  onRun: () => void;
  onNext: () => void;
  status: string;
  baseModel?: string;
}

export function PullModelStep({
  pullProgress,
  onRun,
  onNext,
  status,
  baseModel = "qwen2.5-coder:7b",
}: PullModelStepProps) {
  useEffect(() => {
    if (status === "pending") {
      onRun();
    }
  }, [status, onRun]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Downloading the {baseModel} base model. This may take a few minutes
        depending on your connection.
      </p>

      {status === "running" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{pullProgress.status || "Starting download..."}</span>
            <span className="font-mono">{pullProgress.percent}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${pullProgress.percent}%` }}
            />
          </div>
        </div>
      )}

      {status === "done" && (
        <div className="space-y-4">
          <div className="rounded-lg border border-success/30 bg-success/5 p-4 text-sm">
            Model downloaded successfully.
          </div>
          <Button onClick={onNext} className="w-full">
            Continue
          </Button>
        </div>
      )}

      {status === "error" && (
        <div className="space-y-4">
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            Failed to download model. Check the logs for details.
          </div>
          <Button onClick={onRun} variant="outline" className="w-full">
            Retry
          </Button>
        </div>
      )}
    </div>
  );
}
