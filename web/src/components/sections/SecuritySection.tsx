import { CodeBlock } from '@/components/shared/CodeBlock'
import { OsFilter } from '@/components/shared/OsFilter'
import { StepCheckbox } from '@/components/shared/StepCheckbox'
import { InfoBox } from '@/components/shared/InfoBox'

export function SecuritySection() {
  return (
    <section id="security">
      <h2 className="text-3xl font-bold tracking-tight">6. Security</h2>
      <p className="mt-2 text-muted-foreground">
        Your Daemon box is a server on your network. Basic security hygiene
        prevents accidental exposure.
      </p>

      <OsFilter os="windows">
        <InfoBox variant="note">
          Windows Firewall is enabled by default. Ollama only listens on
          localhost, so no additional firewall configuration is typically
          needed. If you expose Ollama to your LAN, add a Windows Firewall
          rule to allow port 11434 from your local subnet only.
        </InfoBox>
      </OsFilter>

      <OsFilter os="macos">
        <InfoBox variant="note">
          macOS has a built-in firewall (System Settings &gt; Network &gt; Firewall).
          Ollama only listens on localhost by default. If you expose it to
          your LAN, ensure your firewall permits port 11434 from your local
          subnet only.
        </InfoBox>
      </OsFilter>

      <OsFilter os="ubuntu">
        <h3 className="mt-6 text-xl font-semibold">Firewall with UFW</h3>
        <CodeBlock
          language="bash"
          code={`sudo ufw default deny incoming\nsudo ufw default allow outgoing`}
        />

        <h4 className="mt-4 text-lg font-medium">Allow SSH</h4>
        <CodeBlock language="bash" code="sudo ufw allow ssh" />

        <h4 className="mt-4 text-lg font-medium">Allow Ollama (LAN Only)</h4>
        <InfoBox variant="note">
          Only needed if you bound Ollama to 0.0.0.0. Replace the subnet
          with your actual LAN range.
        </InfoBox>
        <CodeBlock
          language="bash"
          code="sudo ufw allow from 192.168.1.0/24 to any port 11434 proto tcp"
        />

        <h4 className="mt-4 text-lg font-medium">Enable</h4>
        <CodeBlock language="bash" code="sudo ufw enable" />
        <CodeBlock language="bash" code="sudo ufw status verbose" />

        <StepCheckbox stepId="firewall-configured" label="Firewall configured" />

        <h3 className="mt-6 text-xl font-semibold">SSH Hardening</h3>

        <h4 className="mt-4 text-lg font-medium">1. Key-Based Authentication</h4>
        <p className="mt-2 text-sm text-muted-foreground">
          On your <strong>local machine</strong>:
        </p>
        <CodeBlock
          language="bash"
          code={`ssh-keygen -t ed25519 -C "your-email@example.com"\nssh-copy-id your-username@192.168.1.100`}
        />

        <h4 className="mt-4 text-lg font-medium">2. Disable Password Authentication</h4>
        <InfoBox variant="warning">
          Make sure key-based login works <strong>before</strong> disabling
          password auth, or you will lock yourself out.
        </InfoBox>
        <p className="mt-2 text-sm text-muted-foreground">
          Edit <code className="rounded bg-muted px-1.5 py-0.5">/etc/ssh/sshd_config</code> and set:
        </p>
        <CodeBlock
          code={`PasswordAuthentication no\nPermitRootLogin no`}
        />
        <CodeBlock language="bash" code="sudo systemctl restart ssh" />

        <StepCheckbox stepId="ssh-hardened" label="SSH access hardened" />

        <h3 className="mt-6 text-xl font-semibold">Automatic Security Updates</h3>
        <CodeBlock
          language="bash"
          code={`sudo apt install -y unattended-upgrades\nsudo dpkg-reconfigure -plow unattended-upgrades`}
        />
        <p className="text-sm text-muted-foreground">Select Yes when prompted.</p>

        <StepCheckbox stepId="auto-updates-enabled" label="Automatic updates enabled" />

        <h3 className="mt-6 text-xl font-semibold">Fail2Ban (Optional)</h3>
        <CodeBlock
          language="bash"
          code={`sudo apt install -y fail2ban\nsudo systemctl enable fail2ban\nsudo systemctl start fail2ban`}
        />
        <p className="text-sm text-muted-foreground">
          Monitors logs and bans IPs with repeated failed SSH attempts.
        </p>
      </OsFilter>

    </section>
  )
}
