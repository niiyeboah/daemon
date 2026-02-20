import { ExternalLink, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InstallOllamaStepProps {
  detectedOs: string | null;
  onRecheck: () => void;
  onNext: () => void;
  status: string;
}

export function InstallOllamaStep({
  detectedOs,
  onRecheck,
  onNext,
  status,
}: InstallOllamaStepProps) {
  if (status === "done") {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-success/30 bg-success/5 p-4 text-sm">
          Ollama is installed and running.
        </div>
        <Button onClick={onNext} className="w-full">
          Continue
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Ollama needs to be installed on your system. Follow the instructions
        below, then click "Check again".
      </p>

      <div className="rounded-lg border p-4 space-y-3">
        <div className="font-medium text-sm">Installation Instructions</div>

        {detectedOs === "macos" && (
          <div className="text-sm text-muted-foreground space-y-2">
            <p>Download and install from the official website:</p>
            <a
              href="https://ollama.com/download/mac"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              Download Ollama for macOS <ExternalLink className="size-3" />
            </a>
          </div>
        )}

        {detectedOs === "linux" && (
          <div className="text-sm text-muted-foreground space-y-2">
            <p>Run the install script in your terminal:</p>
            <code className="block rounded bg-muted px-3 py-2 text-xs">
              curl -fsSL https://ollama.com/install.sh | sh
            </code>
          </div>
        )}

        {detectedOs === "windows" && (
          <div className="text-sm text-muted-foreground space-y-2">
            <p>Download and install from the official website:</p>
            <a
              href="https://ollama.com/download/windows"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              Download Ollama for Windows <ExternalLink className="size-3" />
            </a>
          </div>
        )}

        {!detectedOs && (
          <div className="text-sm text-muted-foreground">
            <p>
              Visit{" "}
              <a
                href="https://ollama.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                ollama.com
              </a>{" "}
              to download and install Ollama for your platform.
            </p>
          </div>
        )}
      </div>

      <Button onClick={onRecheck} variant="outline" className="w-full gap-2">
        <RefreshCw className="size-4" />
        Check again
      </Button>
    </div>
  );
}
