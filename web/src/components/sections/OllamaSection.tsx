import { Card, CardContent } from '@/components/ui/card'
import { CodeBlock } from '@/components/shared/CodeBlock'
import { OsFilter } from '@/components/shared/OsFilter'
import { InfoBox } from '@/components/shared/InfoBox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { GITHUB_RELEASES_LATEST_URL, CLI_BUILD_URLS } from '@/store/constants'

const resourceUsage = [
  { resource: 'RAM', usage: '1-2 GB while model is loaded' },
  { resource: 'Disk', usage: '~1 GB for the Q4_K_M quantised model' },
  { resource: 'CPU', usage: 'All cores utilised during inference' },
  { resource: 'Idle', usage: 'Model unloaded after 5 min of inactivity' },
]

const commands = [
  { command: 'ollama list', description: 'Show installed models' },
  { command: 'ollama pull llama3.2:8b', description: 'Download or update the model' },
  { command: 'ollama rm llama3.2:8b', description: 'Remove the model' },
  { command: 'ollama run llama3.2:8b', description: 'Interactive chat' },
  { command: 'ollama show llama3.2:8b', description: 'Show model details' },
  { command: 'ollama ps', description: 'Show loaded models and memory usage' },
]

const modelfile = `FROM llama3.2:8b

PARAMETER temperature 0.7
PARAMETER top_p 0.9
PARAMETER num_ctx 16384

SYSTEM """
You are Daemon, a helpful and concise personal assistant running locally on the user's own hardware. You respect the user's privacy -- no data ever leaves this machine. You answer questions clearly and directly. When you are unsure, you say so. You are friendly but not verbose.
"""`

const pythonScript = `#!/usr/bin/env python3
"""Daemon -- local personal assistant powered by Llama 3.2 8B via Ollama."""

import json
import sys
import requests

OLLAMA_URL = "http://localhost:11434/api/chat"
MODEL = "llama3.2:8b"

SYSTEM_PROMPT = (
    "You are Daemon, a helpful and concise personal assistant running locally "
    "on the user's own hardware. You respect the user's privacy -- no data "
    "ever leaves this machine. You answer questions clearly and directly. "
    "When you are unsure, you say so. You are friendly but not verbose."
)

def chat(messages: list[dict]) -> str:
    payload = {"model": MODEL, "messages": messages, "stream": False}
    resp = requests.post(OLLAMA_URL, json=payload, timeout=120)
    resp.raise_for_status()
    return resp.json()["message"]["content"]

def main() -> None:
    print("Daemon is ready. Type your message (Ctrl+C or 'exit' to quit).\\n")
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    while True:
        try:
            user_input = input("You: ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\\nGoodbye.")
            break
        if not user_input:
            continue
        if user_input.lower() in ("exit", "quit", "bye"):
            print("Goodbye.")
            break
        messages.append({"role": "user", "content": user_input})
        try:
            reply = chat(messages)
        except requests.RequestException as exc:
            print(f"[Error communicating with Ollama: {exc}]")
            messages.pop()
            continue
        messages.append({"role": "assistant", "content": reply})
        print(f"Daemon: {reply}\\n")

if __name__ == "__main__":
    main()`

