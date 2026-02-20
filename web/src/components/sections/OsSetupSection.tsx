import { CodeBlock } from '@/components/shared/CodeBlock'
import { OsFilter } from '@/components/shared/OsFilter'
import { StepCheckbox } from '@/components/shared/StepCheckbox'
import { InfoBox } from '@/components/shared/InfoBox'
import { GITHUB_RELEASES_LATEST_URL, CLI_BUILD_URLS } from '@/store/constants'

export function OsSetupSection() {
  return (
    <section id="os-setup">
      <h2 className="text-3xl font-bold tracking-tight">2. OS Setup</h2>

      {/* Windows */}
      <OsFilter os="windows">
        <p className="mt-2 text-muted-foreground">
          The Beelink S13 Pro comes preloaded with <strong>Windows</strong>, so
          this is the simplest path. You need Windows 10 or 11 (64-bit).
        </p>

        <h3 className="mt-6 text-xl font-semibold">Install Ollama for Windows</h3>
        <ol className="mt-3 list-decimal space-y-2 pl-6 text-muted-foreground">
          <li>
            Go to <a href="https://ollama.com" className="underline" target="_blank" rel="noopener noreferrer">ollama.com</a> and
            download the Windows installer.
          </li>
          <li>Run the installer. Ollama will be added to your PATH.</li>
          <li>Open PowerShell and verify:</li>
        </ol>
        <CodeBlock language="powershell" code="ollama --version" />

        <h3 className="mt-6 text-xl font-semibold">Pull the Base Model</h3>
        <CodeBlock language="powershell" code="ollama pull llama3.2:1b" />
        <p className="text-sm text-muted-foreground">
          Downloads about 1 GB. Confirm with:
        </p>
        <CodeBlock language="powershell" code="ollama list" />

        <h3 className="mt-6 text-xl font-semibold">Install Go</h3>
        <p className="mt-2 text-muted-foreground">
          You need Go 1.21+ to build the daemon-setup CLI.
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-6 text-muted-foreground">
          <li>
            <strong>Option A:</strong> Download from{' '}
            <a href="https://go.dev/dl/" className="underline" target="_blank" rel="noopener noreferrer">go.dev/dl</a>.
          </li>
          <li>
            <strong>Option B:</strong> Using winget:
          </li>
        </ul>
        <CodeBlock language="powershell" code="winget install GoLang.Go" />
        <p className="text-sm text-muted-foreground">
          Open a <strong>new</strong> PowerShell window and check:
        </p>
        <CodeBlock language="powershell" code="go version" />

        <h3 className="mt-6 text-xl font-semibold">Get daemon-setup</h3>
        <p className="mt-2 text-muted-foreground">
          Download the latest pre-built binary:{' '}
          <a href={CLI_BUILD_URLS.windowsAmd64} className="underline" target="_blank" rel="noopener noreferrer">daemon-setup-windows-amd64.exe</a>.
          Or build from source:
        </p>
        <CodeBlock language="powershell" code="go build -o daemon-setup.exe ./cmd/daemon-setup" />

        <InfoBox variant="tip">
          You can also use WSL2 and follow the Ubuntu path if you prefer
          a Linux environment while keeping Windows as the host.
        </InfoBox>
      </OsFilter>

      {/* Ubuntu */}
      <OsFilter os="ubuntu">
        <p className="mt-2 text-muted-foreground">
          This path replaces Windows with Ubuntu Desktop 24.04 LTS. The Desktop
          installer is recommended over Server for Beelink S13 hardware.
        </p>

        <h3 className="mt-6 text-xl font-semibold">Download the Installer</h3>
        <ol className="mt-3 list-decimal space-y-2 pl-6 text-muted-foreground">
          <li>
            Download <strong>Ubuntu Desktop 24.04 LTS</strong> from{' '}
            <a href="https://ubuntu.com/download/desktop" className="underline" target="_blank" rel="noopener noreferrer">ubuntu.com</a>.
          </li>
          <li>Optionally verify the checksum:</li>
        </ol>
        <CodeBlock language="bash" code="sha256sum ubuntu-24.04.2-desktop-amd64.iso" />

        <h3 className="mt-6 text-xl font-semibold">Create a Bootable USB</h3>
        <p className="mt-2 text-muted-foreground">
          You need a USB flash drive of at least 4 GB.
        </p>
        <InfoBox variant="tip">
          <strong>Ventoy</strong> (recommended) lets you set up the USB once,
          then drag-and-drop ISO files onto it. Download from{' '}
          <a href="https://www.ventoy.net/" className="underline" target="_blank" rel="noopener noreferrer">ventoy.net</a>.
        </InfoBox>
        <p className="mt-2 text-sm text-muted-foreground">
          Alternatives: balenaEtcher (all platforms), Rufus (Windows), or{' '}
          <code className="rounded bg-muted px-1.5 py-0.5">dd</code> (Linux/macOS).
        </p>

        <h3 className="mt-6 text-xl font-semibold">Boot and Install</h3>
        <ol className="mt-3 list-decimal space-y-2 pl-6 text-muted-foreground">
          <li>Insert USB into the Beelink S13 Pro.</li>
          <li>Power on and press <code className="rounded bg-muted px-1.5 py-0.5 text-sm">F7</code> for boot menu.</li>
          <li>Select the USB drive and choose &quot;Try or Install Ubuntu&quot;.</li>
          <li>Follow the installer — use &quot;Erase disk and install Ubuntu&quot; for a clean install.</li>
          <li>Set hostname to <code className="rounded bg-muted px-1.5 py-0.5 text-sm">daemon</code>, pick a username and strong password.</li>
          <li>Restart and remove the USB when prompted.</li>
        </ol>

        <h3 className="mt-6 text-xl font-semibold">After First Boot</h3>
        <p className="mt-2 text-muted-foreground">Install OpenSSH for remote access:</p>
        <CodeBlock language="bash" code={`sudo apt install -y openssh-server\nsudo systemctl enable ssh`} />
        <p className="mt-2 text-sm text-muted-foreground">Verify network connectivity:</p>
        <CodeBlock language="bash" code={`ip addr show\nping -c 3 ubuntu.com`} />

        <InfoBox variant="tip">
          To set a static IP, edit <code>/etc/netplan/00-installer-config.yaml</code>.
          Once SSH is working, you can disconnect the monitor and keyboard.
        </InfoBox>

        <p className="mt-6 text-muted-foreground">
          For the daemon-setup CLI, download{' '}
          <a href={CLI_BUILD_URLS.linuxAmd64} className="underline" target="_blank" rel="noopener noreferrer">daemon-setup-linux-amd64</a>{' '}
          or see <a href={GITHUB_RELEASES_LATEST_URL} className="underline" target="_blank" rel="noopener noreferrer">GitHub Releases</a>.
          Or build from source in the Daemon Bot step.
        </p>
      </OsFilter>

      {/* macOS */}
      <OsFilter os="macos">
        <p className="mt-2 text-muted-foreground">
          On macOS, the setup is straightforward since Ollama has a native
          installer.
        </p>

        <h3 className="mt-6 text-xl font-semibold">Install Ollama</h3>
        <p className="mt-2 text-muted-foreground">
          Download from{' '}
          <a href="https://ollama.com" className="underline" target="_blank" rel="noopener noreferrer">ollama.com</a>{' '}
          or install via Homebrew:
        </p>
        <CodeBlock language="bash" code="brew install ollama" />
        <CodeBlock language="bash" code="ollama --version" />

        <h3 className="mt-6 text-xl font-semibold">Pull the Base Model</h3>
        <CodeBlock language="bash" code="ollama pull llama3.2:1b" />
        <CodeBlock language="bash" code="ollama list" />

        <h3 className="mt-6 text-xl font-semibold">Install Go</h3>
        <p className="mt-2 text-muted-foreground">Install Go 1.21+ via Homebrew or from go.dev:</p>
        <CodeBlock language="bash" code="brew install go" />
        <CodeBlock language="bash" code="go version" />

        <h3 className="mt-6 text-xl font-semibold">Get daemon-setup</h3>
        <p className="mt-2 text-muted-foreground">
          Download the latest pre-built binary:{' '}
          <a href={CLI_BUILD_URLS.darwinArm64} className="underline" target="_blank" rel="noopener noreferrer">daemon-setup-darwin-arm64</a>.
          Or build from source:
        </p>
        <CodeBlock language="bash" code="go build -o daemon-setup ./cmd/daemon-setup" />
      </OsFilter>

      <StepCheckbox stepId="os-installed" label="Operating system installed" />
      <StepCheckbox stepId="go-installed" label="Go installed" />
    </section>
  )
}
