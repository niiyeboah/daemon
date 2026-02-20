import { useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InstallOpenClawStepProps {
  openclawInstalled: boolean;
  onRun: () => void;
  onRecheck: () => void;
  onNext: () => void;
  status: string;
}

export function InstallOpenClawStep({
  openclawInstalled,
  onRun,
  onRecheck,
  onNext,
  status,
}: InstallOpenClawStepProps) {
  useEffect(() => {
    if (status === "pending" && !openclawInstalled) {
      onRun();
    }
  }, [status, openclawInstalled, onRun]);

  if (status === "done") {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-success/30 bg-success/5 p-4 text-sm">
          OpenClaw is installed.
        </div>
        <Button onClick={onNext} className="w-full">
          Continue
        </Button>
      </div>
    );
  }

  if (status === "running") {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Installing OpenClaw... This may take a minute.
        </p>
        <div className="rounded-lg border p-4 space-y-3">
          <div className="font-medium text-sm">Manual Installation</div>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>If automatic installation fails, run this in your terminal:</p>
            <code className="block rounded bg-muted px-3 py-2 text-xs font-mono">
              curl -fsSL https://openclaw.ai/install.sh | bash
            </code>
          </div>
        </div>
        <Button onClick={onRecheck} variant="outline" className="w-full gap-2">
          <RefreshCw className="size-4" />
          Check again
        </Button>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Installation failed. Try installing manually.
        </div>
        <div className="rounded-lg border p-4 space-y-3">
          <div className="font-medium text-sm">Manual Installation</div>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>Run this in your terminal:</p>
            <code className="block rounded bg-muted px-3 py-2 text-xs font-mono">
              curl -fsSL https://openclaw.ai/install.sh | bash
            </code>
          </div>
        </div>
        <Button onClick={onRecheck} variant="outline" className="w-full gap-2">
          <RefreshCw className="size-4" />
          Check again
        </Button>
      </div>
    );
  }

  return null;
}
