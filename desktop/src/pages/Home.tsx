import { useNavigate } from "react-router-dom";
import { useAtomValue } from "jotai";
import { Wand2, MessageSquare, Circle, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ollamaStatusAtom, modelsAtom } from "@/store/atoms";
import { cn } from "@/lib/utils";

export default function Home() {
  const navigate = useNavigate();
  const status = useAtomValue(ollamaStatusAtom);
  const models = useAtomValue(modelsAtom);

  const hasDaemonModel = models.some(
    (m) => m.name === "daemon" || m.name.startsWith("daemon:")
  );

  const checks = [
    {
      label: "Ollama API",
      ok: status.api_reachable,
      detail: status.api_reachable ? "Running" : "Offline",
    },
    {
      label: "Daemon model",
      ok: hasDaemonModel,
      detail: hasDaemonModel ? "Available" : "Not found",
    },
  ];

  const allHealthy = checks.every((c) => c.ok);

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Daemon</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Your local AI assistant — private, fast, and fully offline.
        </p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => navigate("/setup")}
          className="flex items-center gap-3 rounded-xl border p-4 text-left hover:bg-accent transition-colors"
        >
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
            <Wand2 className="size-5 text-primary" />
          </div>
          <div>
            <div className="font-medium text-sm">Run Setup</div>
            <div className="text-xs text-muted-foreground">
              Install & configure Daemon
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
            <div className="font-medium text-sm">Open Chat</div>
            <div className="text-xs text-muted-foreground">
              Talk to your local AI
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
