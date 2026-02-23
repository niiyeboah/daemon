import { Button } from "@/components/ui/button";

interface ChooseBaseModelStepProps {
  onNext: () => void;
  status: string;
}

export function ChooseBaseModelStep({
  onNext,
  status,
}: ChooseBaseModelStepProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Choose the base model to download and use for Daemon.
      </p>

      <div className="space-y-2">
        <div className="flex w-full flex-col items-start rounded-lg border px-4 py-3 text-left transition-colors sm:flex-row sm:items-center sm:gap-3">
          <span className="font-medium">Daemon OpenRouter</span>
          <span className="text-xs text-muted-foreground">Setup cloud APIs in settings</span>
        </div>
      </div>

      {(status === "pending" || status === "done") && (
        <Button onClick={onNext} className="w-full">
          Continue
        </Button>
      )}
    </div>
  );
}
