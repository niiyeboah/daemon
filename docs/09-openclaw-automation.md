# 9 -- OpenClaw & Automation

Once Daemon is running (Ollama + [Daemon bot](05-daemon-bot.md)), you can add **OpenClaw** to give it channels, skills, and schedules. Think of Daemon as the brain — your local LLM — and OpenClaw as the layer that gives it "hands": messaging apps, automation skills, and scheduled jobs. Together they can act like a **personal employee** that works on your behalf.

---

## Prerequisites

- **Node.js 22 or newer** — OpenClaw runs on Node. Check with `node --version`.
- **Daemon (Ollama) already running** — Optional if you prefer to use OpenClaw with a cloud AI provider; for a fully local setup, keep [Ollama](04-ollama-llama.md) and your Daemon model running so OpenClaw can use it (if your OpenClaw version supports a local Ollama backend; see OpenClaw docs).
- **A messaging account** — e.g. Telegram, Discord, or Slack, for connecting a channel so you can talk to your assistant from your phone or desktop.

---

## Set up OpenClaw

### Install

**macOS / Linux:**

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

**Windows (PowerShell):**

```powershell
iwr -useb https://openclaw.ai/install.ps1 | iex
```

### First-time setup

Run the onboarding wizard to configure auth, gateway settings, and optional channels:

```bash
openclaw onboard --install-daemon
```

