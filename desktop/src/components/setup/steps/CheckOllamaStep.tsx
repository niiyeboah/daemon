import { useEffect } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CheckOllamaStepProps {
  ollamaReachable: boolean;
  onRun: () => void;
  onNext: () => void;
  status: string;
}

export function CheckOllamaStep({
  ollamaReachable,
  onRun,
  onNext,
  status,
}: CheckOllamaStepProps) {
  useEffect(() => {
    if (status === "pending") {
      onRun();
    }
  }, [status, onRun]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Checking if Ollama is installed and the API is reachable.
      </p>

      {status === "done" && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 rounded-lg border p-3">
            {ollamaReachable ? (
              <Check className="size-4 text-success" />
            ) : (
              <X className="size-4 text-destructive" />
            )}
            <span className="text-sm">
              Ollama API: {ollamaReachable ? "Reachable" : "Not reachable"}
            </span>
          </div>

          <Button onClick={onNext} className="w-full">
            Continue
          </Button>
        </div>
      )}
    </div>
  );
}
