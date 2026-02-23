
interface TroubleshootItem {
  title: string
  symptoms: string
  content: React.ReactNode
}

const items: TroubleshootItem[] = [
  {
    title: 'Invalid or Missing API Key',
    symptoms: 'Daemon cannot reach the cloud models or shows unauthorized errors.',
    content: (
      <>
        <p className="mb-2 text-sm text-muted-foreground">Check your OpenRouter API key configuration:</p>
        <ul className="list-disc space-y-1 pl-6 text-sm text-muted-foreground">
          <li>Ensure you copied the key correctly from the OpenRouter dashboard.</li>
          <li>In the Daemon Desktop app, go to Settings (⚙️) and verify your key is entered.</li>
          <li>If using the CLI script, ensure <code className="rounded bg-muted px-1.5 py-0.5">OPENROUTER_API_KEY</code> is exported.</li>
        </ul>
      </>
    ),
  },
  {
    title: 'Slow Responses or Timeouts',
    symptoms: 'Daemon takes many seconds to respond or the request times out.',
    content: (
      <>
        <p className="mb-2 text-sm text-muted-foreground">
          Cloud models depend on internet connectivity and provider load. Simple Tasks (Gemini 2.5 Flash) should be almost instant.
        </p>
        <ul className="list-disc space-y-1 pl-6 text-sm text-muted-foreground">
          <li>Check your internet connection stability.</li>
          <li>Switch to a faster model (e.g. Gemini 2.5 Flash) if using a slow reasoning model like Claude 3.5 Sonnet.</li>
          <li>Check the <a href="https://openrouter.ai/activity" className="underline" target="_blank" rel="noopener noreferrer">OpenRouter Activity page</a> for provider incidents.</li>
        </ul>
      </>
    ),
  },
  {
    title: 'Insufficient Balance',
    symptoms: 'API calls fail with billing or credit errors.',
    content: (
      <>
        <p className="mb-2 text-sm text-muted-foreground">OpenRouter is a paid API depending on the model.</p>
        <ul className="list-disc space-y-1 pl-6 text-sm text-muted-foreground">
          <li>Check your credit balance at <a href="https://openrouter.ai/settings/credits" className="underline" target="_blank" rel="noopener noreferrer">openrouter.ai/settings/credits</a>.</li>
          <li>Add credits if necessary. Free tier models are available but have strict rate limits.</li>
        </ul>
      </>
    ),
  },
]

export function TroubleshootingSection() {
  return (
    <section id="troubleshooting">
      <h2 className="text-3xl font-bold tracking-tight">6. Troubleshooting</h2>
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
