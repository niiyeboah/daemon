import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CodeBlock } from '@/components/shared/CodeBlock'
import { OsFilter } from '@/components/shared/OsFilter'
import { StepCheckbox } from '@/components/shared/StepCheckbox'
import { InfoBox } from '@/components/shared/InfoBox'
import { GITHUB_RELEASES_LATEST_URL } from '@/store/constants'

const modelfile = `FROM llama3.2:3b

PARAMETER temperature 0.7
PARAMETER top_p 0.9
PARAMETER num_ctx 2048

SYSTEM """
You are Daemon, a helpful and concise personal assistant running locally on the user's own hardware. You respect the user's privacy -- no data ever leaves this machine. You answer questions clearly and directly. When you are unsure, you say so. You are friendly but not verbose.
"""`

const pythonScript = `#!/usr/bin/env python3
"""Daemon -- local personal assistant powered by Llama 3.2 3B via Ollama."""

import json
import sys
import requests

OLLAMA_URL = "http://localhost:11434/api/chat"
MODEL = "llama3.2:3b"

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

export function DaemonBotSection() {
  return (
    <section id="daemon-bot">
      <h2 className="text-3xl font-bold tracking-tight">5. Daemon Bot</h2>
      <p className="mt-2 text-muted-foreground">
        With Ollama running and the model downloaded, give your assistant its
        identity. Choose one of two approaches:
      </p>

      <h3 className="mt-6 text-xl font-semibold">Using daemon-setup (Recommended)</h3>
      <p className="mt-2 text-muted-foreground">
        The <code className="rounded bg-muted px-1.5 py-0.5">daemon-setup</code> CLI
        automates all steps below. Run it interactively or use subcommands:
      </p>

      <InfoBox variant="tip">
        Pre-built binaries for Windows, Linux, and macOS are available on{' '}
        <a href={GITHUB_RELEASES_LATEST_URL} className="underline" target="_blank" rel="noopener noreferrer">GitHub Releases</a>.
        Download the file for your OS and run the commands below.
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

      <StepCheckbox stepId="daemon-setup-built" label="daemon-setup CLI built" />
      <StepCheckbox stepId="daemon-model-created" label="Daemon model created" />
      <StepCheckbox stepId="shell-alias-added" label="Shell alias configured" />

      <h3 className="mt-8 text-xl font-semibold">Manual Setup</h3>
      <p className="mt-2 text-muted-foreground">
        If you prefer to do things manually, pick one of these approaches:
      </p>

      <Tabs defaultValue="modelfile" className="mt-4">
        <TabsList>
          <TabsTrigger value="modelfile">Option A: Modelfile (Simplest)</TabsTrigger>
          <TabsTrigger value="python">Option B: Python API Script</TabsTrigger>
        </TabsList>

        <TabsContent value="modelfile" className="mt-4">
          <h4 className="text-lg font-medium">1. Write the Modelfile</h4>
          <CodeBlock language="dockerfile" title="~/Modelfile" code={modelfile} />

          <h4 className="mt-4 text-lg font-medium">2. Create the Custom Model</h4>
          <CodeBlock code="ollama create daemon -f ~/Modelfile" />
          <CodeBlock code="ollama list" />

          <h4 className="mt-4 text-lg font-medium">3. Run Daemon</h4>
          <CodeBlock code="ollama run daemon" />

          <h4 className="mt-4 text-lg font-medium">4. Shell Alias (Optional)</h4>
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
          <h4 className="text-lg font-medium">1. Install Python and Dependencies</h4>
          <OsFilter os="ubuntu">
            <CodeBlock language="bash" code="sudo apt install -y python3 python3-pip python3-venv" />
          </OsFilter>
          <CodeBlock
            language="bash"
            code={`mkdir -p ~/daemon-bot && cd ~/daemon-bot\npython3 -m venv .venv\nsource .venv/bin/activate\npip install requests`}
          />

          <h4 className="mt-4 text-lg font-medium">2. Create the Script</h4>
          <CodeBlock language="python" title="~/daemon-bot/daemon.py" code={pythonScript} />

          <h4 className="mt-4 text-lg font-medium">3. Run It</h4>
          <CodeBlock
            language="bash"
            code={`cd ~/daemon-bot\nsource .venv/bin/activate\npython daemon.py`}
          />

          <OsFilter os="ubuntu">
            <h4 className="mt-4 text-lg font-medium">4. Run as Systemd Service (Optional)</h4>
            <CodeBlock
              language="ini"
              title="/etc/systemd/system/daemon-bot.service"
              code={`[Unit]
Description=Daemon Personal Assistant Bot
After=network.target ollama.service

[Service]
Type=simple
User=your-username
WorkingDirectory=/home/your-username/daemon-bot
ExecStart=/home/your-username/daemon-bot/.venv/bin/python daemon.py
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target`}
            />
            <CodeBlock
              language="bash"
              code={`sudo systemctl daemon-reload\nsudo systemctl enable daemon-bot\nsudo systemctl start daemon-bot`}
            />
          </OsFilter>
        </TabsContent>
      </Tabs>

      <h3 className="mt-8 text-xl font-semibold">Customising the System Prompt</h3>
      <p className="mt-2 text-muted-foreground">
        Edit the system prompt to change Daemon's personality. Ideas: change
        the tone, add rules (bullet points only, 3-sentence limit), or add
        context about yourself.
      </p>
    </section>
  )
}
