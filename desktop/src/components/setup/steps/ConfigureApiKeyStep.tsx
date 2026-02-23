import { useEffect } from "react";
import { Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ConfigureApiKeyStepProps {
  apiKeyInput: string;
  onChangeKey: (val: string) => void;
  onRun: () => void;
  onNext: () => void;
  status: string;
}

export function ConfigureApiKeyStep({
  apiKeyInput,
  onChangeKey,
  onRun,
  onNext,
  status,
}: ConfigureApiKeyStepProps) {
  // If a key is already saved, auto-test it on mount
  useEffect(() => {
    if (status === "pending" && apiKeyInput.trim()) {
      onRun();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (status === "done") {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-success/30 bg-success/5 p-4 text-sm">
          API key verified and saved.
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
        <p className="text-sm text-muted-foreground">Testing API key...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Enter your OpenRouter API key. Get one at{" "}
        <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
          openrouter.ai/keys
        </span>
        .
      </p>

      <div className="relative">
        <Key className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          type="password"
          placeholder="sk-or-v1-..."
          value={apiKeyInput}
          onChange={(e) => onChangeKey(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && apiKeyInput.trim()) onRun();
          }}
          className="pl-9 font-mono text-sm"
        />
      </div>

      {status === "error" && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          API key test failed — check the key and try again.
        </div>
      )}

      <Button onClick={onRun} disabled={!apiKeyInput.trim()} className="w-full">
        Test & Save
      </Button>
    </div>
  );
}
