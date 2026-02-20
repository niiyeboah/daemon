import { useEffect } from "react";
import { Button } from "@/components/ui/button";

interface TestStepProps {
  onRun: () => void;
  onNext: () => void;
  status: string;
}

export function TestStep({ onRun, onNext, status }: TestStepProps) {
  useEffect(() => {
    if (status === "pending") {
      onRun();
    }
  }, [status, onRun]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Verifying the WhatsApp integration is working correctly.
      </p>

      {status === "running" && (
        <div className="rounded-lg border p-4 text-sm text-muted-foreground">
          Testing gateway connectivity...
        </div>
      )}

      {status === "done" && (
        <div className="space-y-4">
          <div className="rounded-lg border border-success/30 bg-success/5 p-4 text-sm">
            Integration test passed. The gateway is running and ready to handle
            WhatsApp messages.
          </div>
          <Button onClick={onNext} className="w-full">
            Continue
          </Button>
        </div>
      )}

      {status === "error" && (
        <div className="space-y-4">
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            Test failed. The gateway may not be running. Check the logs for
            details.
          </div>
          <Button onClick={onRun} variant="outline" className="w-full">
            Retry
          </Button>
        </div>
      )}
    </div>
  );
}
