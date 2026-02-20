import { useEffect } from "react";
import { Monitor, Apple, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DetectOsStepProps {
  detectedOs: string | null;
  onRun: () => void;
  onNext: () => void;
  status: string;
}

const osIcons: Record<string, typeof Monitor> = {
  macos: Apple,
  linux: Terminal,
  windows: Monitor,
};

const osLabels: Record<string, string> = {
  macos: "macOS",
  linux: "Linux",
  windows: "Windows",
};

export function DetectOsStep({ detectedOs, onRun, onNext, status }: DetectOsStepProps) {
  useEffect(() => {
    if (status === "pending") {
      onRun();
    }
  }, [status, onRun]);

  const Icon = detectedOs ? osIcons[detectedOs] ?? Monitor : Monitor;
  const label = detectedOs ? osLabels[detectedOs] ?? detectedOs : "Detecting...";

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Detecting your operating system to provide platform-specific guidance.
      </p>

      {detectedOs && (
        <div className="flex items-center gap-3 rounded-lg border p-4">
          <Icon className="size-8 text-primary" />
          <div>
            <div className="font-medium">{label}</div>
            <div className="text-sm text-muted-foreground">
              Platform detected successfully
            </div>
          </div>
        </div>
      )}

      {status === "done" && (
        <Button onClick={onNext} className="w-full">
          Continue
        </Button>
      )}
    </div>
  );
}