export function OllamaSection() {
  return (
    <section id="ollama">
      <h2 className="text-3xl font-bold tracking-tight">4. Ollama + Llama 3.2 8B</h2>
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
      <CodeBlock code="ollama pull llama3.2:8b" />
      <p className="text-sm text-muted-foreground">
        Downloads the default Q4_K_M quantised version (~1 GB). Verify:
      </p>
      <CodeBlock code="ollama list" />

      <h3 className="mt-6 text-xl font-semibold">Test Interactively</h3>
      <CodeBlock code="ollama run llama3.2:8b" />
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

      <h3 className="mt-10 text-xl font-semibold">Set up Daemon with the CLI</h3>
      <p className="mt-2 text-muted-foreground">
        With Ollama running and the model downloaded, give your assistant its
        identity. Choose one of two approaches:
      </p>

      <h4 className="mt-6 text-lg font-medium">Using daemon-setup (Recommended)</h4>
      <p className="mt-2 text-muted-foreground">
        The <code className="rounded bg-muted px-1.5 py-0.5">daemon-setup</code> CLI
        automates all steps below. Run it interactively or use subcommands:
      </p>

      <InfoBox variant="tip">
        Pre-built binaries:{' '}
        <a href={CLI_BUILD_URLS.windowsAmd64} className="underline" target="_blank" rel="noopener noreferrer">Windows (amd64)</a>
        {' · '}
        <a href={CLI_BUILD_URLS.linuxAmd64} className="underline" target="_blank" rel="noopener noreferrer">Linux (amd64)</a>
        {' · '}
        <a href={CLI_BUILD_URLS.darwinArm64} className="underline" target="_blank" rel="noopener noreferrer">macOS (Apple Silicon)</a>.
        Or see all builds on <a href={GITHUB_RELEASES_LATEST_URL} className="underline" target="_blank" rel="noopener noreferrer">GitHub Releases</a>.
      </InfoBox>

      <OsFilter os="windows">
        <CodeBlock language="powershell" code={`.\\daemon-setup check\n.\\daemon-setup init\n.\\daemon-setup alias`} />
      </OsFilter>
      <OsFilter os="ubuntu">
        <CodeBlock language="bash" code={`./daemon-setup check\n./daemon-setup init\n./daemon-setup alias`} />
      </OsFilter>
      <OsFilter os="macos">
        <CodeBlock language="bash" code={`./daemon-setup check\n./daemon-setup init\n./daemon-setup alias`} />
      </OsFilter>

      <InfoBox variant="tip">
        Or run everything at once: <code className="rounded bg-muted px-1.5 py-0.5">./daemon-setup setup</code> (add <code className="rounded bg-muted px-1.5 py-0.5">--yes</code> to skip confirmations).
      </InfoBox>

      <h4 className="mt-8 text-lg font-medium">Manual Setup</h4>
      <p className="mt-2 text-muted-foreground">
        If you prefer to do things manually, pick one of these approaches:
      </p>

      <Tabs defaultValue="modelfile" className="mt-4">
        <TabsList>
          <TabsTrigger value="modelfile">Option A: Modelfile (Simplest)</TabsTrigger>
          <TabsTrigger value="python">Option B: Python API Script</TabsTrigger>
        </TabsList>

        <TabsContent value="modelfile" className="mt-4">
          <h5 className="text-base font-medium">1. Write the Modelfile</h5>
          <CodeBlock language="dockerfile" title="~/Modelfile" code={modelfile} />

          <h5 className="mt-4 text-base font-medium">2. Create the Custom Model</h5>
          <CodeBlock code="ollama create daemon -f ~/Modelfile" />
          <CodeBlock code="ollama list" />

          <h5 className="mt-4 text-base font-medium">3. Run Daemon</h5>
          <CodeBlock code="ollama run daemon" />

          <h5 className="mt-4 text-base font-medium">4. Shell Alias (Optional)</h5>
          <OsFilter os="ubuntu">
            <CodeBlock language="bash" code={`echo 'alias daemon="ollama run daemon"' >> ~/.bashrc\nsource ~/.bashrc`} />
          </OsFilter>
          <OsFilter os="macos">
            <CodeBlock language="bash" code={`echo 'alias daemon="ollama run daemon"' >> ~/.zshrc\nsource ~/.zshrc`} />
          </OsFilter>
          <OsFilter os="windows">
            <p className="text-sm text-muted-foreground">
              The <code className="rounded bg-muted px-1.5 py-0.5">daemon-setup alias</code> command
              adds a PowerShell function to your profile. Or run{' '}
              <code className="rounded bg-muted px-1.5 py-0.5">ollama run daemon</code> directly.
            </p>
          </OsFilter>
        </TabsContent>

        <TabsContent value="python" className="mt-4">
          <h5 className="text-base font-medium">1. Install Python and Dependencies</h5>
          <OsFilter os="ubuntu">
            <CodeBlock language="bash" code="sudo apt install -y python3 python3-pip python3-venv" />
          </OsFilter>
          <CodeBlock
            language="bash"
            code={`mkdir -p ~/daemon && cd ~/daemon\npython3 -m venv .venv\nsource .venv/bin/activate\npip install requests`}
          />

          <h5 className="mt-4 text-base font-medium">2. Create the Script</h5>
          <CodeBlock language="python" title="~/daemon/daemon.py" code={pythonScript} />

          <h5 className="mt-4 text-base font-medium">3. Run It</h5>
          <CodeBlock
            language="bash"
            code={`cd ~/daemon\nsource .venv/bin/activate\npython daemon.py`}
          />

          <OsFilter os="ubuntu">
            <h5 className="mt-4 text-base font-medium">4. Run as Systemd Service (Optional)</h5>
            <CodeBlock
              language="ini"
              title="/etc/systemd/system/daemon-chat.service"
              code={`[Unit]
Description=Daemon Personal Assistant
After=network.target ollama.service

[Service]
Type=simple
User=your-username
WorkingDirectory=/home/your-username/daemon
ExecStart=/home/your-username/daemon/.venv/bin/python daemon.py
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target`}
            />
            <CodeBlock
              language="bash"
              code={`sudo systemctl daemon-reload\nsudo systemctl enable daemon-chat\nsudo systemctl start daemon-chat`}
            />
          </OsFilter>
        </TabsContent>
      </Tabs>

      <h4 className="mt-8 text-lg font-medium">Customising the System Prompt</h4>
      <p className="mt-2 text-muted-foreground">
        Edit the system prompt to change Daemon's personality. Ideas: change
        the tone, add rules (bullet points only, 3-sentence limit), or add
        context about yourself.
      </p>
    </section>
  )
}
