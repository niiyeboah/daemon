import { useEffect } from "react";
import { Button } from "@/components/ui/button";

interface RestartGatewayStepProps {
  onRun: () => void;
  onNext: () => void;
  status: string;
}

export function RestartGatewayStep({
  onRun,
  onNext,
  status,
}: RestartGatewayStepProps) {
  useEffect(() => {
    if (status === "pending") {
      onRun();
    }
  }, [status, onRun]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Restarting the OpenClaw gateway to apply the new configuration.
      </p>

      {status === "running" && (
        <div className="rounded-lg border p-4 text-sm text-muted-foreground">
          Restarting gateway...
        </div>
      )}

      {status === "done" && (
        <div className="space-y-4">
          <div className="rounded-lg border border-success/30 bg-success/5 p-4 text-sm">
            Gateway restarted successfully.
          </div>
          <Button onClick={onNext} className="w-full">
            Continue
          </Button>
        </div>
      )}

      {status === "error" && (
        <div className="space-y-4">
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            Failed to restart gateway. Check the logs for details.
          </div>
          <Button onClick={onRun} variant="outline" className="w-full">
            Retry
          </Button>
        </div>
      )}
    </div>
  );
}
