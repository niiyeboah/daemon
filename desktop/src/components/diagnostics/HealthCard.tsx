import { useState } from "react";
import {
  AlertTriangle,
  Circle,
  ChevronDown,
  ChevronUp,
  Server,
  Cpu,
  HardDrive,
  Zap,
  Gauge,
  Database,
  MemoryStick,
  Globe,
  Box,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DiagnosticCheck } from "@/types";

const ICONS: Record<string, React.ElementType> = {
  "ollama-installed": Server,
  "ollama-api": Globe,
  "base-model": Database,
  "daemon-model": Box,
  "deprecated-1b-model": AlertTriangle,
  "model-loaded": MemoryStick,
  inference: Zap,
  "inference-speed": Gauge,
  "system-ram": Cpu,
  "disk-space": HardDrive,
  "openclaw-installed": Server,
  "openclaw-gateway": Activity,
};

const STATUS_COLORS: Record<string, string> = {
  pass: "text-success",
  warn: "text-warning",
  fail: "text-destructive",
};

interface HealthCardProps {
  check: DiagnosticCheck;
  onAction?: (command: string) => void;
}

export function HealthCard({ check, onAction }: HealthCardProps) {
  const [expanded, setExpanded] = useState(false);
  const Icon = ICONS[check.id] || Activity;

  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
      <div className="flex items-start gap-3 p-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
          <Icon className="size-4 text-muted-foreground" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Circle
              className={cn(
                "size-2 shrink-0 fill-current",
                STATUS_COLORS[check.status]
              )}
            />
            <span className="text-sm font-medium truncate">{check.name}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {check.message}
          </p>
          {check.metric && (
            <p className="text-xs font-medium mt-1">{check.metric}</p>
          )}
        </div>

        {check.detail && (
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setExpanded(!expanded)}
            className="shrink-0"
          >
            {expanded ? (
              <ChevronUp className="size-3.5" />
            ) : (
              <ChevronDown className="size-3.5" />
            )}
          </Button>
        )}
      </div>

      {expanded && check.detail && (
        <div className="border-t px-4 py-3">
          <pre className="text-xs text-muted-foreground whitespace-pre-wrap break-all max-h-32 overflow-y-auto">
            {check.detail}
          </pre>
        </div>
      )}

      {check.action && onAction && (
        <div className="border-t px-4 py-2">
          <Button
            variant="outline"
            size="xs"
            onClick={() => onAction(check.action!.command)}
          >
            {check.action.label}
          </Button>
        </div>
      )}
    </div>
  );
}
