# 3 -- Ollama + Llama 3.2 8B

This guide installs Ollama, downloads the Llama 3.2 8B model, and configures Ollama to run as a persistent service.

---

## What is Ollama?

[Ollama](https://ollama.com/) is a lightweight runtime that makes it easy to download, run, and manage large language models locally. It handles model storage, quantisation formats, and exposes a simple HTTP API that Daemon will use.

---

## Install Ollama

Run the official one-line installer:

**macOS / Linux:**

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

**Windows:** Download the installer from [ollama.com](https://ollama.com).

This script will (Linux):
- Download the Ollama binary.
- Place it in `/usr/local/bin/ollama`.
- Create a systemd service (`ollama.service`) so it can run in the background.

Verify the installation:

```bash
ollama --version
```

---

## Pull the Llama 3.2 8B Model

```bash
ollama pull llama3.2:8b
```

This downloads the default quantised version of Llama 3.2 8B. The download is several GB.

Verify the model is available:

```bash
ollama list
```

You should see an entry like:

```
NAME              ID            SIZE    MODIFIED
llama3.2:8b       ...           ~4.7 GB  just now
```

---

## Test the Model Interactively

```bash
ollama run llama3.2:8b
```

You will get an interactive prompt. Try a question:

```
>>> What is the capital of France?
```

The model should respond coherently. On Apple Silicon (M4) expect much faster inference than on CPU-only hardware.

Exit with `/bye` or press `Ctrl+D`.

---

## Ollama as a Service

**Linux (systemd):** The installer script usually creates and enables a systemd service automatically. Confirm it is running:

```bash
sudo systemctl status ollama
```

You should see `active (running)`. If not:

```bash
sudo systemctl enable ollama
sudo systemctl start ollama
```

**macOS / Windows:** Ollama runs from the menu bar or system tray; no extra service setup needed.

The service starts Ollama in server mode, listening on **`http://localhost:11434`** by default.

### Verify the API

```bash
curl http://localhost:11434/api/tags
```

This should return a JSON object listing your installed models (including `llama3.2:8b`).

### Test a Chat Completion via the API

```bash
curl -s http://localhost:11434/api/chat -d '{
  "model": "llama3.2:8b",
  "messages": [
    {"role": "user", "content": "Hello, who are you?"}
  ],
  "stream": false
}' | python3 -m json.tool
```

You should see a JSON response with the model's reply.

---

## Ollama Service Configuration (Linux)

The service configuration lives at `/etc/systemd/system/ollama.service`. Common tweaks:

### Bind to all interfaces (for LAN access)

By default Ollama only listens on `localhost`. If you want other devices on your network to reach it (e.g. for a web UI running on your laptop):

```bash
sudo systemctl edit ollama
```

Add the following in the editor:

```ini
[Service]
Environment="OLLAMA_HOST=0.0.0.0"
```

Then restart:

```bash
sudo systemctl daemon-reload
sudo systemctl restart ollama
```

> **Security note:** Only do this on a trusted home network. See [Security](05-security.md) for firewall rules.

### Set a custom models directory

By default models are stored in `~/.ollama/models` (for the user running the service, usually `ollama`). To change:

```bash
sudo systemctl edit ollama
```

```ini
[Service]
Environment="OLLAMA_MODELS=/data/ollama/models"
```

Reload and restart as above.

---

## Resource Usage

| Resource | Approximate Usage |
|----------|-------------------|
| **RAM** | 4--6 GB while the 8B model is loaded |
| **Disk** | ~5 GB for the quantised 8B model |
| **CPU** | All cores utilised during inference (or GPU on Apple Metal / NVIDIA) |
| **Idle** | Model is unloaded from RAM after 5 minutes of inactivity (configurable) |

On a 16 GB machine, the OS and Ollama with the 8B model loaded will typically use 6--8 GB total, leaving headroom.

---

## Useful Ollama Commands

| Command | Description |
|---------|-------------|
| `ollama list` | Show installed models |
| `ollama pull llama3.2:8b` | Download or update the model |
| `ollama rm llama3.2:8b` | Remove the model |
| `ollama run llama3.2:8b` | Interactive chat |
| `ollama show llama3.2:8b` | Show model details (parameters, quantisation, etc.) |
| `ollama ps` | Show currently loaded models and their memory usage |
| `sudo systemctl restart ollama` | Restart the Ollama service (Linux) |
| `journalctl -u ollama -f` | Tail the Ollama service logs (Linux) |

---

Next: [Daemon Bot Setup](04-daemon-bot.md)
