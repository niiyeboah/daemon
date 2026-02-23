import { Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettings } from "@/hooks/useSettings";

export function StatusBar() {
  const { openrouterApiKey, taskComplexity } = useSettings();

  const isConfigured = !!openrouterApiKey;

  // We consider "api_reachable" effectively true if the key exists for the sake of the status bar.
  // Proper validation happens during chat.

  return (
    <div className="flex items-center gap-4 border-t px-4 py-1.5 text-xs text-muted-foreground bg-background">
      <div className="flex items-center gap-1.5">
        <span>OpenRouter:</span>
        <Circle
          className={cn(
            "size-2 fill-current",
            isConfigured ? "text-success" : "text-destructive"
          )}
        />
        <span>{isConfigured ? "Configured" : "Offline / Missing Key"}</span>
      </div>
      {isConfigured && (
        <div className="flex items-center gap-1.5">
          <span>Task Complexity:</span>
          <span className="font-medium text-foreground capitalize">{taskComplexity}</span>
        </div>
      )}
    </div>
  );
}
