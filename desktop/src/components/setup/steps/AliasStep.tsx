import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AliasStepProps {
  onRun: () => void;
  onSkip: () => void;
  status: string;
}

export function AliasStep({ onRun, onSkip, status }: AliasStepProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Add a <code className="rounded bg-muted px-1.5 py-0.5 text-xs">daemon</code> shell alias so you can run Daemon from any terminal.
      </p>

      {status === "pending" && (
        <div className="flex gap-2">
          <Button onClick={onRun} className="flex-1">
            Add Alias
          </Button>
          <Button onClick={onSkip} variant="outline" className="flex-1">
            Skip
          </Button>
        </div>
      )}

      {status === "running" && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Adding shell alias...
        </div>
      )}

      {status === "done" && (
        <div className="rounded-lg border border-success/30 bg-success/5 p-4 text-sm">
          Shell alias added. You can now type <code className="rounded bg-muted px-1.5 py-0.5 text-xs">daemon</code> in your terminal.
        </div>
      )}

      {status === "error" && (
        <div className="space-y-4">
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            Failed to add alias. You can add it manually or skip this step.
          </div>
          <div className="flex gap-2">
            <Button onClick={onRun} variant="outline" className="flex-1">
              Retry
            </Button>
            <Button onClick={onSkip} variant="ghost" className="flex-1">
              Skip
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
