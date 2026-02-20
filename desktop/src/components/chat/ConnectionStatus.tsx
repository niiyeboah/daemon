import { useAtomValue } from "jotai";
import { WifiOff, RefreshCw } from "lucide-react";
import { ollamaStatusAtom } from "@/store/atoms";
import { Button } from "@/components/ui/button";

interface ConnectionStatusProps {
  onReconnect: () => void;
}

export function ConnectionStatus({ onReconnect }: ConnectionStatusProps) {
  const status = useAtomValue(ollamaStatusAtom);

  if (status.api_reachable) return null;

  return (
    <div className="flex items-center justify-between gap-3 border-b bg-destructive/5 px-4 py-2">
      <div className="flex items-center gap-2 text-sm text-destructive">
        <WifiOff className="size-4" />
        <span>Ollama is not reachable. Start Ollama to use chat.</span>
      </div>
      <Button
        variant="outline"
        size="xs"
        onClick={onReconnect}
        className="shrink-0"
      >
        <RefreshCw className="size-3" />
        Reconnect
      </Button>
    </div>
  );
}
