import { CodeBlock } from '@/components/shared/CodeBlock'
import { InfoBox } from '@/components/shared/InfoBox'
import { OsFilter } from '@/components/shared/OsFilter'

export function PostInstallSection() {
  return (
    <section id="post-install">
      <h2 className="text-3xl font-bold tracking-tight">3. Post-Install Setup</h2>

      {/* macOS */}
      <OsFilter os="macos">
        <p className="mt-2 text-muted-foreground">
          macOS is ready to go. No additional post-install steps are needed.
          Proceed to the OpenRouter section below.
        </p>
      </OsFilter>

      {/* Windows */}
      <OsFilter os="windows">
        <p className="mt-2 text-muted-foreground">
          Windows is ready to go. No additional post-install steps are needed.
          Proceed to the OpenRouter section below.
        </p>
      </OsFilter>

      {/* Ubuntu */}
      <OsFilter os="ubuntu">
        <p className="mt-2 text-muted-foreground">
          Prepare the Ubuntu system for Daemon.
        </p>

        <h3 className="mt-6 text-xl font-semibold">Update the System</h3>
        <CodeBlock language="bash" code="sudo apt update && sudo apt upgrade -y" />
        <p className="text-sm text-muted-foreground">
          Reboot if a kernel update was installed:
        </p>
        <CodeBlock language="bash" code="sudo reboot" />

        <h3 className="mt-6 text-xl font-semibold">Install Essential Packages</h3>
        <CodeBlock language="bash" code="sudo apt install -y curl wget git build-essential" />

        <h3 className="mt-6 text-xl font-semibold">Set the Timezone</h3>
        <CodeBlock
          language="bash"
          code={`# List available timezones\ntimedatectl list-timezones | grep America\n\n# Set your timezone (example: US Eastern)\nsudo timedatectl set-timezone America/New_York\n\n# Verify\ntimedatectl`}
        />

        <h3 className="mt-6 text-xl font-semibold">Set the Hostname</h3>
        <CodeBlock language="bash" code="sudo hostnamectl set-hostname daemon" />
        <p className="text-sm text-muted-foreground">
          Also add <code className="rounded bg-muted px-1.5 py-0.5">127.0.1.1 daemon</code> to{' '}
          <code className="rounded bg-muted px-1.5 py-0.5">/etc/hosts</code>.
        </p>

        <h3 className="mt-6 text-xl font-semibold">Verify System Resources</h3>
        <CodeBlock
          language="bash"
          code={`free -h        # should show ~16 GB total\ndf -h /        # should show several hundred GB free\nnproc          # should show 4 (N100/N150 cores)`}
        />

        <InfoBox variant="tip">
          If no swap is configured and you want one, create a 4 GB swap file:
        </InfoBox>
        <CodeBlock
          language="bash"
          code={`sudo fallocate -l 4G /swapfile\nsudo chmod 600 /swapfile\nsudo mkswap /swapfile\nsudo swapon /swapfile\necho '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab`}
        />
      </OsFilter>
    </section>
  )
}
