import { Card, CardContent } from '@/components/ui/card'

const stack = [
  { layer: 'Hardware', component: 'Beelink S13 Pro mini PC' },
  { layer: 'Operating System', component: 'Windows (preloaded) or Ubuntu Desktop 24.04 LTS' },
  { layer: 'Inference Runtime', component: 'Ollama' },
  { layer: 'Language Model', component: 'Llama 3.2 3B' },
  { layer: 'Interface', component: 'Daemon bot (CLI / API)' },
]

export function HeroSection() {
  return (
    <section id="hero">
      <h1 className="text-4xl font-bold tracking-tight">
        Daemon Setup Guide
      </h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Daemon is a local, privacy-first personal assistant bot that runs
        entirely on your own hardware. No cloud APIs, no subscriptions, no
        data leaving your network.
      </p>
      <p className="mt-2 text-muted-foreground">
        This guide walks you through every step — from unboxing the hardware to
        chatting with your personal assistant. Select your platform in the
        sidebar and follow along.
      </p>

      <h2 className="mt-8 text-2xl font-semibold">The Stack</h2>
      <Card className="mt-4">
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Layer
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Component
                </th>
              </tr>
            </thead>
            <tbody>
              {stack.map(({ layer, component }) => (
                <tr key={layer} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium">{layer}</td>
                  <td className="px-4 py-3 text-muted-foreground">{component}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <h2 className="mt-8 text-2xl font-semibold">What You Get</h2>
      <ul className="mt-3 list-disc space-y-2 pl-6 text-muted-foreground">
        <li>A Windows or Ubuntu machine running 24/7 on low-power hardware.</li>
        <li>Llama 3.2 3B served locally by Ollama on port 11434.</li>
        <li>
          A personal assistant named <strong>Daemon</strong> reachable from the
          terminal or via HTTP API from any device on your LAN.
        </li>
      </ul>
    </section>
  )
}
