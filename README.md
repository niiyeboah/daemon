# Daemon

<p align="center">
  <img src="web/public/daemon-logo.png" alt="Daemon logo" width="200" />
</p>

**Daemon** is a local, privacy-first personal assistant bot that runs entirely on your own hardware. No cloud APIs, no subscriptions, no data leaving your network — just a small, capable language model answering your questions on a quiet mini PC sitting on your desk.

**We recommend using the [Daemon Desktop](https://github.com/niiyeboah/daemon/releases) app** to chat with Daemon from a native window. [Download for macOS, Windows & Linux](https://github.com/niiyeboah/daemon/releases) · [Setup guide](https://niiyeboah.github.io/daemon/)

## Table of contents

- [Daemon](#daemon)
  - [Table of contents](#table-of-contents)
  - [Stack](#stack)
  - [What You Get](#what-you-get)
  - [Setup Guides](#setup-guides)
  - [Prerequisites](#prerequisites)
  - [Setup with the CLI](#setup-with-the-cli)
  - [Development](#development)
  - [License](#license)

## Stack

| Layer             | Component                                                                                                                                                                        |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hardware          | [M4 Mac Mini](docs/01-hardware.md) (local route) or [Beelink S13 Pro](docs/01-hardware.md) (cloud API route)                                                                     |
| Operating System  | [OS Setup](docs/02-os-setup.md) — macOS (M4 Mac Mini, default), Windows (Beelink), Ubuntu Desktop 24.04 LTS (Beelink) |
| Inference Runtime | [Ollama](docs/03-ollama-llama.md)                                                                                                                                                |
| Language Model    | [Llama 3.2 8B](docs/03-ollama-llama.md) (default); optional [deepseek-r1:8b](https://ollama.com/library/deepseek-r1:8b) / [deepseek-r1:7b](https://ollama.com/library/deepseek-r1:7b) for better reasoning |

## What You Get

After following the guides below you will have:

- A Windows (or Ubuntu Desktop) machine running 24/7 on low-power hardware.
- Llama 3.2 8B (or optional deepseek-r1:8b / deepseek-r1:7b) served locally by Ollama on port `11434`.
- A personal assistant named **Daemon** reachable via the [Daemon Desktop](https://github.com/niiyeboah/daemon/releases) app, the terminal, or a simple HTTP API from any device on your LAN.


For local inference we recommend the **M4 Mac Mini 16GB**; for a low-power always-on gateway with cloud APIs, the **Beelink S13 Pro** (Windows preloaded) is an option. See [Hardware](docs/01-hardware.md). Alternatively, install [Ubuntu Desktop](docs/02-os-setup.md#ubuntu-desktop-beelink-s13-pro) on Beelink if you prefer Linux.

## Setup Guides

Read these in order. Each guide picks up where the previous one left off.

| #   | Guide                                                   | Description                                                              |
| --- | ------------------------------------------------------- | ------------------------------------------------------------------------ |
| 1   | [Hardware](docs/01-hardware.md)                         | M4 Mac Mini (local) and Beelink S13 Pro (cloud API option)               |
| 2   | [OS Setup](docs/02-os-setup.md)                         | macOS (default), Windows, or Ubuntu Desktop — get your OS ready         |
| 3   | [Ollama + Llama 3.2 8B](docs/03-ollama-llama.md)        | Install Ollama, pull the model, run as service, set up Daemon via CLI   |
| 4   | [Security](docs/04-security.md)                         | Firewall, SSH hardening, and automatic updates                           |
| 5   | [Troubleshooting](docs/05-troubleshooting.md)            | Common issues and how to fix them                                        |
| 6   | [Next Steps](docs/06-next-steps.md)                     | Ideas for extending Daemon (voice, integrations, web UI)                 |
| 7   | [OpenClaw & automation](docs/07-openclaw-automation.md) | Set up OpenClaw, automate tasks, and use Daemon like a personal employee |

## Prerequisites

- An M4 Mac Mini 16GB (recommended for local inference) or a Beelink S13 Pro / similar mini PC (at least 8 GB RAM; 16 GB recommended; for Beelink we recommend cloud API keys). Beelink comes preloaded with Windows.
- A USB flash drive (4 GB+) only if installing Ubuntu Desktop.
- A wired keyboard and monitor for initial setup (can be removed after SSH/remote access is configured).
- A wired Ethernet connection is recommended; Wi-Fi can be configured afterwards.

## Setup with the CLI

Once Ollama is installed and the base model is pulled (see [Setup Guides](#setup-guides) above), you can use the **daemon-setup** CLI to configure Daemon. Prefer a graphical interface? Use the [Daemon Desktop](https://github.com/niiyeboah/daemon/releases) app and follow the [setup guide](https://niiyeboah.github.io/daemon/) in your browser.

**Interactive mode:** In a terminal, run `./daemon-setup` with no arguments to start an interactive menu where you can pick an action (check, init, modelfile, alias, full setup, or guide) and be prompted for options with sensible defaults. Subcommands and flags still work for scripting (e.g. `./daemon-setup check`, `./daemon-setup setup --yes`). For full workflow help, run `./daemon-setup guide`.

1. **Install Go** (if needed): Go 1.21+ is required. On Ubuntu: `sudo apt install -y golang-go`, or [download](https://go.dev/dl/) for your OS.

2. **Get the CLI:** Pre-built binaries are available on [GitHub Releases](https://github.com/niiyeboah/daemon/releases) for Windows, Linux, and macOS. Or **build from source** (from this repo):
   - **Linux / macOS:** `go build -o daemon-setup ./cmd/daemon-setup` or `make build`.
   - **Windows:** `go build -o daemon-setup.exe ./cmd/daemon-setup`. From Linux/macOS for Windows: `make build-windows`.

3. **Check prerequisites:**

   ```bash
   ./daemon-setup check
   ```

   This verifies Ollama is in PATH and that the API is reachable, and that a base model (e.g. `llama3.2:8b`, `deepseek-r1:8b`, or `deepseek-r1:7b`) and optionally the `daemon` model are available. If something is missing, the command prints what to do.

4. **Create the Daemon model:**

   ```bash
   ./daemon-setup init
   ```

   This writes the Modelfile to `~/Modelfile` and runs `ollama create daemon -f ~/Modelfile`.

5. **Optional — add a shell alias** so you can run `daemon` instead of `ollama run daemon`:

   ```bash
   ./daemon-setup alias
   ```

   Then run `source ~/.bashrc` (or `~/.zshrc`) or open a new terminal. On Windows (PowerShell), restart PowerShell or run `. $PROFILE`.

**One-shot setup:** To run check, init, and alias in sequence (with optional prompts), use:

```bash
./daemon-setup setup
```

Use `--yes` to skip confirmations.

For full manual steps and alternatives (e.g. Python API script), see [Ollama + Llama 3.2 8B](docs/03-ollama-llama.md).

## Development

| Command              | Description                                  |
| -------------------- | -------------------------------------------- |
| `make build`         | Build `daemon-setup` for current OS          |
| `make build-linux`   | Build for Linux (amd64)                      |
| `make build-macos`   | Build for macOS (darwin)                     |
| `make build-windows` | Build `daemon-setup.exe` for Windows (amd64) |
| `make test`          | Run tests                                    |
| `make clean`         | Remove the built binary(ies)                 |

## License

This documentation is provided as-is for personal use. See individual tool and model licenses (Ollama, Llama 3.2) for their respective terms.
