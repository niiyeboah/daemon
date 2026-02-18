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

## Using Daemon (Ollama) with OpenClaw

OpenClaw supports multiple AI providers. If your OpenClaw build supports a local Ollama backend, point it at your existing Ollama instance (e.g. `http://localhost:11434`) so that the same Daemon model powers your automated tasks. Check the latest [OpenClaw documentation](https://docs.openclaw.ai) for "local" or "Ollama" provider configuration.

---

## Useful links

| Resource | URL |
|----------|-----|
| OpenClaw Setup | <https://docs.openclaw.ai/setup> |
| OpenClaw Getting Started | <https://docs.openclaw.ai/start/getting-started> |
| OpenClaw Channels | <https://docs.openclaw.ai/channels> |
| Daemon Bot (this repo) | [05-daemon-bot.md](05-daemon-bot.md) |
| Ollama + Llama (this repo) | [04-ollama-llama.md](04-ollama-llama.md) |

---

With OpenClaw in place, Daemon can respond on your channels, run skills, and execute scheduled jobs — like a personal employee that works for you around the clock.
