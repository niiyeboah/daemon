import { useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SetupInstallOpenClawStepProps {
  openclawChecked: boolean;
  openclawInstalled: boolean;
  onRun: () => void;
  onRecheck: () => void;
  onNext: () => void;
  status: string;
}

export function SetupInstallOpenClawStep({
  openclawChecked,
  openclawInstalled,
  onRun,
  onRecheck,
  onNext,
  status,
}: SetupInstallOpenClawStepProps) {
  // Auto-check on mount only — guard with openclawChecked to avoid re-triggering
  useEffect(() => {
    if (status === "pending" && !openclawChecked) {
      onRun();
    }
  }, [status, openclawChecked, onRun]);

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
          {openclawChecked ? "Installing OpenClaw…" : "Checking for OpenClaw…"}
        </p>
        {openclawChecked && (
          <div className="rounded-lg border p-4 space-y-2 text-sm text-muted-foreground">
            <p>If automatic installation fails, run this in your terminal:</p>
            <code className="block rounded bg-muted px-3 py-2 text-xs font-mono">
              curl -fsSL https://openclaw.ai/install.sh | bash
            </code>
          </div>
        )}
      </div>
    );
  }

  // Checked but not installed — show install button
  if (status === "pending" && openclawChecked && !openclawInstalled) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          OpenClaw was not found in PATH.
        </p>
        <div className="rounded-lg border p-4 space-y-2 text-sm text-muted-foreground">
          <p>Or install manually in your terminal:</p>
          <code className="block rounded bg-muted px-3 py-2 text-xs font-mono">
            curl -fsSL https://openclaw.ai/install.sh | bash
          </code>
        </div>
        <div className="flex gap-2">
          <Button onClick={onRun} className="flex-1">
            Install OpenClaw
          </Button>
          <Button onClick={onRecheck} variant="outline" className="gap-2">
            <RefreshCw className="size-4" />
            Check
          </Button>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Installation failed. Try installing manually.
        </div>
        <code className="block rounded bg-muted px-3 py-2 text-xs font-mono">
          curl -fsSL https://openclaw.ai/install.sh | bash
        </code>
        <Button onClick={onRecheck} variant="outline" className="w-full gap-2">
          <RefreshCw className="size-4" />
          Check again
        </Button>
      </div>
    );
  }

  return null;
}
