import { useEffect, useRef, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConnectWhatsAppStepProps {
  qrData: string | null;
  onRun: () => void;
  onNext: () => void;
  status: string;
}

// Unicode block chars used in terminal QR codes
const FULL = "\u2588";   // █ full block
const LOWER = "\u2584";  // ▄ lower half (2:1 mode)
const UPPER = "\u2580";  // ▀ upper half (2:1 mode)
const DARK = "\u2593";   // ▓ dark shade
const MED = "\u2592";    // ▒ medium shade
const LIGHT = "\u2591";  // ░ light shade

/** Returns [topBlack, bottomBlack] for a char. In 1:1 mode both are same. */
function charToPixels(ch: string, halfBlockMode: boolean): [boolean, boolean] {
  const dark = ch !== " " && ch !== "\u00a0" && ch !== LIGHT;
  if (!halfBlockMode) return [dark, dark];
  if (ch === UPPER) return [true, false];
  if (ch === LOWER) return [false, true];
  return [dark, dark];
}

/**
 * Renders terminal ASCII QR onto a canvas. Supports:
 * - 2:1 half-block mode (█▄▀): each terminal line = 2 QR rows
 * - 1:1 full-block mode (█ + space): each char = 1 module
 */
function renderAsciiQr(canvas: HTMLCanvasElement, ascii: string) {
  const lines = ascii.split("\n").filter((l) => l.length > 0);
  if (lines.length === 0) return;

  const termRows = lines.length;
  const cols = Math.max(...lines.map((l) => l.length));
  const halfBlockMode = lines.some((l) => l.includes(LOWER) || l.includes(UPPER));
  const qrRows = halfBlockMode ? termRows * 2 : termRows;
  const size = Math.max(qrRows, cols);
  const scale = Math.max(2, Math.floor(300 / size));

  canvas.width = cols * scale;
  canvas.height = qrRows * scale;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#000000";
  for (let ty = 0; ty < termRows; ty++) {
    const line = lines[ty];
    for (let x = 0; x < line.length; x++) {
      const [top, bottom] = charToPixels(line[x], halfBlockMode);
      const px = x * scale;
      if (halfBlockMode) {
        const pyTop = ty * 2 * scale;
        const pyBottom = (ty * 2 + 1) * scale;
        if (top) ctx.fillRect(px, pyTop, scale, scale);
        if (bottom) ctx.fillRect(px, pyBottom, scale, scale);
      } else {
        if (top) ctx.fillRect(px, ty * scale, scale, scale);
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
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="text-sm text-muted-foreground">
            Waiting for QR code...
          </div>
          <p className="text-xs text-muted-foreground text-center max-w-sm">
            If the QR never appears, the gateway may not be reachable. Try{" "}
            <a
              href="http://127.0.0.1:18789/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline hover:no-underline"
            >
              OpenClaw Control UI
            </a>{" "}
            — it shows the QR when the gateway is running. Or run{" "}
            <code className="text-xs bg-muted px-1 rounded">openclaw gateway start</code>{" "}
            in a terminal.
          </p>
        </div>
      )}

      {qrData && (
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-xl border bg-white p-4">
            <canvas ref={canvasRef} className="block" />
          </div>
          <div className="text-xs text-muted-foreground text-center space-y-2">
            <p>
              Open WhatsApp on your phone, go to Settings &gt; Linked Devices
              &gt; Link a Device, and scan this code.
            </p>
            <p>
              If the QR doesn&apos;t scan, try the{" "}
              <a
                href="http://127.0.0.1:18789/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline hover:no-underline"
              >
                OpenClaw Control UI
              </a>{" "}
              — it shows a proper QR when the gateway is running.
            </p>
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
