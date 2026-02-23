import { useState, useCallback, useEffect, useRef } from "react";
import type { DiagnosticsReport, SystemInfo } from "@/types";
import { diagnosticsFull, systemInfo, openclawGatewayRestart } from "@/lib/tauri";
import { useSettings } from "@/hooks/useSettings";

const DIAGNOSTICS_POLL_INTERVAL = 10_000; // 10 seconds

export function useDiagnostics() {
  const [report, setReport] = useState<DiagnosticsReport | null>(null);
  const [sysInfo, setSysInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(DIAGNOSTICS_POLL_INTERVAL / 1000);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { openrouterApiKey } = useSettings();

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [diagResult, sysResult] = await Promise.all([
        diagnosticsFull(openrouterApiKey),
        systemInfo(),
      ]);
      setReport(diagResult);
      setSysInfo(sysResult);
    } catch (err) {
      console.error("Diagnostics fetch failed:", err);
    } finally {
      setLoading(false);
      setCountdown(DIAGNOSTICS_POLL_INTERVAL / 1000);
    }
  }, [openrouterApiKey]);

  // Auto-refresh polling
  useEffect(() => {
    refresh();

    intervalRef.current = setInterval(refresh, DIAGNOSTICS_POLL_INTERVAL);
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : DIAGNOSTICS_POLL_INTERVAL / 1000));
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [refresh]);

  const handleAction = useCallback(
    async (command: string) => {
      try {
        switch (command) {
          case "start-openclaw-gateway":
            await openclawGatewayRestart();
            break;
          default:
            console.warn("Unknown diagnostic action:", command);
            return;
        }
        await refresh();
      } catch (err) {
        console.error("Diagnostic action failed:", err);
      }
    },
    [refresh]
  );

  return { report, sysInfo, loading, countdown, refresh, handleAction };
}
