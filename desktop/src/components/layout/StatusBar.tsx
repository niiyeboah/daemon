import { useAtomValue } from "jotai";
import { Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ollamaStatusAtom, selectedModelAtom } from "@/store/atoms";

export function StatusBar() {
  const status = useAtomValue(ollamaStatusAtom);
  const model = useAtomValue(selectedModelAtom);

  return (
    <div className="flex items-center gap-4 border-t px-4 py-1.5 text-xs text-muted-foreground bg-background">
      <div className="flex items-center gap-1.5">
        <span>Ollama:</span>
        <Circle
          className={cn(
            "size-2 fill-current",
            status.api_reachable ? "text-success" : "text-destructive"
          )}
        />
        <span>{status.api_reachable ? "Running" : "Offline"}</span>
      </div>
      {status.api_reachable && (
        <div className="flex items-center gap-1.5">
          <span>Model:</span>
          <span className="font-medium text-foreground">{model}</span>
        </div>
      )}
    </div>
  );
}
