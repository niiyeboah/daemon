import { useEffect, useRef, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConnectWhatsAppStepProps {
  qrData: string | null;
  onRun: () => void;
  onNext: () => void;
  status: string;
}

/**
 * Renders ASCII QR code (block characters) onto a canvas as a clean pixel grid.
 * Each character maps to a 2x2 pixel block (dark = block char, light = space).
 */
function renderAsciiQr(canvas: HTMLCanvasElement, ascii: string) {
  const lines = ascii.split("\n").filter((l) => l.length > 0);
  if (lines.length === 0) return;

  const rows = lines.length;
  const cols = Math.max(...lines.map((l) => l.length));
  const scale = Math.max(2, Math.floor(300 / Math.max(rows, cols)));

  canvas.width = cols * scale;
  canvas.height = rows * scale;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // White background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#000000";
  for (let y = 0; y < rows; y++) {
    const line = lines[y];
    for (let x = 0; x < line.length; x++) {
      const ch = line[x];
      // Dark module: any block character
      if (ch !== " " && ch !== "\u00a0") {
        ctx.fillRect(x * scale, y * scale, scale, scale);
      }
    }
  }
}

export function ConnectWhatsAppStep({
  qrData,
  onRun,
  onNext,
  status,
}: ConnectWhatsAppStepProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (status === "pending") {
      onRun();
    }
  }, [status, onRun]);

  useEffect(() => {
    if (qrData && canvasRef.current) {
      renderAsciiQr(canvasRef.current, qrData);
    }
  }, [qrData]);

  const handleRefresh = useCallback(() => {
    onRun();
  }, [onRun]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Scan the QR code below with your WhatsApp app to link your account.
      </p>

      {status === "running" && !qrData && (
        <div className="flex items-center justify-center py-12">
          <div className="text-sm text-muted-foreground">
            Waiting for QR code...
          </div>
        </div>
      )}

      {qrData && (
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-xl border bg-white p-4">
            <canvas ref={canvasRef} className="block" />
          </div>
          <div className="text-xs text-muted-foreground text-center">
            Open WhatsApp on your phone, go to Settings &gt; Linked Devices &gt;
            Link a Device, and scan this code.
          </div>
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <RefreshCw className="size-3" />
            Refresh QR Code
          </Button>
        </div>
      )}

      {status === "done" && (
        <div className="space-y-4">
          <div className="rounded-lg border border-success/30 bg-success/5 p-4 text-sm">
            WhatsApp connected successfully.
          </div>
          <Button onClick={onNext} className="w-full">
            Continue
          </Button>
        </div>
      )}

      {status === "error" && (
        <div className="space-y-4">
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            Failed to connect WhatsApp. Check the logs for details.
          </div>
          <Button onClick={onRun} variant="outline" className="w-full">
            Retry
          </Button>
        </div>
      )}
    </div>
  );
}
