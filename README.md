# Daemon

<p align="center">
  <img src="assets/daemon-logo.png" alt="Daemon logo" width="200" />
</p>

**Daemon** is a local, privacy-first personal assistant bot that runs entirely on your own hardware. No cloud APIs, no subscriptions, no data leaving your network — just a small, capable language model answering your questions on a quiet mini PC sitting on your desk.

## Table of contents

- [Stack](#stack)
- [What You Get](#what-you-get)
- [Setup Guides](#setup-guides)
- [Prerequisites](#prerequisites)
- [Setup with the CLI](#setup-with-the-cli)
- [Development](#development)
- [License](#license)

## Stack

| Layer             | Component                                           |
| ----------------- | --------------------------------------------------- |
| Hardware          | [Beelink S13 Pro](docs/01-hardware.md) mini PC      |
| Operating System  | [Ubuntu Server 24.04 LTS](docs/02-ubuntu-server.md) |
| Inference Runtime | [Ollama](docs/04-ollama-llama.md)                   |
| Language Model    | [Llama 3.2 3B](docs/04-ollama-llama.md)             |
| Interface         | [Daemon bot](docs/05-daemon-bot.md) (CLI / API)     |

## What You Get

After following the guides below you will have:

- A headless Ubuntu Server running 24/7 on low-power hardware.
- Llama 3.2 3B served locally by Ollama on port `11434`.
- A personal assistant named **Daemon** reachable from the terminal or via a simple HTTP API from any device on your LAN.

## Setup Guides

Read these in order. Each guide picks up where the previous one left off.

| #   | Guide                                            | Description                                                 |
| --- | ------------------------------------------------ | ----------------------------------------------------------- |
| 1   | [Hardware](docs/01-hardware.md)                  | Beelink S13 Pro variants, specs, and why this device fits   |
| 2   | [Ubuntu Server](docs/02-ubuntu-server.md)        | Download, create a bootable USB, install, and first boot    |
| 3   | [Post-Install](docs/03-post-install.md)          | System updates, dependencies, timezone, and user setup      |
| 4   | [Ollama + Llama 3.2 3B](docs/04-ollama-llama.md) | Install Ollama, pull the model, run it as a service         |
| 5   | [Daemon Bot](docs/05-daemon-bot.md)              | Configure the "Daemon" personality via CLI and optional API |
| 6   | [Security](docs/06-security.md)                  | Firewall, SSH hardening, and automatic updates              |
| 7   | [Troubleshooting](docs/07-troubleshooting.md)    | Common issues and how to fix them                           |
| 8   | [Next Steps](docs/08-next-steps.md)              | Ideas for extending Daemon (voice, integrations, web UI)    |

## Prerequisites

- A Beelink S13 Pro (or similar mini PC with at least 8 GB RAM; 16 GB recommended).
- A USB flash drive (4 GB+) for the Ubuntu Server installer.
- A keyboard and monitor for initial setup (can be removed after SSH is configured).
- A wired Ethernet connection is recommended for installation; Wi-Fi can be configured afterwards.

## Setup with the CLI

Once Ubuntu and Ollama are installed and the base model is pulled (see [Setup Guides](#setup-guides) above), you can use the **daemon-setup** CLI to configure the Daemon bot.

**Interactive mode:** In a terminal, run `./daemon-setup` with no arguments to start an interactive menu where you can pick an action (check, init, modelfile, alias, full setup, or guide) and be prompted for options with sensible defaults. Subcommands and flags still work for scripting (e.g. `./daemon-setup check`, `./daemon-setup setup --yes`). For full workflow help, run `./daemon-setup guide`.

1. **Install Go** (if needed): Go 1.21+ is required. On Ubuntu: `sudo apt install -y golang-go`, or [download](https://go.dev/dl/) for your OS.

2. **Build the CLI** (from this repo):

   ```bash
   go build -o daemon-setup ./cmd/daemon-setup
   ```

   Or use the Makefile: `make build`.

3. **Check prerequisites:**

   ```bash
   ./daemon-setup check
   ```

   This verifies Ollama is in PATH and that the API is reachable, and that `llama3.2:3b` (and optionally the `daemon` model) are available. If something is missing, the command prints what to do.

4. **Create the Daemon model:**

   ```bash
   ./daemon-setup init
   ```

   This writes the Modelfile to `~/Modelfile` and runs `ollama create daemon -f ~/Modelfile`.

5. **Optional — add a shell alias** so you can run `daemon` instead of `ollama run daemon`:

   ```bash
   ./daemon-setup alias
   ```

   Then run `source ~/.bashrc` (or `~/.zshrc`) or open a new terminal.

**One-shot setup:** To run check, init, and alias in sequence (with optional prompts), use:

```bash
./daemon-setup setup
```

Use `--yes` to skip confirmations.

For full manual steps and alternatives (e.g. Python API script), see [Daemon Bot](docs/05-daemon-bot.md) and [Ollama + Llama 3.2 3B](docs/04-ollama-llama.md).

## Development

| Command         | Description                          |
| --------------- | ------------------------------------ |
| `make build`    | Build `daemon-setup` for current OS  |
| `make build-macos` | Build for macOS (darwin)          |
| `make test`     | Run tests                            |
| `make clean`    | Remove the built binary              |

## License

This documentation is provided as-is for personal use. See individual tool and model licenses (Ollama, Llama 3.2) for their respective terms.
