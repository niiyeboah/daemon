# 7 -- OpenClaw & Automation

Once Daemon is running (Ollama and the CLI — see [Ollama + Llama](03-ollama-llama.md)), you can add **OpenClaw** to give it channels, skills, and schedules. Think of Daemon as the brain — your local LLM — and OpenClaw as the layer that gives it "hands": messaging apps, automation skills, and scheduled jobs. Together they can act like a **personal employee** that works on your behalf.

---

## Prerequisites

- **Node.js 22 or newer** — OpenClaw runs on Node. Check with `node --version`.
- **Daemon (Ollama) already running** — Optional if you prefer to use OpenClaw with a cloud AI provider; for a fully local setup, keep [Ollama](03-ollama-llama.md) and your Daemon model running so OpenClaw can use it (if your OpenClaw version supports a local Ollama backend; see OpenClaw docs).
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

Configure the Gateway so the assistant runs tasks on a schedule: e.g. daily briefings, reminder digests, or periodic checks. That way your personal employee works in the background even when you are not chatting. Use the OpenClaw dashboard or CLI to define jobs and triggers; see OpenClaw's docs on job scheduling.

### 4. Run 24/7 (optional)

To have your assistant always on, run the OpenClaw Gateway 24/7 — for example on the same mini PC where Daemon (Ollama) runs, or on a VPS. On Linux, OpenClaw can be installed as a systemd user service; enable lingering if you want it to keep running after you log out: `sudo loginctl enable-linger $USER`. See [OpenClaw Setup](https://docs.openclaw.ai/setup) and the Gateway runbook for details.

---

## Model choice

OpenClaw requires a **16k context window** so that skills and system prompts fit comfortably.

- **Local route (M4 Mac Mini or capable hardware):** Use Ollama + **llama3.2:8b** (or a daemon variant built from it). The 8B model fits well on 16GB and benefits from M4's Metal acceleration (or GPU on other platforms). Pull the model: `ollama pull llama3.2:8b`, then create the Daemon model with `daemon-setup init` and point OpenClaw at `ollama/daemon` or `ollama/llama3.2:8b`.
- **Beelink / low-power route:** We recommend using **API keys** for Gemini, OpenAI, or Claude instead of local inference to avoid slow inference and "inference too slow" errors. Get keys from [Google AI Studio](https://aistudio.google.com/), [OpenAI Platform](https://platform.openai.com/), or [Anthropic Console](https://console.anthropic.com/), then configure via the desktop app Settings (API Keys card) or via CLI: `openclaw onboard --auth-choice gemini-api-key` (or `openai-api-key` / `anthropic-api-key`).

---

## Connect local Ollama (Daemon) to OpenClaw

So that OpenClaw uses your existing Daemon (Ollama) instead of a cloud provider, configure the Ollama provider and set the default model. Restart the gateway after any config change: `openclaw gateway restart`.

**Prerequisite:** Ollama must be running and your chosen model available. Check with `ollama list` (you should see `daemon` or `llama3.2:8b`).

### Option A — Auto-discovery

The simplest way is to let OpenClaw discover models from your local Ollama instance:

1. Set the API key (any non-empty value; Ollama does not validate it):

   ```bash
   export OLLAMA_API_KEY="ollama-local"
   ```

   To make it persistent, add that line to your shell profile (`~/.bashrc`, `~/.zshrc`) or set it in OpenClaw's environment.

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

   Use `ollama/daemon` or `ollama/llama3.2:8b` for the base model. Restart the gateway and verify with `openclaw models list` and `openclaw models status`.

### Option B — Explicit config

If your model does not appear in auto-discovery (e.g. the Daemon model does not advertise tool support), add an explicit Ollama provider in `~/.openclaw/openclaw.json`. OpenClaw requires a 16k context window; for **daemon** (8B) use:

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
            "id": "daemon",
            "name": "Daemon",
            "contextWindow": 16384,
            "maxTokens": 8192
          }
        ]
      }
    }
  },
  "agents": {
    "defaults": {
      "model": { "primary": "ollama/daemon" }
    }
  }
}
```

Use the model `id` that matches `ollama list` (e.g. `daemon`, `llama3.2:8b`). For other hosts or the legacy OpenAI-compatible endpoint, see the [OpenClaw Ollama provider docs](https://docs.openclaw.ai/providers/ollama).

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
| Ollama + Llama (this repo) | [03-ollama-llama.md](03-ollama-llama.md) |

---

With OpenClaw in place, Daemon can respond on your channels, run skills, and execute scheduled jobs — like a personal employee that works for you around the clock.
