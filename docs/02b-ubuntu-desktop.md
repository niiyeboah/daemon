# 2b -- Ubuntu Desktop Installation

This guide walks through installing Ubuntu Desktop 24.04 LTS on the Beelink S13 Pro. Ubuntu **Desktop** is recommended over Server for the Beelink S13 — the Server installer has known compatibility issues with this hardware, while Desktop installs reliably.

> **Note:** The Beelink S13 Pro comes preloaded with Windows. If you prefer to keep Windows, see [Windows Setup](02-windows-setup.md) instead — it is the simpler path.

---

## Download the Installer

1. Go to <https://ubuntu.com/download/desktop> and download **Ubuntu Desktop 24.04 LTS** (the `.iso` file).
2. Optionally verify the download checksum against the SHA256 hash listed on the download page:

```bash
sha256sum ubuntu-24.04.2-desktop-amd64.iso
```

---

## Create a Bootable USB Drive

You need a USB flash drive of at least 4 GB.

### Option A -- Ventoy (recommended)

[Ventoy](https://www.ventoy.net/) lets you set up the USB once, then copy one or more `.iso` files onto it and choose which to boot. You can add or replace ISOs without re-flashing the drive.

1. Download Ventoy from <https://www.ventoy.net/en/download.html> for your OS.
2. Run the Ventoy installer and install Ventoy to your USB drive (this will format the drive; see [Ventoy documentation](https://www.ventoy.net/en/doc_start.html) for details).
3. Copy the Ubuntu Desktop `.iso` file onto the Ventoy partition (drag-and-drop or any file manager). No need to "flash" the ISO — Ventoy boots it directly.

### Option B -- balenaEtcher (Windows / macOS / Linux)

1. Download [balenaEtcher](https://etcher.balena.io/).
2. Open Etcher, select the `.iso` file, select your USB drive, and click **Flash!**

### Option C -- Rufus (Windows)

1. Download [Rufus](https://rufus.ie/).
2. Select the USB drive, select the `.iso`, choose **GPT** partition scheme and **UEFI** target, then click **Start**.

### Option D -- dd (Linux / macOS)

> **Warning:** Double-check the device path. `dd` will overwrite the target without confirmation.

```bash
# Find your USB device (e.g. /dev/sdb or /dev/disk2)
lsblk            # Linux
diskutil list    # macOS

# Write the image (replace /dev/sdX with your USB device)
sudo dd if=ubuntu-24.04.2-desktop-amd64.iso of=/dev/sdX bs=4M status=progress
sync
```

---

## Boot from USB

1. Insert the USB drive into the Beelink S13 Pro.
2. Power on (or reboot) and press `F7` (or `Del`) to open the boot menu.
3. Select the USB drive as the boot device.
4. You should see the Ubuntu Desktop installer (GRUB menu). Select **Try or Install Ubuntu**.

---

## Installation Walkthrough

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

---

## First Boot

1. After reboot the machine will display the Ubuntu Desktop login screen. Log in with the username and password you chose.

2. Verify your network connection:

```bash
ip addr show
ping -c 3 ubuntu.com
```

3. Note the machine's IP address (the `inet` line under your Ethernet interface, e.g. `192.168.1.42`). You will use this to SSH in from another computer.

---

## (Optional) Set a Static IP

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

---

## (Optional) Verify SSH Access from Another Machine

From your laptop or desktop:

```bash
ssh your-username@192.168.1.100
```

If this works, you can disconnect the monitor and keyboard from the Beelink -- all remaining setup can be done over SSH.

---

Next: [Post-Install Setup](03-post-install.md) (for Ubuntu-specific system configuration)
