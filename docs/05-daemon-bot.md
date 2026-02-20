# 5 -- Daemon Bot Setup

With Ollama running and Llama 3.2 1B downloaded, it is time to give your assistant its identity. **Daemon** is the personality and interface layer that sits on top of Ollama.

This guide covers two approaches -- pick the one that fits your needs:

| Approach                   | What You Get                                                                           | Complexity                      |
| -------------------------- | -------------------------------------------------------------------------------------- | ------------------------------- |
| **A -- Modelfile (CLI)**   | A named model with a baked-in system prompt; use via `ollama run daemon`               | Minimal -- just a text file     |
| **B -- Python API script** | A CLI chat loop (or HTTP endpoint) that calls Ollama's API with a Daemon system prompt | Moderate -- small Python script |

---

## Interactive mode (CLI)

Pre-built **daemon-setup** binaries for Windows, Linux, and macOS are available on [GitHub Releases](https://github.com/niiyeboah/daemon/releases). Download the file for your OS, or build from source (see the repo README).

When you run **daemon-setup** with no arguments in a terminal, it starts an interactive menu. You can choose to check prerequisites, write the Modelfile, create the daemon model, add the shell alias, run a full setup, or view the guide. You will be prompted for paths and model names with sensible defaults (e.g. `~/Modelfile`, model name `daemon`, base model `llama3.2:1b`). To use the CLI non-interactively (e.g. in scripts), run a subcommand directly: `daemon-setup check`, `daemon-setup init`, `daemon-setup setup --yes`, etc.

---

## Option A -- Modelfile (Simplest)

An Ollama **Modelfile** lets you create a custom model alias with a system prompt, temperature, and other parameters pre-set. No code required.

### 1. Write the Modelfile

Create a file called `Modelfile` in your home directory (or in the daemon-bot repo):

```bash
nano ~/Modelfile
```

Paste the following:

```dockerfile
FROM llama3.2:1b

PARAMETER temperature 0.7
PARAMETER top_p 0.9
PARAMETER num_ctx 16384

SYSTEM """
You are Daemon, a helpful and concise personal assistant running locally on the user's own hardware. You respect the user's privacy -- no data ever leaves this machine. You answer questions clearly and directly. When you are unsure, you say so. You are friendly but not verbose.
"""
```

### 2. Create the Custom Model

```bash
ollama create daemon -f ~/Modelfile
```

Verify:

```bash
ollama list
```

You should now see a `daemon` model alongside the base `llama3.2:1b`.

### 3. Run Daemon

```bash
ollama run daemon
```

You will get an interactive chat where the model already knows it is "Daemon" and follows the system prompt's instructions.

```
>>> Hi, who are you?
I'm Daemon, your local personal assistant. How can I help?
```

Exit with `/bye` or `Ctrl+D`.

### 4. (Optional) Shell Alias

Add a shortcut to your shell profile so you can just type `daemon`:

```bash
echo 'alias daemon="ollama run daemon"' >> ~/.bashrc
source ~/.bashrc
```

Now simply run:

```bash
daemon
```

### On Windows

If you are on Windows (see [Windows Setup](02-windows-setup.md)), `daemon-setup alias` adds a **PowerShell function** to your profile (`Documents\WindowsPowerShell\Microsoft.PowerShell_profile.ps1`). Restart PowerShell or run `. $PROFILE` to load it, then run `daemon`. You can also run `ollama run daemon` in any terminal (PowerShell or CMD).

---

## Option B -- Python API Script

For more control (e.g. logging, custom commands, running as a service, or exposing an HTTP endpoint), use a small Python script that talks to Ollama's REST API.

### 1. Install Python and Dependencies

```bash
sudo apt install -y python3 python3-pip python3-venv
```

Create a project directory and virtual environment:

```bash
mkdir -p ~/daemon-bot && cd ~/daemon-bot
python3 -m venv .venv
source .venv/bin/activate
pip install requests
```

### 2. Create the Script

```bash
nano ~/daemon-bot/daemon.py
```

```python
#!/usr/bin/env python3
"""Daemon -- local personal assistant powered by Llama 3.2 1B via Ollama."""

import json
import sys

import requests

OLLAMA_URL = "http://localhost:11434/api/chat"
MODEL = "llama3.2:1b"

SYSTEM_PROMPT = (
    "You are Daemon, a helpful and concise personal assistant running locally "
    "on the user's own hardware. You respect the user's privacy -- no data "
    "ever leaves this machine. You answer questions clearly and directly. "
    "When you are unsure, you say so. You are friendly but not verbose."
)


def chat(messages: list[dict]) -> str:
    """Send messages to Ollama and return the assistant reply."""
    payload = {
        "model": MODEL,
        "messages": messages,
        "stream": False,
    }
    resp = requests.post(OLLAMA_URL, json=payload, timeout=120)
    resp.raise_for_status()
    return resp.json()["message"]["content"]


def main() -> None:
    print("Daemon is ready. Type your message (Ctrl+C or 'exit' to quit).\n")

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    while True:
        try:
            user_input = input("You: ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\nGoodbye.")
            break

        if not user_input:
            continue
        if user_input.lower() in ("exit", "quit", "bye"):
            print("Goodbye.")
            break

        messages.append({"role": "user", "content": user_input})

        try:
            reply = chat(messages)
        except requests.RequestException as exc:
            print(f"[Error communicating with Ollama: {exc}]")
            messages.pop()  # remove the failed user message
            continue

        messages.append({"role": "assistant", "content": reply})
        print(f"Daemon: {reply}\n")


if __name__ == "__main__":
    main()
```

### 3. Run It

```bash
cd ~/daemon-bot
source .venv/bin/activate
python daemon.py
```

Example session:

```
Daemon is ready. Type your message (Ctrl+C or 'exit' to quit).

You: What can you help me with?
Daemon: I can answer questions, help you think through problems, draft text,
        summarise information, and more. What do you need?

You: exit
Goodbye.
```

### 4. (Optional) Run as a Systemd Service

If you want `daemon.py` to start automatically on boot (useful if you later add an HTTP endpoint):

```bash
sudo nano /etc/systemd/system/daemon-bot.service
```

```ini
[Unit]
Description=Daemon Personal Assistant Bot
After=network.target ollama.service

[Service]
Type=simple
User=your-username
WorkingDirectory=/home/your-username/daemon-bot
ExecStart=/home/your-username/daemon-bot/.venv/bin/python daemon.py
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

> Replace `your-username` with your actual Linux username.

```bash
sudo systemctl daemon-reload
sudo systemctl enable daemon-bot
sudo systemctl start daemon-bot
```

Check the logs:

```bash
journalctl -u daemon-bot -f
```

---

## Customising the System Prompt

The system prompt is the most important part of Daemon's personality. Feel free to edit it to suit your preferences. Some ideas:

- Change the tone: more formal, more casual, or domain-specific.
- Add rules: "Always respond in bullet points", "Limit replies to 3 sentences".
- Add context: "The user is a software developer who works primarily in Python."

### Modelfile example (Option A)

Edit the `SYSTEM` block in `~/Modelfile` and recreate the model:

```bash
ollama create daemon -f ~/Modelfile
```

### Python script example (Option B)

Edit the `SYSTEM_PROMPT` variable in `daemon.py` and restart the script (or the systemd service).

---

## Summary

| What              | Where                                                  |
| ----------------- | ------------------------------------------------------ |
| Modelfile         | `~/Modelfile`                                          |
| Custom model name | `daemon` (via `ollama run daemon`)                     |
| Python script     | `~/daemon-bot/daemon.py`                               |
| Systemd service   | `/etc/systemd/system/daemon-bot.service`               |
| System prompt     | Inside the Modelfile or `SYSTEM_PROMPT` in `daemon.py` |

---

Next: [Security](06-security.md)