Alternatively, run `openclaw setup`, then `openclaw channels login` for each channel you want. See [OpenClaw Setup](https://docs.openclaw.ai/setup) and [Getting Started](https://docs.openclaw.ai/start/getting-started) for wizard details and non-interactive options.

### Check the gateway

```bash
openclaw gateway status
```

If the service is running, you can open the Control UI with `openclaw dashboard` or visit `http://127.0.0.1:18789/` in your browser.

---

## How to start automating

### 1. Connect a channel

Link a messaging app (Telegram, Discord, Slack, WhatsApp) so you can chat with your assistant from anywhere. After onboarding, use `openclaw channels login` for the services you want. Your "employee" can then read and reply on your behalf (within the permissions you configure). See [OpenClaw Channels](https://docs.openclaw.ai/channels) for per-platform setup.

### 2. Install skills

OpenClaw supports **skills** — pre-built workflows (e.g. summarisation, reminders, web lookup) from **ClawHub**. Install skills that match the tasks you want to automate so Daemon can execute them when you ask or when a job runs. Check the OpenClaw docs or ClawHub for available skills and how to add them to your workspace.

### 3. Set up scheduled jobs

Configure the Gateway so the assistant runs tasks on a schedule: e.g. daily briefings, reminder digests, or periodic checks. That way your personal employee works in the background even when you are not chatting. Use the OpenClaw dashboard or CLI to define jobs and triggers; see OpenClaw’s docs on job scheduling.

### 4. Run 24/7 (optional)

To have your assistant always on, run the OpenClaw Gateway 24/7 — for example on the same mini PC where Daemon (Ollama) runs, or on a VPS. On Linux, OpenClaw can be installed as a systemd user service; enable lingering if you want it to keep running after you log out: `sudo loginctl enable-linger $USER`. See [OpenClaw Setup](https://docs.openclaw.ai/setup) and the Gateway runbook for details.

---

## Model choice: use 1B on low-power hardware

On **low-power CPUs** (e.g. Intel N100/N150 in the Beelink Mini S13), OpenClaw needs a **larger context** (e.g. 16k tokens) and **faster inference**. The default 3B model at 16k context can be too slow and may trigger "inference times too slow" or timeouts. Use the **1B model** instead:

1. Pull the 1B model: `ollama pull llama3.2:1b`
2. Create a lighter Daemon variant: `daemon-setup init --lite` (creates the `daemon-lite` model with the same system prompt).
3. Point OpenClaw at `ollama/daemon-lite` in your config (see below). Use `contextWindow: 16384` and `maxTokens: 8192` in the explicit provider config.

You can keep **3B** (`daemon`) for direct terminal chat and use **1B** (`daemon-lite`) only for OpenClaw. See [Hardware](01-hardware.md#which-model-for-which-use) and [Daemon Bot](05-daemon-bot.md#daemon-lite-1b-for-openclaw).

---

## Connect local Ollama (Daemon) to OpenClaw

So that OpenClaw uses your existing Daemon (Ollama) instead of a cloud provider, configure the Ollama provider and set the default model. Restart the gateway after any config change: `openclaw gateway restart`.

**Prerequisite:** Ollama must be running and your chosen model available. Check with `ollama list` (you should see `daemon`, `daemon-lite`, or `llama3.2:3b` / `llama3.2:1b`).

### Option A — Auto-discovery

The simplest way is to let OpenClaw discover models from your local Ollama instance:

1. Set the API key (any non-empty value; Ollama does not validate it):

   ```bash
   export OLLAMA_API_KEY="ollama-local"
   ```

   To make it persistent, add that line to your shell profile (`~/.bashrc`, `~/.zshrc`) or set it in OpenClaw’s environment.

2. Do **not** define an explicit `models.providers.ollama` entry in your config. OpenClaw will then auto-discover models at `http://127.0.0.1:11434`. Note: auto-discovery only includes models that report **tool** support. If your Daemon model does not appear, use Option B.

3. Set the default model for the agent so OpenClaw uses your Daemon model. Edit `~/.openclaw/openclaw.json` and set the agent default, for example:

   ```json
   {
     "agents": {
       "defaults": {
         "model": {
           "primary": "ollama/daemon"
         }
       }
     }
   }
   ```

   Use `ollama/daemon` or `ollama/daemon-lite` (for OpenClaw on low-power hardware), or `ollama/llama3.2:3b` / `ollama/llama3.2:1b` for the base models. Restart the gateway and verify with `openclaw models list` and `openclaw models status`.

### Option B — Explicit config

If your model does not appear in auto-discovery (e.g. the Daemon model does not advertise tool support), add an explicit Ollama provider in `~/.openclaw/openclaw.json`. For **OpenClaw** you should set at least 16k context so skills and system prompts fit; for **daemon-lite** (1B) use:

```json
{
  "models": {
    "providers": {
      "ollama": {
        "baseUrl": "http://127.0.0.1:11434",
        "apiKey": "ollama-local",
        "api": "ollama",
        "models": [
          {
            "id": "daemon-lite",
            "name": "Daemon (lite)",
            "contextWindow": 16384,
            "maxTokens": 8192
          }
        ]
      }
    }
  },
  "agents": {
    "defaults": {
      "model": { "primary": "ollama/daemon-lite" }
    }
  }
}
```

For the standard 3B `daemon` model (e.g. when not using OpenClaw or on faster hardware), you can use `contextWindow: 2048` and `maxTokens: 2048`. Use the model `id` that matches `ollama list` (e.g. `daemon`, `daemon-lite`, `llama3.2:3b`, `llama3.2:1b`). For other hosts or the legacy OpenAI-compatible endpoint, see the [OpenClaw Ollama provider docs](https://docs.openclaw.ai/providers/ollama).

### Verification

- `openclaw models list` — should list your Ollama models.
- `openclaw models status` — checks connectivity and auth.
- Send a test message in the dashboard (`openclaw dashboard`) or TUI to confirm the assistant replies using your local model.

---

## Useful links

| Resource | URL |
|----------|-----|
| OpenClaw Setup | <https://docs.openclaw.ai/setup> |
| OpenClaw Getting Started | <https://docs.openclaw.ai/start/getting-started> |
| OpenClaw Channels | <https://docs.openclaw.ai/channels> |
| OpenClaw Ollama provider | <https://docs.openclaw.ai/providers/ollama> |
| Daemon Bot (this repo) | [05-daemon-bot.md](05-daemon-bot.md) |
| Ollama + Llama (this repo) | [04-ollama-llama.md](04-ollama-llama.md) |

---

With OpenClaw in place, Daemon can respond on your channels, run skills, and execute scheduled jobs — like a personal employee that works for you around the clock.
