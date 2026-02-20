import { CodeBlock } from '@/components/shared/CodeBlock'

interface TroubleshootItem {
  title: string
  symptoms: string
  content: React.ReactNode
}

const items: TroubleshootItem[] = [
  {
    title: 'Ollama Will Not Start',
    symptoms: 'systemctl status ollama shows failed or inactive.',
    content: (
      <>
        <p className="mb-2 text-sm text-muted-foreground">Check the logs and restart:</p>
        <CodeBlock language="bash" code={`journalctl -u ollama --no-pager -n 50\nsudo ss -tlnp | grep 11434\nsudo systemctl restart ollama`} />
        <p className="text-sm text-muted-foreground">If the binary is corrupt, re-run the installer:</p>
        <CodeBlock language="bash" code="curl -fsSL https://ollama.com/install.sh | sh" />
      </>
    ),
  },
  {
    title: 'Model Fails to Load',
    symptoms: 'ollama run exits immediately or shows out-of-memory error.',
    content: (
      <>
        <CodeBlock language="bash" code={`free -h    # check available RAM\ndf -h /    # check disk space`} />
        <p className="text-sm text-muted-foreground">Re-pull if corrupted:</p>
        <CodeBlock language="bash" code={`ollama rm llama3.2:1b\nollama pull llama3.2:1b`} />
      </>
    ),
  },
  {
    title: 'Slow Responses',
    symptoms: 'Daemon takes many seconds to respond.',
    content: (
      <>
        <p className="mb-2 text-sm text-muted-foreground">
          On the N100/N150, expect ~10-30 tokens/sec. A 200-token reply may take 7-20 seconds.
        </p>
        <ul className="list-disc space-y-1 pl-6 text-sm text-muted-foreground">
          <li>Reduce context length: set <code className="rounded bg-muted px-1 py-0.5">num_ctx</code> to 1024 or 512 in the Modelfile.</li>
          <li>Use a smaller quantisation (e.g. q4_0 or q3_K_S).</li>
          <li>Close other processes consuming CPU/RAM.</li>
          <li>Keep the model loaded: set <code className="rounded bg-muted px-1 py-0.5">OLLAMA_KEEP_ALIVE=-1</code> in the service env.</li>
        </ul>
      </>
    ),
  },
  {
    title: 'Cannot Reach Ollama from Another Device',
    symptoms: 'curl to the server IP:11434 times out or is refused.',
    content: (
      <>
        <ul className="list-decimal space-y-2 pl-6 text-sm text-muted-foreground">
          <li>Check Ollama is bound to 0.0.0.0 (not localhost).</li>
          <li>Check the firewall allows port 11434 from your LAN.</li>
          <li>Verify with:</li>
        </ul>
        <CodeBlock language="bash" code="sudo ss -tlnp | grep 11434" />
        <p className="text-sm text-muted-foreground">
          Should show <code className="rounded bg-muted px-1 py-0.5">0.0.0.0:11434</code>,
          not <code className="rounded bg-muted px-1 py-0.5">127.0.0.1:11434</code>.
        </p>
      </>
    ),
  },
  {
    title: '"Daemon" Model Not Found',
    symptoms: 'ollama run daemon returns model not found error.',
    content: (
      <>
        <p className="mb-2 text-sm text-muted-foreground">The model is created from a Modelfile. Verify and recreate:</p>
        <CodeBlock language="bash" code={`ollama list | grep daemon\nollama create daemon -f ~/Modelfile`} />
      </>
    ),
  },
  {
    title: 'High Memory Usage / Swapping',
    symptoms: 'System feels sluggish, swap is heavily used.',
    content: (
      <>
        <CodeBlock language="bash" code="ps aux --sort=-%mem | head -10" />
        <p className="text-sm text-muted-foreground">
          Reduce <code className="rounded bg-muted px-1 py-0.5">num_ctx</code> in the Modelfile to 1024 and
          recreate the model. Add more swap if needed.
        </p>
      </>
    ),
  },
  {
    title: 'Updating Ollama',
    symptoms: 'Need to update to the latest version.',
    content: (
      <>
        <CodeBlock language="bash" code={`curl -fsSL https://ollama.com/install.sh | sh\nsudo systemctl restart ollama`} />
        <p className="text-sm text-muted-foreground">
          Overwrites the binary in place, preserving models and config.
        </p>
      </>
    ),
  },
]

export function TroubleshootingSection() {
  return (
    <section id="troubleshooting">
      <h2 className="text-3xl font-bold tracking-tight">7. Troubleshooting</h2>
      <p className="mt-2 text-muted-foreground">Common issues and how to resolve them.</p>

      <div className="mt-6 space-y-4">
        {items.map(({ title, symptoms, content }) => (
          <details key={title} className="group rounded-lg border border-border">
            <summary className="flex cursor-pointer items-center justify-between px-4 py-3 font-medium hover:bg-accent/50">
              <span>{title}</span>
              <span className="ml-2 text-muted-foreground transition-transform group-open:rotate-180">
                ▾
              </span>
            </summary>
            <div className="border-t border-border px-4 py-3">
              <p className="mb-2 text-sm italic text-muted-foreground">{symptoms}</p>
              {content}
            </div>
          </details>
        ))}
      </div>
    </section>
  )
}
