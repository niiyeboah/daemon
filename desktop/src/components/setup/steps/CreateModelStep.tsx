import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CreateModelStepProps {
  onRun: () => void;
  onNext: () => void;
  status: string;
}

export function CreateModelStep({ onRun, onNext, status }: CreateModelStepProps) {
  useEffect(() => {
    if (status === "pending") {
      onRun();
    }
  }, [status, onRun]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Creating the Daemon model with a custom system prompt and parameters.
        This runs <code className="text-xs bg-muted px-1 py-0.5 rounded">daemon-setup init</code>.
      </p>

      {status === "running" && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Creating model...
        </div>
      )}

      {status === "done" && (
        <div className="space-y-4">
          <div className="rounded-lg border border-success/30 bg-success/5 p-4 text-sm">
            Daemon model created successfully.
          </div>
          <Button onClick={onNext} className="w-full">
            Continue
          </Button>
        </div>
      )}

      {status === "error" && (
        <div className="space-y-4">
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            Failed to create model. Check the logs for details.
          </div>
          <Button onClick={onRun} variant="outline" className="w-full">
            Retry
          </Button>
        </div>
      )}
    </div>
  );
}
