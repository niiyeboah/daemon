import {
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Cpu,
  HardDrive,
  MemoryStick,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { HealthCard } from "@/components/diagnostics/HealthCard";
import { useDiagnostics } from "@/hooks/useDiagnostics";
import { cn } from "@/lib/utils";

function formatBytes(bytes: number): string {
  return `${(bytes / 1_073_741_824).toFixed(1)} GB`;
}

export default function Diagnostics() {
  const { report, sysInfo, loading, countdown, refresh, handleAction } =
    useDiagnostics();

  const issueCount = report
    ? report.checks.filter((c) => c.status !== "pass").length
    : 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Diagnostics</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            System health overview
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground tabular-nums">
            {countdown}s
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={loading}
          >
            <RefreshCw
              className={cn("size-3.5", loading && "animate-spin")}
            />
            Refresh
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Status banner */}
        {report && (
          <div
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium",
              report.overall_status === "healthy" &&
                "bg-success/10 text-success",
              report.overall_status === "degraded" &&
                "bg-warning/10 text-warning",
              report.overall_status === "unhealthy" &&
                "bg-destructive/10 text-destructive"
            )}
          >
            {report.overall_status === "healthy" && (
              <CheckCircle2 className="size-4" />
            )}
            {report.overall_status === "degraded" && (
              <AlertTriangle className="size-4" />
            )}
            {report.overall_status === "unhealthy" && (
              <XCircle className="size-4" />
            )}
            {report.overall_status === "healthy"
              ? "All systems operational"
              : `${issueCount} issue${issueCount !== 1 ? "s" : ""} found`}
          </div>
        )}

        {/* Health check cards */}
        {report && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {report.checks.map((check) => (
              <HealthCard
                key={check.id}
                check={check}
                onAction={handleAction}
              />
            ))}
          </div>
        )}

        {/* System info */}
        {sysInfo && (
          <div>
            <h2 className="text-sm font-medium mb-3">System Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex items-center gap-3 rounded-xl border p-4">
                <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                  <MemoryStick className="size-4 text-muted-foreground" />
                </div>
                <div>
                  <div className="text-sm font-medium">RAM</div>
                  <div className="text-xs text-muted-foreground">
                    {formatBytes(sysInfo.used_ram)} /{" "}
                    {formatBytes(sysInfo.total_ram)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border p-4">
                <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                  <HardDrive className="size-4 text-muted-foreground" />
                </div>
                <div>
                  <div className="text-sm font-medium">Disk</div>
                  <div className="text-xs text-muted-foreground">
                    {formatBytes(sysInfo.free_disk)} free of{" "}
                    {formatBytes(sysInfo.total_disk)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border p-4">
                <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                  <Cpu className="size-4 text-muted-foreground" />
                </div>
                <div>
                  <div className="text-sm font-medium">CPU</div>
                  <div className="text-xs text-muted-foreground truncate max-w-[180px]">
                    {sysInfo.cpu_brand} ({sysInfo.cpu_count} cores)
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading state */}
        {!report && loading && (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="size-5 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">
              Running diagnostics...
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
