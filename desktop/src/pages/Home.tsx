import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Wand2, MessageSquare, Circle, Check, X, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSettings } from "@/hooks/useSettings";
import { openclawCheck } from "@/lib/tauri";
import type { OpenClawStatus } from "@/types";
import { cn } from "@/lib/utils";

export default function Home() {
  const navigate = useNavigate();
  const { openrouterApiKey } = useSettings();
  const [openclaw, setOpenclaw] = useState<OpenClawStatus | null>(null);

  useEffect(() => {
    openclawCheck()
      .then(setOpenclaw)
      .catch(() => {});
  }, []);

  const checks = [
    {
      label: "OpenRouter API Key",
      ok: !!openrouterApiKey,
      detail: openrouterApiKey ? "Configured" : "Missing — go to Settings",
    },
    {
      label: "OpenClaw Installed",
      ok: openclaw?.installed ?? false,
      detail:
        openclaw === null
          ? "Checking…"
          : openclaw.installed
            ? "Installed"
            : "Not found — run Setup",
    },
    {
      label: "OpenClaw Gateway",
      ok: openclaw?.gateway_running ?? false,
      detail:
        openclaw === null
          ? "Checking…"
          : openclaw.gateway_running
            ? "Running"
            : "Not running",
    },
  ];

  const allHealthy = checks.every((c) => c.ok);

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Daemon</h1>
        <p className="text-muted-foreground text-sm mt-1">
          OpenClaw automation & diagnostics — powered by OpenRouter.
        </p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-4">
        <button
          onClick={() => navigate("/setup")}
          className="flex items-center gap-3 rounded-xl border p-4 text-left hover:bg-accent transition-colors"
        >
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
            <Wand2 className="size-5 text-primary" />
          </div>
          <div>
            <div className="font-medium text-sm">Setup</div>
            <div className="text-xs text-muted-foreground">
              Configure Daemon
            </div>
          </div>
        </button>

        <button
          onClick={() => navigate("/chat")}
          className="flex items-center gap-3 rounded-xl border p-4 text-left hover:bg-accent transition-colors"
        >
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
            <MessageSquare className="size-5 text-primary" />
          </div>
          <div>
            <div className="font-medium text-sm">Chat</div>
            <div className="text-xs text-muted-foreground">
              Ask AI anything
            </div>
          </div>
        </button>

        <button
          onClick={() => navigate("/whatsapp")}
          className="flex items-center gap-3 rounded-xl border p-4 text-left hover:bg-accent transition-colors"
        >
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
            <Smartphone className="size-5 text-primary" />
          </div>
          <div>
            <div className="font-medium text-sm">WhatsApp</div>
            <div className="text-xs text-muted-foreground">
              Connect channel
            </div>
          </div>
        </button>
      </div>

      {/* System status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Circle
              className={cn(
                "size-2.5 fill-current",
                allHealthy ? "text-success" : "text-destructive"
              )}
            />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {checks.map((check) => (
              <div
                key={check.label}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2 text-sm">
                  {check.ok ? (
                    <Check className="size-4 text-success" />
                  ) : (
                    <X className="size-4 text-destructive" />
                  )}
                  <span>{check.label}</span>
                </div>
                <span
                  className={cn(
                    "text-xs",
                    check.ok ? "text-muted-foreground" : "text-destructive"
                  )}
                >
                  {check.detail}
                </span>
              </div>
            ))}
          </div>

          {!allHealthy && (
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-4"
              onClick={() => navigate("/setup")}
            >
              Run Setup to fix issues
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
