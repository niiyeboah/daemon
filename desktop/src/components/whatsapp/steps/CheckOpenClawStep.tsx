import { useEffect } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CheckOpenClawStepProps {
  openclawInstalled: boolean;
  gatewayRunning: boolean;
  onRun: () => void;
  onNext: () => void;
  status: string;
}

export function CheckOpenClawStep({
  openclawInstalled,
  gatewayRunning,
  onRun,
  onNext,
  status,
}: CheckOpenClawStepProps) {
  useEffect(() => {
    if (status === "pending") {
      onRun();
    }
  }, [status, onRun]);

  if (status === "running") {
    return (
      <p className="text-sm text-muted-foreground">
        Checking OpenClaw installation and gateway status...
      </p>
    );
  }

  if (status === "done") {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            {openclawInstalled ? (
              <Check className="size-4 text-success" />
            ) : (
              <X className="size-4 text-destructive" />
            )}
            <span>
              OpenClaw {openclawInstalled ? "installed" : "not installed"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            {gatewayRunning ? (
              <Check className="size-4 text-success" />
            ) : (
              <X className="size-4 text-destructive" />
            )}
            <span>
              Gateway {gatewayRunning ? "running" : "not running"}
            </span>
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
          Failed to check OpenClaw status.
        </div>
        <Button onClick={onRun} variant="outline" className="w-full">
          Retry
        </Button>
      </div>
    );
  }

  return null;
}
