import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface TestInferenceStepProps {
  testResponse: string | null;
  onRun: () => void;
  status: string;
}

export function TestInferenceStep({
  testResponse,
  onRun,
  status,
}: TestInferenceStepProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Send a test prompt to verify the Daemon model is working.
      </p>

      {status === "pending" && (
        <Button onClick={onRun} className="w-full">
          Run Test
        </Button>
      )}

      {status === "running" && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Waiting for response...
        </div>
      )}

      {status === "done" && testResponse && (
        <div className="space-y-4">
          <div className="rounded-lg border p-4">
            <div className="text-xs text-muted-foreground mb-2">
              Daemon's response:
            </div>
            <div className="text-sm">{testResponse}</div>
          </div>
          <div className="rounded-lg border border-success/30 bg-success/5 p-4 text-sm">
            Setup complete! Daemon is ready to use.
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate("/chat")} className="flex-1">
              Open Chat
            </Button>
            <Button onClick={() => navigate("/")} variant="outline" className="flex-1">
              Go Home
            </Button>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="space-y-4">
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            Inference test failed. Check the logs for details.
          </div>
          <Button onClick={onRun} variant="outline" className="w-full">
            Retry
          </Button>
        </div>
      )}
    </div>
  );
}
