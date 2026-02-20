# 3 -- Post-Install System Setup (Ubuntu)

> **Windows users:** Skip this guide. Post-install steps are covered in [Windows Setup](02-windows-setup.md). This guide is for Ubuntu Desktop installations only.

With Ubuntu Desktop installed, prepare the system for Ollama and Daemon.

---

## Update the System

```bash
sudo apt update && sudo apt upgrade -y
```

Reboot if a kernel update was installed:

```bash
sudo reboot
```

---

## Install Essential Packages

```bash
sudo apt install -y curl wget git build-essential
```

| Package | Why |
|---------|-----|
| `curl` | Required by the Ollama installer script |
| `wget` | Handy for downloading files |
| `git` | Needed if you clone the daemon-bot repo or other projects |
| `build-essential` | Occasionally needed to compile native dependencies |

---

## Set the Timezone

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

---

## Set the Hostname (if you didn't during install)

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

---

## (Optional) Create a Dedicated User

If you prefer to run Daemon under its own user account rather than your personal login:

```bash
sudo adduser daemon-bot
sudo usermod -aG sudo daemon-bot
```

You can then SSH in as `daemon-bot` for all Ollama and Daemon operations. This is optional -- running under your main user account is perfectly fine for a personal setup.

---

## (Optional) Enable Automatic Security Updates

```bash
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

Select **Yes** when prompted. This ensures critical security patches are applied automatically.

---

## Verify System Resources

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

Next: [Ollama + Llama 3.2 1B](04-ollama-llama.md)
