# 2 -- Windows Setup (Default)

The Beelink S13 Pro comes preloaded with **Windows**, so this is the recommended and simplest path. This guide gets you from a fresh Windows install to a working local assistant.

---

## Prerequisites

- Windows 10 or 11 (64-bit).
- Beelink S13 Pro or similar mini PC with at least 8 GB RAM (16 GB recommended).
- Wired Ethernet is recommended; Wi‑Fi works as well.

---

## 1. Install Ollama for Windows

1. Go to [ollama.com](https://ollama.com) and download the Windows installer.
2. Run the installer. Ollama will be added to your PATH and can start from the system tray or Start menu.
3. Open **PowerShell** or **Command Prompt** and verify:

```powershell
ollama --version
```

---

## 2. Pull the base model

```powershell
ollama pull llama3.2:3b
```

This downloads about 2 GB. When it finishes, confirm:

```powershell
ollama list
```

You should see `llama3.2:3b` in the list.

---

## 3. Install Go

You need Go 1.21 or later to build the daemon-setup CLI.

- **Option A:** Download the Windows installer from [go.dev/dl](https://go.dev/dl/).
- **Option B:** Using winget: `winget install GoLang.Go`.

After installing, open a **new** PowerShell window and check:

```powershell
go version
```

---

## 4. Build daemon-setup

Clone or download this repo, then from the repo root:

```powershell
go build -o daemon-setup.exe ./cmd/daemon-setup
```

If you are building on Linux or macOS for Windows, use:

```bash
GOOS=windows GOARCH=amd64 go build -o daemon-setup.exe ./cmd/daemon-setup
```

(or `make build-windows` if you have the Makefile).

---

## 5. Run daemon-setup

In the same directory (with `daemon-setup.exe`):

```powershell
.\daemon-setup check
```

Fix any issues (e.g. start Ollama from the Start menu if the API is unreachable). Then:

```powershell
.\daemon-setup init
```

This writes the Modelfile to your user profile and creates the `daemon` model. Optionally add a shortcut so you can run the bot by typing `daemon` in PowerShell:

```powershell
.\daemon-setup alias
```

Restart PowerShell or run `. $PROFILE` to load the new function.

---

## 6. Run the bot

- **PowerShell (with alias):** Open PowerShell and run:

  ```powershell
  daemon
  ```

- **Any terminal:** Run:

  ```powershell
  ollama run daemon
  ```

You get an interactive chat. Exit with `/bye` or `Ctrl+D`.

---

## Alternative: WSL2

If you prefer the Linux-based setup (systemd, etc.) but want to keep Windows as the host OS, you can install [WSL2](https://learn.microsoft.com/en-us/windows/wsl/install) and follow [Post-Install](03-post-install.md), [Ollama + Llama](04-ollama-llama.md), and [Daemon Bot](05-daemon-bot.md) inside the WSL Ubuntu distro.

## Alternative: Ubuntu Desktop

If you prefer to replace Windows with Linux entirely, see [Ubuntu Desktop](02b-ubuntu-desktop.md).

---

Next: [Ollama + Llama 3.2 3B](04-ollama-llama.md)
