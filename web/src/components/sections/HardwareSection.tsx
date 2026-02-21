import { Card, CardContent } from '@/components/ui/card'
import { InfoBox } from '@/components/shared/InfoBox'

const m4Specs = [
  { requirement: 'CPU / GPU', value: 'Apple M4 (10-core CPU, 10-core GPU)', note: 'Metal acceleration for Ollama' },
  { requirement: 'RAM', value: '16 GB unified memory', note: '8B model fits comfortably' },
  { requirement: 'Storage', value: '256 GB SSD', note: 'Enough for OS and models' },
  { requirement: 'Recommended model', value: 'llama3.2:8b (default); deepseek-r1:8b, deepseek-r1:7b', note: 'ollama pull <model>; better reasoning with DeepSeek R1' },
]

const beelinkSpecs = [
  { requirement: 'CPU', value: '4 cores, up to 3.6 GHz (N100/N150)', note: 'For cloud API route; local inference optional' },
  { requirement: 'RAM', value: '16 GB DDR4', note: 'Gateway + cloud APIs' },
  { requirement: 'Disk', value: '500 GB SSD', note: 'OS and OpenClaw' },
  { requirement: 'Networking', value: 'Gigabit Ethernet + Wi-Fi 6', note: 'Ethernet recommended for always-on' },
  { requirement: 'TDP', value: '~15 W', note: 'Low power for 24/7' },
]

export function HardwareSection() {
  return (
    <section id="hardware">
      <h2 className="text-3xl font-bold tracking-tight">1. Hardware</h2>
      <p className="mt-2 text-muted-foreground">
        For <strong>local inference</strong> we recommend the <strong>M4 Mac Mini 16GB 256GB SSD</strong>.
        For a low-power always-on gateway using <strong>cloud API keys</strong> (Gemini, OpenAI, Claude),
        the <strong>Beelink S13 Pro</strong> is an option.
      </p>

      <h3 className="mt-6 text-xl font-semibold">M4 Mac Mini (local model route)</h3>
      <Card className="mt-4">
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Requirement</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">M4 Mac Mini</th>
                <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground sm:table-cell">Notes</th>
              </tr>
            </thead>
            <tbody>
              {m4Specs.map(({ requirement, value, note }) => (
                <tr key={requirement} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium">{requirement}</td>
                  <td className="px-4 py-3">{value}</td>
                  <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">{note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <h3 className="mt-6 text-xl font-semibold">Beelink S13 Pro (alternative)</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        On low-power Beelink (N100/N150), we recommend using <strong>cloud API keys</strong> (Gemini, OpenAI, Claude)
        instead of local inference. Configure keys in the desktop app Settings or via{' '}
        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">openclaw onboard</code>.
      </p>
      <Card className="mt-4">
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Requirement</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Mini S13</th>
                <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground sm:table-cell">Notes</th>
              </tr>
            </thead>
            <tbody>
              {beelinkSpecs.map(({ requirement, value, note }) => (
                <tr key={requirement} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium">{requirement}</td>
                  <td className="px-4 py-3">{value}</td>
                  <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">{note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <h3 className="mt-6 text-xl font-semibold">Why the M4 Mac Mini fits (local route)</h3>
      <ul className="mt-3 list-disc space-y-2 pl-6 text-muted-foreground">
        <li><strong>Right-sized for 8B.</strong> Llama 3.2 8B uses ~4–6 GB RAM; 16 GB leaves room for the OS.</li>
        <li><strong>Metal acceleration.</strong> Ollama uses Apple Metal for much faster inference.</li>
        <li><strong>Low power, always-on.</strong> Efficient for a 24/7 personal assistant.</li>
        <li><strong>Small footprint.</strong> Fits on a desk or shelf.</li>
      </ul>

      <InfoBox variant="note">
        Beelink comes preloaded with Windows. For Ubuntu, Desktop is recommended over Server.
        RAM is usually soldered; storage can often be upgraded. See the full hardware guide for details.
      </InfoBox>

      <h3 className="mt-6 text-xl font-semibold">Physical Setup</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        <strong>M4 Mac Mini:</strong>
      </p>
      <ol className="mt-3 list-decimal space-y-2 pl-6 text-sm text-muted-foreground">
        <li>Connect Ethernet or Wi-Fi, display, and keyboard.</li>
        <li>Complete macOS setup.</li>
        <li>
          Install Ollama and pull <code className="rounded bg-muted px-1.5 py-0.5 text-xs">llama3.2:8b</code> (or optionally <code className="rounded bg-muted px-1.5 py-0.5 text-xs">deepseek-r1:8b</code> / <code className="rounded bg-muted px-1.5 py-0.5 text-xs">deepseek-r1:7b</code> for better reasoning).
        </li>
      </ol>
      <p className="mt-4 text-sm text-muted-foreground">
        <strong>Beelink S13 Pro:</strong>
      </p>
      <ol className="mt-3 list-decimal space-y-2 pl-6 text-sm text-muted-foreground">
        <li>Unbox the Beelink S13 Pro.</li>
        <li>Connect Ethernet cable (recommended) or plan for Wi-Fi.</li>
        <li>Connect a monitor via HDMI and a wired keyboard.</li>
        <li>
          Power on and enter BIOS (press <code className="rounded bg-muted px-1.5 py-0.5 text-sm">Del</code> or{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 text-sm">F7</code>) to verify:
          boot mode is UEFI, Secure Boot is disabled (for Ubuntu).
        </li>
        <li>Save and exit BIOS.</li>
      </ol>
    </section>
  )
}
