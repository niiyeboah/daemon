import { useNavigate } from "react-router-dom";
import { MessageSquare, Activity, PartyPopper } from "lucide-react";

export function DoneStep() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-full bg-success/10">
          <PartyPopper className="size-5 text-success" />
        </div>
        <div>
          <h3 className="font-medium">Setup Complete</h3>
          <p className="text-sm text-muted-foreground">
            Daemon is installed and ready to go.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => navigate("/chat")}
          className="flex items-center gap-3 rounded-xl border p-4 text-left hover:bg-accent transition-colors"
        >
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
            <MessageSquare className="size-4 text-primary" />
          </div>
          <div>
            <div className="font-medium text-sm">Open Chat</div>
            <div className="text-xs text-muted-foreground">
              Talk to your local AI
            </div>
          </div>
        </button>

        <button
          onClick={() => navigate("/diagnostics")}
          className="flex items-center gap-3 rounded-xl border p-4 text-left hover:bg-accent transition-colors"
        >
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
            <Activity className="size-4 text-primary" />
          </div>
          <div>
            <div className="font-medium text-sm">Diagnostics</div>
            <div className="text-xs text-muted-foreground">
              Check system health
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
