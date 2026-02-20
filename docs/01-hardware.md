# 1 -- Hardware: Beelink S13 Pro

This guide covers the Beelink S13 Pro mini PC and explains why it is a good fit for running a local Llama 3.2 1B assistant.

---

## Which Model?

"Beelink S13 Pro" can refer to different SKUs depending on the release year. The two most common variants are:

| Variant                     | CPU                                             | RAM            | Storage           | Notes                                         |
| --------------------------- | ----------------------------------------------- | -------------- | ----------------- | --------------------------------------------- |
| **Mini S13** (budget)       | Intel N100 / N150 (4 cores, up to 3.4--3.6 GHz) | 16 GB DDR4     | 500 GB SSD        | Low power (~15 W TDP), fanless or near-silent |
| **SEi13 Pro** (performance) | Intel Core i5-13500H or i9-13900HK              | 16--32 GB DDR5 | 500 GB--1 TB NVMe | Higher TDP (~45 W), active fan cooling        |

> **This guide assumes the budget Mini S13 variant** (Intel N100/N150, 16 GB RAM). If you have the SEi13 Pro or a similar higher-end model, everything below still applies -- you will simply get faster inference.

---

## Key Specs for Running Llama 3.2 1B

| Requirement    | Mini S13 (N100/N150)       | Notes                                                          |
| -------------- | -------------------------- | -------------------------------------------------------------- |
| **CPU**        | 4 cores, up to 3.6 GHz     | Ollama runs on CPU by default; 4 cores is enough for 1B        |
| **RAM**        | 16 GB DDR4                 | Model uses ~1--2 GB; 16 GB leaves room for the OS and services |
| **Disk**       | 500 GB SSD                 | Model is ~2 GB on disk; plenty of room                         |
| **Networking** | Gigabit Ethernet + Wi-Fi 6 | Ethernet recommended for always-on server use                  |
| **TDP**        | ~15 W                      | Low electricity cost for 24/7 operation                        |
| **Noise**      | Fanless or near-silent     | Can sit on a desk or shelf without distraction                 |

---

## Hardware You'll Need

Besides the Beelink S13 Pro (or equivalent mini PC), you will need:

- **Wired keyboard** — Required for initial setup and BIOS. A wired USB keyboard avoids wireless dongle or Bluetooth issues during install and boot.
- **USB drive** — At least 4 GB, only needed if you want to replace Windows with Ubuntu. See [Ubuntu Desktop Installation](02b-ubuntu-desktop.md) for flashing options (Ventoy is recommended).

> The Beelink S13 Pro comes preloaded with **Windows**. This is the recommended setup — see [Windows Setup](02-windows-setup.md). If you prefer Linux, see [Ubuntu Desktop](02b-ubuntu-desktop.md).

---

## Why This Device Fits

1. **Right-sized for 1B parameters.** Llama 3.2 1B quantised (Q4) uses roughly 1--2 GB of RAM. A 16 GB machine can comfortably host the model, the OS, and lightweight services without swapping.

2. **Low power, always-on.** At ~15 W the Mini S13 costs very little to run continuously. That makes it practical as a personal assistant that is always available.

3. **Silent operation.** Many N100/N150 variants are fanless. No noise means it can live in a bedroom or office.

4. **Small footprint.** Mini PCs are roughly the size of a paperback book. Easy to tuck behind a monitor or mount on a VESA bracket.

5. **Affordable.** The Mini S13 typically costs between $150--$250 USD, making it one of the cheapest ways to run a local LLM full-time.

---

## Things to Consider

- **No discrete GPU.** The integrated Intel UHD Graphics is not used by Ollama for inference. All computation happens on the CPU. For the 1B model this is fine -- expect roughly 10--30 tokens per second depending on the quantisation level and context length.
- **RAM is usually soldered.** Most Mini S13 units ship with 16 GB soldered. You cannot upgrade later, so buy the 16 GB variant.
- **Storage is upgradeable.** Most units accept a standard M.2 2280 NVMe or SATA SSD, so you can swap in a larger drive if needed.

Llama 3.2 **1B** (`daemon`) is the recommended model for both direct CLI/API chat and OpenClaw. OpenClaw requires a 16k context window; the 1B model handles this well even on low-power CPUs. See [Daemon Bot](05-daemon-bot.md) and [OpenClaw & automation](09-openclaw-automation.md#model-choice).

---

## Physical Setup

1. Unbox the Beelink S13 Pro.
2. Connect an Ethernet cable (recommended) or plan to configure Wi-Fi during OS install.
3. Connect a monitor via HDMI and a wired keyboard.
4. Power on and enter BIOS (usually by pressing `Del` or `F7` during boot) to verify:
   - **Boot mode** is set to UEFI.
   - **Secure Boot** is disabled (recommended for Ubuntu; not required for Windows).
5. Save and exit BIOS. You are now ready to proceed with setup.

---

Next: [Windows Setup](02-windows-setup.md) (recommended) or [Ubuntu Desktop](02b-ubuntu-desktop.md)
