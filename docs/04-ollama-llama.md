# 4 -- Ollama + Llama 3.2 1B

This guide installs Ollama, downloads the Llama 3.2 1B model, and configures Ollama to run as a persistent service.

---

## What is Ollama?

[Ollama](https://ollama.com/) is a lightweight runtime that makes it easy to download, run, and manage large language models locally. It handles model storage, quantisation formats, and exposes a simple HTTP API that Daemon will use.

---

## Install Ollama

Run the official one-line installer:

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

This script will:
- Download the Ollama binary.
- Place it in `/usr/local/bin/ollama`.
- Create a systemd service (`ollama.service`) so it can run in the background.

Verify the installation:

```bash
ollama --version
```

---

## Pull the Llama 3.2 1B Model

```bash
ollama pull llama3.2:1b
```

This downloads the default quantised (Q4_K_M) version of Llama 3.2 1B. The download is approximately **1 GB**.

Verify the model is available:

```bash
ollama list
```

You should see an entry like:

```
NAME              ID            SIZE    MODIFIED
llama3.2:1b       ...           1.3 GB  just now
```

---

## Test the Model Interactively

```bash
ollama run llama3.2:1b
```

You will get an interactive prompt. Try a question:

```
>>> What is the capital of France?
```

The model should respond coherently. Response speed will vary -- on the N100/N150 expect roughly **10--30 tokens per second**.

Exit with `/bye` or press `Ctrl+D`.

---

## Ollama as a Systemd Service

The installer script usually creates and enables a systemd service automatically. Confirm it is running:

```bash
sudo systemctl status ollama
```

You should see `active (running)`. If not:

```bash
sudo systemctl enable ollama
sudo systemctl start ollama
```

The service starts Ollama in server mode, listening on **`http://localhost:11434`** by default.

### Verify the API

```bash
curl http://localhost:11434/api/tags
```

This should return a JSON object listing your installed models (including `llama3.2:1b`).

### Test a Chat Completion via the API

```bash
curl -s http://localhost:11434/api/chat -d '{
  "model": "llama3.2:1b",
  "messages": [
    {"role": "user", "content": "Hello, who are you?"}
  ],
  "stream": false
}' | python3 -m json.tool
```

You should see a JSON response with the model's reply.

---

## Ollama Service Configuration

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

> **Security note:** Only do this on a trusted home network. See [Security](06-security.md) for firewall rules.

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
| **RAM** | 1--2 GB while the model is loaded |
| **Disk** | ~1 GB for the Q4_K_M quantised model |
| **CPU** | All cores utilised during inference |
| **Idle** | Model is unloaded from RAM after 5 minutes of inactivity (configurable) |

On a 16 GB machine, the OS and Ollama with the 1B model loaded will typically use 3--4 GB total, leaving plenty of headroom.

---

## Useful Ollama Commands

| Command | Description |
|---------|-------------|
| `ollama list` | Show installed models |
| `ollama pull llama3.2:1b` | Download or update the model |
| `ollama rm llama3.2:1b` | Remove the model |
| `ollama run llama3.2:1b` | Interactive chat |
| `ollama show llama3.2:1b` | Show model details (parameters, quantisation, etc.) |
| `ollama ps` | Show currently loaded models and their memory usage |
| `sudo systemctl restart ollama` | Restart the Ollama service |
| `journalctl -u ollama -f` | Tail the Ollama service logs |

---

Next: [Daemon Bot Setup](05-daemon-bot.md)
