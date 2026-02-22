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

1. **Check the bind address.** By default Ollama only listens on `localhost`. You need to set `OLLAMA_HOST=0.0.0.0` in the systemd service override. See [Ollama guide](03-ollama-setup.md#bind-to-all-interfaces-for-lan-access).

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

1. The `daemon` model is created from a Modelfile. If you have not done this yet, follow [Set up Daemon with the CLI — Option A](03-ollama-setup.md#option-a----modelfile-simplest).

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

Next: [Next Steps](06-next-steps.md)
