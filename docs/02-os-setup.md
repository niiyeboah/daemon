# 2 -- OS Setup

Choose your path based on your hardware:

- **macOS (default)** — M4 Mac Mini (recommended). No post-install setup; proceed to [Ollama + Llama](03-ollama-llama.md).
- **Windows** — Beelink S13 Pro (preloaded). Full setup from Windows to running the bot.
- **Ubuntu Desktop** — Beelink S13 Pro with Linux. Install Ubuntu, then post-install, then [Ollama + Llama](03-ollama-llama.md).

---

## macOS (Default — M4 Mac Mini)

macOS requires no post-install setup. If you're using the M4 Mac Mini, proceed to [Ollama + Llama 3.2 8B](03-ollama-llama.md) — your system is ready.

---

## Windows (Beelink S13 Pro)

The Beelink S13 Pro comes preloaded with **Windows**, so this is the simplest path for Beelink. This guide gets you from a fresh Windows install to a working local assistant.

### Prerequisites

- Windows 10 or 11 (64-bit).
- Beelink S13 Pro or similar mini PC with at least 8 GB RAM (16 GB recommended).
- Wired Ethernet is recommended; Wi‑Fi works as well.

### 1. Install Ollama for Windows

1. Go to [ollama.com](https://ollama.com) and download the Windows installer.
2. Run the installer. Ollama will be added to your PATH and can start from the system tray or Start menu.
3. Open **PowerShell** or **Command Prompt** and verify:

```powershell
ollama --version
```

### 2. Pull the base model

```powershell
ollama pull llama3.2:8b
```

This downloads several GB. When it finishes, confirm:

```powershell
ollama list
```

You should see `llama3.2:8b` in the list.

### 3. Install Go

You need Go 1.21 or later to build the daemon-setup CLI.

- **Option A:** Download the Windows installer from [go.dev/dl](https://go.dev/dl/).
- **Option B:** Using winget: `winget install GoLang.Go`.

After installing, open a **new** PowerShell window and check:

```powershell
go version
```

### 4. Build daemon-setup

Download the latest Windows binary from [GitHub Releases](https://github.com/niiyeboah/daemon/releases), or build from source. Clone or download this repo, then from the repo root:

```powershell
go build -o daemon-setup.exe ./cmd/daemon-setup
```

If you are building on Linux or macOS for Windows, use:

```bash
GOOS=windows GOARCH=amd64 go build -o daemon-setup.exe ./cmd/daemon-setup
```

(or `make build-windows` if you have the Makefile).

### 5. Run daemon-setup

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

### 6. Run the bot

- **PowerShell (with alias):** Open PowerShell and run:

  ```powershell
  daemon
  ```

- **Any terminal:** Run:

  ```powershell
  ollama run daemon
  ```

You get an interactive chat. Exit with `/bye` or `Ctrl+D`.

### Alternative: WSL2

If you prefer the Linux-based setup (systemd, etc.) but want to keep Windows as the host OS, you can install [WSL2](https://learn.microsoft.com/en-us/windows/wsl/install) and follow [Post-Install (Ubuntu)](#post-install-system-setup-ubuntu) and [Ollama + Llama](03-ollama-llama.md) (including CLI setup) inside the WSL Ubuntu distro.

### Alternative: Ubuntu Desktop

If you prefer to replace Windows with Linux entirely, see [Ubuntu Desktop](#ubuntu-desktop-beelink-s13-pro) below.

---

## Ubuntu Desktop (Beelink S13 Pro)

This section walks through installing Ubuntu Desktop 24.04 LTS on the Beelink S13 Pro and then preparing the system for Ollama. Ubuntu **Desktop** is recommended over Server for the Beelink S13 — the Server installer has known compatibility issues with this hardware, while Desktop installs reliably.

> **Note:** The Beelink S13 Pro comes preloaded with Windows. If you prefer to keep Windows, see [Windows (Beelink S13 Pro)](#windows-beelink-s13-pro) above — it is the simpler path.

### Download the Installer

1. Go to <https://ubuntu.com/download/desktop> and download **Ubuntu Desktop 24.04 LTS** (the `.iso` file).
2. Optionally verify the download checksum against the SHA256 hash listed on the download page:

```bash
sha256sum ubuntu-24.04.2-desktop-amd64.iso
```

### Create a Bootable USB Drive

You need a USB flash drive of at least 4 GB.

#### Option A -- Ventoy (recommended)

[Ventoy](https://www.ventoy.net/) lets you set up the USB once, then copy one or more `.iso` files onto it and choose which to boot. You can add or replace ISOs without re-flashing the drive.

1. Download Ventoy from <https://www.ventoy.net/en/download.html> for your OS.
2. Run the Ventoy installer and install Ventoy to your USB drive (this will format the drive; see [Ventoy documentation](https://www.ventoy.net/en/doc_start.html) for details).
3. Copy the Ubuntu Desktop `.iso` file onto the Ventoy partition (drag-and-drop or any file manager). No need to "flash" the ISO — Ventoy boots it directly.

#### Option B -- balenaEtcher (Windows / macOS / Linux)

1. Download [balenaEtcher](https://etcher.balena.io/).
2. Open Etcher, select the `.iso` file, select your USB drive, and click **Flash!**

#### Option C -- Rufus (Windows)

1. Download [Rufus](https://rufus.ie/).
2. Select the USB drive, select the `.iso`, choose **GPT** partition scheme and **UEFI** target, then click **Start**.

#### Option D -- dd (Linux / macOS)

> **Warning:** Double-check the device path. `dd` will overwrite the target without confirmation.

```bash
# Find your USB device (e.g. /dev/sdb or /dev/disk2)
lsblk            # Linux
diskutil list    # macOS

# Write the image (replace /dev/sdX with your USB device)
sudo dd if=ubuntu-24.04.2-desktop-amd64.iso of=/dev/sdX bs=4M status=progress
sync
```

### Boot from USB

1. Insert the USB drive into the Beelink S13 Pro.
2. Power on (or reboot) and press `F7` (or `Del`) to open the boot menu.
3. Select the USB drive as the boot device.
4. You should see the Ubuntu Desktop installer (GRUB menu). Select **Try or Install Ubuntu**.

### Installation Walkthrough

Follow the on-screen prompts. Recommended choices:

| Step | Recommended Setting |
|------|---------------------|
| **Language** | English (or your preference) |
| **Keyboard** | Match your physical keyboard layout |
| **Installation type** | "Erase disk and install Ubuntu" -- select the internal SSD |
| **Network** | Use the detected Ethernet interface; DHCP is fine for now |
| **Profile** | **Your name**: your name |
| | **Computer name (hostname)**: `daemon` |
| | **Username**: pick a username (e.g. `admin`, your name, etc.) |
| | **Password**: choose a strong password |

The installer will write to disk, install packages, and prompt you to **Restart Now**. Remove the USB drive when instructed.

After installation, install OpenSSH server so you can manage the machine remotely:

```bash
sudo apt install -y openssh-server
sudo systemctl enable ssh
```

### First Boot

1. After reboot the machine will display the Ubuntu Desktop login screen. Log in with the username and password you chose.

2. Verify your network connection:

```bash
ip addr show
ping -c 3 ubuntu.com
```

3. Note the machine's IP address (the `inet` line under your Ethernet interface, e.g. `192.168.1.42`). You will use this to SSH in from another computer.

### (Optional) Set a Static IP

If you want the Beelink to always have the same IP on your LAN, edit the Netplan config:

```bash
sudo nano /etc/netplan/00-installer-config.yaml
```

Example static configuration:

```yaml
network:
  version: 2
  ethernets:
    eno1:                          # replace with your interface name
      dhcp4: no
      addresses:
        - 192.168.1.100/24        # choose an IP outside your router's DHCP range
      routes:
        - to: default
          via: 192.168.1.1        # your router/gateway IP
      nameservers:
        addresses:
          - 1.1.1.1
          - 8.8.8.8
```

Apply the changes:

```bash
sudo netplan apply
```

### (Optional) Verify SSH Access from Another Machine

From your laptop or desktop:

```bash
ssh your-username@192.168.1.100
```

If this works, you can disconnect the monitor and keyboard from the Beelink -- all remaining setup can be done over SSH.

---

## Post-Install System Setup (Ubuntu)

> **Windows and macOS users:** Skip this section. Post-install steps are covered in [Windows](#windows-beelink-s13-pro) for Windows. macOS requires no post-install setup. This section is for Ubuntu Desktop installations only.

With Ubuntu Desktop installed, prepare the system for Ollama and Daemon.

### Update the System

```bash
sudo apt update && sudo apt upgrade -y
```

Reboot if a kernel update was installed:

```bash
sudo reboot
```

### Install Essential Packages

```bash
sudo apt install -y curl wget git build-essential
```

| Package | Why |
|---------|-----|
| `curl` | Required by the Ollama installer script |
| `wget` | Handy for downloading files |
| `git` | Needed if you clone this repo or other projects |
| `build-essential` | Occasionally needed to compile native dependencies |

### Set the Timezone

```bash
# List available timezones
timedatectl list-timezones | grep America   # adjust to your region

# Set your timezone (example: US Eastern)
sudo timedatectl set-timezone America/New_York

# Verify
timedatectl
```

NTP synchronisation should already be active (`NTP service: active`). If not:

```bash
sudo timedatectl set-ntp true
```

### Set the Hostname (if you didn't during install)

```bash
sudo hostnamectl set-hostname daemon
```

Edit `/etc/hosts` so the hostname resolves locally:

```bash
sudo nano /etc/hosts
```

Make sure this line exists:

```
127.0.1.1   daemon
```

### (Optional) Create a Dedicated User

If you prefer to run Daemon under its own user account rather than your personal login:

```bash
sudo adduser daemon
sudo usermod -aG sudo daemon
```

You can then SSH in as `daemon` for all Ollama and Daemon operations. This is optional -- running under your main user account is perfectly fine for a personal setup.

### (Optional) Enable Automatic Security Updates

```bash
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

Select **Yes** when prompted. This ensures critical security patches are applied automatically.

### Verify System Resources

Before installing Ollama, confirm you have enough RAM and disk space:

```bash
free -h        # should show ~16 GB total
df -h /        # should show several hundred GB free on the SSD
nproc          # should show 4 (N100/N150 cores)
```

If `free -h` shows significantly less than expected, check if a swap file exists:

```bash
swapon --show
```

If no swap is configured and you want one:

```bash
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

Next: [Ollama + Llama 3.2 8B](03-ollama-llama.md) (macOS and Ubuntu paths; Windows path is self-contained above)
