# 5 -- Troubleshooting

Common issues and how to resolve them.

---

## Ollama Will Not Start

**Symptoms:** `sudo systemctl status ollama` shows `failed` or `inactive`.

**Steps:**

1. Check the logs:

```bash
journalctl -u ollama --no-pager -n 50
```

2. Make sure nothing else is using port 11434:

```bash
sudo ss -tlnp | grep 11434
```

3. Restart the service:

```bash
sudo systemctl restart ollama
```

4. If the binary is missing or corrupt, re-run the installer:

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

---

## Model Fails to Load

**Symptoms:** `ollama run qwen2.5-coder:7b` exits immediately or prints an out-of-memory error.

**Steps:**

1. Check available RAM:

```bash
free -h
```

   The 7B model needs roughly 4--6 GB of free RAM. If the system is low on memory, close other processes or add swap space (see [OS Setup — Post-Install](02-os-setup.md#post-install-system-setup-ubuntu)).

2. Check disk space:

```bash
df -h /
```

   The model needs several GB on disk. If space is tight, remove unused files or expand the drive.

3. Re-pull the model (in case of a corrupted download):

```bash
ollama rm qwen2.5-coder:7b
ollama pull qwen2.5-coder:7b
```

4. Verify:

```bash
ollama list
```

---

## Slow Responses

**Symptoms:** Daemon takes many seconds (or minutes) to respond.

**Context:** On low-power CPUs (e.g. Intel N100/N150), inference can be slow. Consider using cloud API keys (Gemini, OpenAI, Claude) for the OpenClaw gateway on such hardware instead of local Ollama. On Apple Silicon (M4) or higher-end x86, expect much faster inference.

**Ways to improve speed:**

| Technique | How |
|-----------|-----|
| Reduce context length | Set `num_ctx` to 1024 or 512 in the Modelfile (`PARAMETER num_ctx 1024`). Shorter context = less memory and faster prefill. |
| Use a smaller quantisation | Try a lower quantisation variant for a slight speed gain at the cost of quality. |
| Close other processes | `htop` to see what else is consuming CPU/RAM. |
| Keep the model loaded | By default Ollama unloads the model after 5 minutes of idle. Set `OLLAMA_KEEP_ALIVE=-1` in the service env to keep it in RAM permanently (uses more memory but avoids reload latency). |

---

## Cannot Reach Ollama from Another Device

**Symptoms:** `curl http://192.168.1.100:11434/api/tags` from your laptop times out or is refused.

**Steps:**

1. **Check your API key.** Ensure your OpenRouter API key is correctly configured. See [OpenRouter Guide](03-openrouter-setup.md) .

2. **Check the firewall:**

```bash
sudo ufw status
```

   Port 11434 must be allowed from your LAN subnet. See [Security](04-security.md).

3. **Check the server is listening on all interfaces:**

```bash
sudo ss -tlnp | grep 11434
```

   You should see `0.0.0.0:11434`, not `127.0.0.1:11434`.

---

## SSH Connection Refused

**Symptoms:** `ssh: connect to host 192.168.1.100 port 22: Connection refused`.

**Steps:**

1. Make sure sshd is running:

```bash
sudo systemctl status ssh
```

2. If you changed the SSH port (see [Security](04-security.md)), connect on the new port:

```bash
ssh -p 2222 your-username@192.168.1.100
```

3. Check UFW allows SSH:

```bash
sudo ufw status | grep -E '22|2222'
```

---

## "Daemon" Model Not Found

**Symptoms:** `ollama run daemon` returns `Error: model "daemon" not found`.

**Steps:**

1. Verify your OpenRouter API key. If you have not done this yet, follow [API Setup](03-openrouter-setup.md).

2. If you already created it, verify:

```bash
ollama list | grep daemon
```

3. Recreate if needed:

```bash
ollama create daemon -f ~/Modelfile
```

---

## macOS: "Daemon" is damaged and can't be opened

**Symptoms:** After downloading the Daemon DMG from GitHub Releases, macOS shows a dialog: *"Daemon" is damaged and can't be opened. You should eject the disk image.*

**Cause:** The installer is not yet signed with an Apple Developer ID. macOS Gatekeeper adds a quarantine attribute to downloaded files and may block or misreport unsigned apps as "damaged".

**Workaround:** Remove the quarantine attribute, then open the DMG again:

```bash
xattr -cr ~/Downloads/Daemon_*.dmg
```

Replace `Daemon_*.dmg` with the exact filename (e.g. `Daemon_0.1.2_aarch64.dmg`). After installing, if the app itself will not open:

```bash
xattr -cr /Applications/Daemon.app
```

Then open Daemon from Applications or the Dock. Future releases may be code-signed and notarized so this step is unnecessary; see [Distribution](08-distribution.md).

---

## High Memory Usage / System Swapping

**Symptoms:** The system feels sluggish, `free -h` shows swap is heavily used.

**Steps:**

1. Check which processes are using memory:

```bash
ps aux --sort=-%mem | head -10
```

2. If Ollama is consuming more than expected, the model may be loaded at a higher quantisation or with a large context window. Reduce `num_ctx` in the Modelfile:

```dockerfile
PARAMETER num_ctx 1024
```

Recreate the model:

```bash
ollama create daemon -f ~/Modelfile
```

3. Add more swap if needed (see [OS Setup — Post-Install](02-os-setup.md#post-install-system-setup-ubuntu)).

---

## Ollama Update

To update Ollama to the latest version:

```bash
curl -fsSL https://ollama.com/install.sh | sh
sudo systemctl restart ollama
```

This overwrites the binary in place and preserves your models and configuration.

---

## OpenClaw: "Not found in PATH" in Desktop App

**Symptoms:** The Daemon desktop app shows "OpenClaw not found in PATH" and tries to install it, even though `openclaw` works fine in the terminal.

**Cause:** macOS GUI apps inherit a minimal PATH (`/usr/bin:/bin:/usr/sbin:/sbin`) that excludes directories added by your shell profile (nvm, Homebrew, cargo, etc.). If OpenClaw was installed via npm/nvm, it lives at a path like `~/.nvm/versions/node/vXX/bin/openclaw` which the desktop app can't see.

**Fix:** This is handled automatically in Daemon desktop v0.1.5+, which resolves the full login shell PATH before looking for binaries. If you're on an older version, update the desktop app.

---

## OpenClaw: Agent Responds with "NO_REPLY"

**Symptoms:** Messages sent via the OpenClaw dashboard or WhatsApp get no response. The session file shows the assistant responding with just `NO_REPLY`.

**Cause:** OpenClaw's system prompt includes a "Silent Replies" section that tells the model to respond with `NO_REPLY` when it has nothing to say. Small or code-focused models (e.g. `qwen2.5-coder:7b`) can't reliably distinguish this from normal conversation and default to `NO_REPLY` for everything.

**Fix:**

1. Switch to an instruction-following model like `llama3.1:8b`:

   ```bash
   ollama pull llama3.1:8b
   ```

2. Rebuild the Daemon model:

   ```bash
   cat > /tmp/Modelfile << 'EOF'
   FROM llama3.1:8b
   SYSTEM "You are Daemon, a helpful and concise personal assistant running locally. You respect privacy -- no data leaves this machine. You answer clearly and directly. You are friendly but not verbose."
   PARAMETER num_ctx 32768
   PARAMETER temperature 0.7
   PARAMETER top_p 0.9
   EOF
   ollama create daemon -f /tmp/Modelfile
   ```

3. Restart the gateway:

   ```bash
   openclaw gateway restart
   ```

4. Trim workspace files to reduce system prompt size (see [Model choice](07-openclaw-automation.md#model-choice)).

---

## OpenClaw: WhatsApp Not Receiving Messages

**Symptoms:** WhatsApp channel shows as "enabled" but messages aren't being received or responded to.

**Steps:**

1. Check the channel status:

   ```bash
   openclaw channels status
   ```

   Look for `linked, running, connected`. If it says `not linked`, you need to re-pair.

2. Re-pair WhatsApp if needed:

   ```bash
   openclaw channels login --channel whatsapp
   ```

   Scan the QR code with WhatsApp (Settings > Linked Devices).

3. Check the allowlist. The `dmPolicy` in `~/.openclaw/openclaw.json` is set to `allowlist` by default. Only numbers in `channels.whatsapp.allowFrom` can message the agent:

   ```json
   {
     "channels": {
       "whatsapp": {
         "allowFrom": ["+1234567890"],
         "dmPolicy": "allowlist"
       }
     }
   }
   ```

4. After a gateway restart, WhatsApp may take 1-2 minutes to reconnect. The health-monitor will auto-restart it. Check the gateway log for `Listening for personal WhatsApp inbound messages`.

---

## OpenClaw: Web Search Fails ("missing_brave_api_key")

**Symptoms:** The agent tries to search the web but gets `missing_brave_api_key` error.

**Fix:** OpenClaw's `web_search` tool requires a Brave Search API key. The free tier provides 2,000 queries/month:

1. Get a key at <https://brave.com/search/api/>
2. Configure it:

   ```bash
   openclaw configure --section web
   ```

   Or set `BRAVE_API_KEY` in the gateway environment.

---

Next: [Next Steps](06-next-steps.md)
