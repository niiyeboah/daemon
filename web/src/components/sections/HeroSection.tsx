import { useAtomValue } from 'jotai'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, Apple, Monitor, Terminal } from 'lucide-react'
import { DESKTOP_DOWNLOAD_URLS } from '@/store/constants'
import { osAtom } from '@/store/atoms'

const stack = [
  { layer: 'Hardware', component: 'M4 Mac Mini (local) or Beelink S13 Pro (cloud API option)' },
  { layer: 'Operating System', component: 'macOS, Windows (Beelink preloaded), or Ubuntu Desktop 24.04 LTS' },
  { layer: 'Inference Runtime', component: 'Ollama' },
  { layer: 'Language Model', component: 'Qwen2.5-Coder-7B' },
]

export function HeroSection() {
  const selectedOs = useAtomValue(osAtom)

  return (
    <section id="hero">
      <img
        src={`${import.meta.env.BASE_URL}daemon-logo.png`}
        alt="Daemon"
        className="mb-6 h-48 w-48 rounded-full object-contain"
      />
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

      <h2 className="mt-8 text-2xl font-semibold">Download Daemon Desktop</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Install the desktop app on your machine to chat with Daemon from a native window.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        {selectedOs === 'macos' && (
          <Button asChild size="default" className="gap-2">
            <a
              href={DESKTOP_DOWNLOAD_URLS.macosAarch64}
              target="_blank"
              rel="noopener noreferrer"
              download
            >
              <Apple className="h-4 w-4" />
              macOS (Apple Silicon)
            </a>
          </Button>
        )}
        {selectedOs === 'windows' && (
          <Button asChild size="default" className="gap-2">
            <a
              href={DESKTOP_DOWNLOAD_URLS.windowsX64}
              target="_blank"
              rel="noopener noreferrer"
              download
            >
              <Monitor className="h-4 w-4" />
              Windows
            </a>
          </Button>
        )}
        {selectedOs === 'ubuntu' && (
          <>
            <Button asChild size="default" className="gap-2">
              <a
                href={DESKTOP_DOWNLOAD_URLS.linuxDeb}
                target="_blank"
                rel="noopener noreferrer"
                download
              >
                <Terminal className="h-4 w-4" />
                Debian / Ubuntu (.deb)
              </a>
            </Button>
            <Button asChild size="default" className="gap-2">
              <a
                href={DESKTOP_DOWNLOAD_URLS.linuxAppImage}
                target="_blank"
                rel="noopener noreferrer"
                download
              >
                <Download className="h-4 w-4" />
                AppImage
              </a>
            </Button>
            <Button asChild size="default" className="gap-2">
              <a
                href={DESKTOP_DOWNLOAD_URLS.linuxRpm}
                target="_blank"
                rel="noopener noreferrer"
                download
              >
                <Download className="h-4 w-4" />
                RPM
              </a>
            </Button>
          </>
        )}
      </div>

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
        <li>Qwen2.5-Coder-7B served locally by Ollama on port 11434.</li>
        <li>
          A personal assistant named <strong>Daemon</strong> reachable from the
          terminal or via HTTP API from any device on your LAN.
        </li>
      </ul>
    </section>
  )
}
