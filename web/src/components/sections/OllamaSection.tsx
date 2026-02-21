import { Card, CardContent } from '@/components/ui/card'
import { CodeBlock } from '@/components/shared/CodeBlock'
import { OsFilter } from '@/components/shared/OsFilter'
import { InfoBox } from '@/components/shared/InfoBox'

const resourceUsage = [
  { resource: 'RAM', usage: '1-2 GB while model is loaded' },
  { resource: 'Disk', usage: '~1 GB for the Q4_K_M quantised model' },
  { resource: 'CPU', usage: 'All cores utilised during inference' },
  { resource: 'Idle', usage: 'Model unloaded after 5 min of inactivity' },
]

const commands = [
  { command: 'ollama list', description: 'Show installed models' },
  { command: 'ollama pull llama3.2:1b', description: 'Download or update the model' },
  { command: 'ollama rm llama3.2:1b', description: 'Remove the model' },
  { command: 'ollama run llama3.2:1b', description: 'Interactive chat' },
  { command: 'ollama show llama3.2:1b', description: 'Show model details' },
  { command: 'ollama ps', description: 'Show loaded models and memory usage' },
]

export function OllamaSection() {
  return (
    <section id="ollama">
      <h2 className="text-3xl font-bold tracking-tight">4. Ollama + Llama 3.2 1B</h2>
      <p className="mt-2 text-muted-foreground">
        Ollama is a lightweight runtime for downloading, running, and managing
        LLMs locally. It exposes an HTTP API that Daemon uses.
      </p>

      <h3 className="mt-6 text-xl font-semibold">Install Ollama</h3>
      <OsFilter os="ubuntu">
        <CodeBlock language="bash" code="curl -fsSL https://ollama.com/install.sh | sh" />
        <p className="text-sm text-muted-foreground">
          This installs Ollama and creates a systemd service.
        </p>
      </OsFilter>
      <OsFilter os="windows">
        <p className="mt-2 text-muted-foreground">
          If you haven't already, download and run the installer from{' '}
          <a href="https://ollama.com" className="underline" target="_blank" rel="noopener noreferrer">ollama.com</a>.
        </p>
      </OsFilter>
      <OsFilter os="macos">
        <p className="mt-2 text-muted-foreground">
          If you haven't already:
        </p>
        <CodeBlock language="bash" code="brew install ollama" />
      </OsFilter>
      <p className="mt-2 text-sm text-muted-foreground">Verify the installation:</p>
      <CodeBlock code="ollama --version" />

      <h3 className="mt-6 text-xl font-semibold">Pull the Model</h3>
      <CodeBlock code="ollama pull llama3.2:1b" />
      <p className="text-sm text-muted-foreground">
        Downloads the default Q4_K_M quantised version (~1 GB). Verify:
      </p>
      <CodeBlock code="ollama list" />

      <h3 className="mt-6 text-xl font-semibold">Test Interactively</h3>
      <CodeBlock code="ollama run llama3.2:1b" />
      <p className="text-sm text-muted-foreground">
        Try a question at the prompt. On the N100/N150 expect ~10-30 tokens/sec.
        Exit with <code className="rounded bg-muted px-1.5 py-0.5">/bye</code> or Ctrl+D.
      </p>

      <OsFilter os="ubuntu">
        <h3 className="mt-6 text-xl font-semibold">Systemd Service</h3>
        <p className="mt-2 text-muted-foreground">
          The installer creates a service. Confirm it's running:
        </p>
        <CodeBlock language="bash" code="sudo systemctl status ollama" />
        <p className="text-sm text-muted-foreground">If not running:</p>
        <CodeBlock language="bash" code={`sudo systemctl enable ollama\nsudo systemctl start ollama`} />

        <h4 className="mt-4 text-lg font-medium">Verify the API</h4>
        <CodeBlock language="bash" code="curl http://localhost:11434/api/tags" />

        <h4 className="mt-4 text-lg font-medium">Bind to All Interfaces (LAN Access)</h4>
        <InfoBox variant="warning">
          Only do this on a trusted home network. See the Security section for
          firewall rules.
        </InfoBox>
        <CodeBlock language="bash" code="sudo systemctl edit ollama" />
        <p className="text-sm text-muted-foreground">Add:</p>
        <CodeBlock language="ini" code={`[Service]\nEnvironment="OLLAMA_HOST=0.0.0.0"`} />
        <CodeBlock language="bash" code={`sudo systemctl daemon-reload\nsudo systemctl restart ollama`} />
      </OsFilter>

      <h3 className="mt-6 text-xl font-semibold">Resource Usage</h3>
      <Card className="mt-4">
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Resource</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Approximate Usage</th>
              </tr>
            </thead>
            <tbody>
              {resourceUsage.map(({ resource, usage }) => (
                <tr key={resource} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium">{resource}</td>
                  <td className="px-4 py-3 text-muted-foreground">{usage}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <h3 className="mt-6 text-xl font-semibold">Useful Commands</h3>
      <Card className="mt-4">
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Command</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Description</th>
              </tr>
            </thead>
            <tbody>
              {commands.map(({ command, description }) => (
                <tr key={command} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{command}</code>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </section>
  )
}
