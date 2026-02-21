# 5 -- Security

Your Daemon box is a server on your network. Even on a home LAN, basic security hygiene prevents accidental exposure and keeps the system healthy.

---

## Firewall with UFW

Ubuntu's **Uncomplicated Firewall (UFW)** is the simplest way to control inbound traffic.

### Enable UFW

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
```

### Allow SSH

```bash
sudo ufw allow ssh          # port 22/tcp
```

### Allow Ollama (LAN only)

Only necessary if you configured Ollama to bind to `0.0.0.0` (see [Ollama guide](03-ollama-llama.md)) and want to reach it from other devices on your network:

```bash
# Replace 192.168.1.0/24 with your actual LAN subnet
sudo ufw allow from 192.168.1.0/24 to any port 11434 proto tcp
```

If Ollama only listens on `localhost` (the default), you do not need this rule.

### Enable the Firewall

```bash
sudo ufw enable
```

### Verify

```bash
sudo ufw status verbose
```

Expected output:

```
Status: active
Logging: on (low)
Default: deny (incoming), allow (outgoing), disabled (routed)

To                         Action      From
--                         ------      ----
22/tcp                     ALLOW IN    Anywhere
11434/tcp                  ALLOW IN    192.168.1.0/24
```

---

## SSH Hardening

### 1. Use Key-Based Authentication

On your **local machine** (laptop/desktop), generate a key pair if you don't already have one:

```bash
ssh-keygen -t ed25519 -C "your-email@example.com"
```

Copy the public key to the Daemon server:

```bash
ssh-copy-id your-username@192.168.1.100
```

Test that you can log in without a password:

```bash
ssh your-username@192.168.1.100
```

### 2. Disable Password Authentication

Once key-based login is confirmed:

```bash
sudo nano /etc/ssh/sshd_config
```

Find and set:

```
PasswordAuthentication no
PermitRootLogin no
```

Restart SSH:

```bash
sudo systemctl restart ssh
```

> **Important:** Make sure key-based login works *before* disabling password auth, or you will lock yourself out.

### 3. (Optional) Change the SSH Port

Changing the default port reduces automated scan noise (it does not replace a firewall):

```bash
sudo nano /etc/ssh/sshd_config
```

```
Port 2222    # or any unused port
```

Update UFW:

```bash
sudo ufw delete allow ssh
sudo ufw allow 2222/tcp
sudo systemctl restart ssh
```

Connect with:

```bash
ssh -p 2222 your-username@192.168.1.100
```

---

## Automatic Security Updates

If you did not set this up during [post-install](02-os-setup.md#post-install-system-setup-ubuntu):

```bash
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

Select **Yes**. This ensures security patches from the Ubuntu archive are installed automatically.

To verify it is active:

```bash
systemctl status unattended-upgrades
```

Configuration lives in `/etc/apt/apt.conf.d/50unattended-upgrades` if you want to fine-tune which packages are auto-updated.

---

## Fail2Ban (Optional)

Fail2Ban monitors log files and temporarily bans IPs that show malicious signs (e.g. repeated failed SSH logins):

```bash
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

The default configuration protects SSH out of the box. Check status:

```bash
sudo fail2ban-client status sshd
```

---

## Summary Checklist

- [ ] UFW enabled with `deny incoming` / `allow outgoing` defaults.
- [ ] SSH allowed (port 22 or custom).
- [ ] Ollama port restricted to LAN subnet (if bound to 0.0.0.0).
- [ ] Key-based SSH login working.
- [ ] Password authentication disabled.
- [ ] Unattended-upgrades enabled.
- [ ] (Optional) Fail2Ban installed and running.

---

Next: [Troubleshooting](06-troubleshooting.md)
