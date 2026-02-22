import { CodeBlock } from '@/components/shared/CodeBlock'

const OPENCLAW_DOC_URL = 'https://github.com/niiyeboah/daemon/blob/main/docs/07-openclaw-automation.md'
const OPENCLAW_SETUP_URL = 'https://docs.openclaw.ai/setup'
const OPENCLAW_GETTING_STARTED_URL = 'https://docs.openclaw.ai/start/getting-started'
const OPENCLAW_CHANNELS_URL = 'https://docs.openclaw.ai/channels'
const OPENCLAW_OLLAMA_PROVIDER_URL = 'https://docs.openclaw.ai/providers/ollama'

export function OpenClawSection() {
  return (
    <section id="openclaw">
      <h2 className="text-3xl font-bold tracking-tight">7. OpenClaw & Automation</h2>
      <p className="mt-2 text-muted-foreground">
        Give Daemon channels, skills, and schedules so it can work for you like
        a personal employee.
      </p>

      <h3 className="mt-8 text-xl font-semibold">Daemon as a personal employee</h3>
      <p className="mt-2 text-muted-foreground">
        Daemon is the brain — your local LLM. OpenClaw is the layer that gives
        it &quot;hands&quot;: messaging apps (Telegram, Discord, Slack),
        automation skills from ClawHub, and scheduled jobs. Together they can
        act on your behalf: respond on your channels, run workflows, and execute
        tasks on a schedule.
      </p>

      <h3 className="mt-8 text-xl font-semibold">Set up OpenClaw</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Prerequisites: Node.js 22+. Install with the script below, then run the
        onboarding wizard.
      </p>
      <CodeBlock
        language="bash"
        code={`# macOS / Linux
curl -fsSL https://openclaw.ai/install.sh | bash

# First-time setup
openclaw onboard --install-daemon`}
      />
      <p className="mt-2 text-sm text-muted-foreground">
        Check the gateway with <code className="rounded bg-muted px-1.5 py-0.5">openclaw gateway status</code> and
        open the Control UI with <code className="rounded bg-muted px-1.5 py-0.5">openclaw dashboard</code>. For
        Windows and full options, see the{' '}
        <a
          href={OPENCLAW_DOC_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          full guide
        </a>
        .
      </p>

      <h3 className="mt-8 text-xl font-semibold">Connect local Ollama (Daemon)</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        So that OpenClaw uses your existing Daemon (Ollama), set{' '}
        <code className="rounded bg-muted px-1.5 py-0.5">OLLAMA_API_KEY</code> (any value works).
        Set the default model to <code className="rounded bg-muted px-1.5 py-0.5">ollama/daemon</code> or{' '}
        <code className="rounded bg-muted px-1.5 py-0.5">ollama/qwen2.5-coder:7b</code> in{' '}
        <code className="rounded bg-muted px-1.5 py-0.5">~/.openclaw/openclaw.json</code>, then restart the gateway.
        On low-power hardware (e.g. N100), we recommend <strong>cloud API keys</strong> (Gemini, OpenAI, Claude) instead of local inference — see the full guide.
      </p>
      <CodeBlock
        language="bash"
        code={`export OLLAMA_API_KEY="ollama-local"
# Restart gateway and verify
openclaw gateway restart
openclaw models list`}
      />
      <p className="mt-2 text-sm text-muted-foreground">
        For setting the default model and explicit config (if your model does not appear), see the{' '}
        <a href={OPENCLAW_DOC_URL} target="_blank" rel="noopener noreferrer" className="underline">
          full guide
        </a>
        {' '}and the{' '}
        <a href={OPENCLAW_OLLAMA_PROVIDER_URL} target="_blank" rel="noopener noreferrer" className="underline">
          OpenClaw Ollama provider docs
        </a>
        .
      </p>

      <h3 className="mt-8 text-xl font-semibold">Start automating</h3>
      <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-muted-foreground">
        <li>
          <strong>Connect a channel</strong> — Link Telegram, Discord, or Slack so
          you can chat with your assistant from your phone or desktop.
        </li>
        <li>
          <strong>Install skills</strong> — Add workflows from ClawHub (e.g.
          summarisation, reminders) so Daemon can execute them when you ask or
          when a job runs.
        </li>
        <li>
          <strong>Scheduled jobs</strong> — Set up daily briefings, reminder
          digests, or other recurring tasks in the OpenClaw dashboard or CLI.
        </li>
        <li>
          <strong>Run 24/7</strong> — Keep the OpenClaw Gateway running on your
          mini PC or a VPS so your personal employee is always on.
        </li>
      </ul>

      <h3 className="mt-8 text-xl font-semibold">Learn more</h3>
      <ul className="mt-3 space-y-1">
        <li>
          <a
            href={OPENCLAW_DOC_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm underline"
          >
            Full OpenClaw & automation guide (this repo)
          </a>
        </li>
        <li>
          <a
            href={OPENCLAW_SETUP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm underline"
          >
            OpenClaw Setup
          </a>
        </li>
        <li>
          <a
            href={OPENCLAW_GETTING_STARTED_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm underline"
          >
            OpenClaw Getting Started
          </a>
        </li>
        <li>
          <a
            href={OPENCLAW_CHANNELS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm underline"
          >
            OpenClaw Channels
          </a>
        </li>
        <li>
          <a
            href={OPENCLAW_OLLAMA_PROVIDER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm underline"
          >
            OpenClaw Ollama provider
          </a>
        </li>
      </ul>
    </section>
  )
}
