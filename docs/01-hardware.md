# 1 -- Hardware: M4 Mac Mini & Beelink S13 Pro

This guide covers recommended hardware for running Daemon: the **M4 Mac Mini** for local inference and the **Beelink S13 Pro** as an alternative, including when to use cloud API keys instead of local models.

---

## Recommended: M4 Mac Mini (Local Model Route)

For the **local model route** — where Ollama runs and inference happens on your own machine — we recommend the **M4 Mac Mini 16GB 256GB SSD**.

| Spec | M4 Mac Mini |
|------|-------------|
| **CPU** | Apple M4 (10-core CPU, 10-core GPU) |
| **RAM** | 16 GB unified memory |
| **Storage** | 256 GB SSD |
| **Recommended model** | **llama3.2:8b** (8B fits well on 16GB; use `ollama pull llama3.2:8b`) |
| **Benefits** | Apple Silicon inference, Metal acceleration for Ollama, much faster than low-power x86 |

The 8B model fits comfortably in 16 GB and benefits from M4's Metal acceleration. See [Ollama + Llama](04-ollama-llama.md) and [Daemon Bot](05-daemon-bot.md) for setup.

---

## Alternative: Beelink S13 Pro

"Beelink S13 Pro" can refer to different SKUs depending on the release year. The two most common variants are:

| Variant                     | CPU                                             | RAM            | Storage           | Notes                                         |
| --------------------------- | ----------------------------------------------- | -------------- | ----------------- | --------------------------------------------- |
| **Mini S13** (budget)       | Intel N100 / N150 (4 cores, up to 3.4--3.6 GHz) | 16 GB DDR4     | 500 GB SSD        | Low power (~15 W TDP), fanless or near-silent |
| **SEi13 Pro** (performance) | Intel Core i5-13500H or i9-13900HK              | 16--32 GB DDR5 | 500 GB--1 TB NVMe | Higher TDP (~45 W), active fan cooling        |

> **For Beelink (low-power N100/N150), we recommend using cloud API keys** (Gemini, OpenAI, or Claude) instead of local inference to avoid slow inference and "inference too slow" errors. Configure API keys via the desktop app Settings or `openclaw onboard --auth-choice gemini-api-key` (or openai-api-key / anthropic-api-key). See [OpenClaw & automation](09-openclaw-automation.md).

If you use the Beelink for the OpenClaw gateway only (with cloud APIs), it remains a good always-on, low-power option. If you have the SEi13 Pro or a similar higher-end model, you can run local Ollama with **llama3.2:8b** as well.

---

## Hardware You'll Need

Besides the M4 Mac Mini or Beelink S13 Pro (or equivalent), you will need:

- **Wired keyboard** — Required for initial setup and BIOS (Beelink). A wired USB keyboard avoids wireless dongle or Bluetooth issues during install and boot.
- **USB drive** — At least 4 GB, only needed if you want to replace Windows with Ubuntu on Beelink. See [Ubuntu Desktop Installation](02b-ubuntu-desktop.md) for flashing options (Ventoy is recommended).

> The Beelink S13 Pro comes preloaded with **Windows**. This is the recommended setup for Beelink — see [Windows Setup](02-windows-setup.md). If you prefer Linux, see [Ubuntu Desktop](02b-ubuntu-desktop.md). For M4 Mac Mini, use macOS.

---

## Why the M4 Mac Mini Fits (Local Route)

1. **Right-sized for 8B.** Llama 3.2 8B quantised uses roughly 4--6 GB of RAM. A 16 GB machine comfortably hosts the model, the OS, and lightweight services.
2. **Metal acceleration.** Ollama uses Apple Metal on macOS for much faster inference than CPU-only on N100/N150.
3. **Low power, always-on.** The M4 Mac Mini is efficient and can run 24/7 as a personal assistant.
4. **Small footprint.** Fits on a desk or shelf without distraction.

Llama 3.2 **8B** (`daemon` or `llama3.2:8b`) is the recommended model for both direct CLI/API chat and OpenClaw on the local route. See [Daemon Bot](05-daemon-bot.md) and [OpenClaw & automation](09-openclaw-automation.md#model-choice).

---

## Physical Setup

### M4 Mac Mini

1. Unbox and connect Ethernet (recommended) or Wi-Fi, display, and keyboard.
2. Power on and complete macOS setup. Install Ollama and pull `llama3.2:8b` as in [Ollama + Llama](04-ollama-llama.md).

### Beelink S13 Pro

1. Unbox the Beelink S13 Pro.
2. Connect an Ethernet cable (recommended) or plan to configure Wi-Fi during OS install.
3. Connect a monitor via HDMI and a wired keyboard.
4. Power on and enter BIOS (usually by pressing `Del` or `F7` during boot) to verify:
   - **Boot mode** is set to UEFI.
   - **Secure Boot** is disabled (recommended for Ubuntu; not required for Windows).
5. Save and exit BIOS. You are now ready to proceed with setup.

---

Next: [Windows Setup](02-windows-setup.md) (Beelink, recommended) or [Ubuntu Desktop](02b-ubuntu-desktop.md) or [Ollama + Llama](04-ollama-llama.md) (M4 Mac Mini)
