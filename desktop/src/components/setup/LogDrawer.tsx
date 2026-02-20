import { useState } from "react";
import { ChevronDown, ChevronUp, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LogDrawerProps {
  logs: string[];
  logsEndRef: React.RefObject<HTMLDivElement | null>;
}

export function LogDrawer({ logs, logsEndRef }: LogDrawerProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-t">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 px-4 py-2 text-xs text-muted-foreground hover:bg-accent transition-colors"
      >
        <Terminal className="size-3" />
        <span>Logs ({logs.length})</span>
        {expanded ? (
          <ChevronDown className="size-3 ml-auto" />
        ) : (
          <ChevronUp className="size-3 ml-auto" />
        )}
      </button>
      {expanded && (
        <div className="max-h-48 overflow-auto bg-muted/50 px-4 py-2 font-mono text-xs">
          {logs.length === 0 && (
            <div className="text-muted-foreground">No logs yet</div>
          )}
          {logs.map((log, i) => (
            <div key={i} className="py-0.5 text-muted-foreground">
              {log}
            </div>
          ))}
          <div ref={logsEndRef} />
        </div>
      )}
    </div>
  );
}
