import { Card, CardContent } from '@/components/ui/card'
import { StepCheckbox } from '@/components/shared/StepCheckbox'
import { InfoBox } from '@/components/shared/InfoBox'

const specs = [
  { requirement: 'CPU', value: '4 cores, up to 3.6 GHz', note: 'Ollama runs on CPU; 4 cores is enough for 1B' },
  { requirement: 'RAM', value: '16 GB DDR4', note: 'Model uses ~1-2 GB; 16 GB leaves room for OS and services' },
  { requirement: 'Disk', value: '500 GB SSD', note: 'Model is ~1 GB on disk; plenty of room' },
  { requirement: 'Networking', value: 'Gigabit Ethernet + Wi-Fi 6', note: 'Ethernet recommended for always-on use' },
  { requirement: 'TDP', value: '~15 W', note: 'Low electricity cost for 24/7 operation' },
  { requirement: 'Noise', value: 'Fanless or near-silent', note: 'Can sit on a desk without distraction' },
]

export function HardwareSection() {
  return (
    <section id="hardware">
      <h2 className="text-3xl font-bold tracking-tight">1. Hardware</h2>
      <p className="mt-2 text-muted-foreground">
        This guide targets the <strong>Beelink S13 Pro</strong> mini PC
        (Intel N100/N150, 16 GB RAM). If you have similar hardware, everything
        still applies.
      </p>

      <h3 className="mt-6 text-xl font-semibold">Key Specs for Llama 3.2 1B</h3>
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
              {specs.map(({ requirement, value, note }) => (
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

      <h3 className="mt-6 text-xl font-semibold">Why This Device Fits</h3>
      <ul className="mt-3 list-disc space-y-2 pl-6 text-muted-foreground">
        <li><strong>Right-sized for 1B parameters.</strong> The Q4 model uses ~1-2 GB RAM, leaving plenty for the OS.</li>
        <li><strong>Low power, always-on.</strong> ~15 W means very low running cost for a 24/7 assistant.</li>
        <li><strong>Silent operation.</strong> Fanless N100/N150 variants make no noise.</li>
        <li><strong>Small footprint.</strong> Roughly the size of a paperback book.</li>
        <li><strong>Affordable.</strong> Typically $150-$250 USD.</li>
      </ul>

      <InfoBox variant="note">
        No discrete GPU — all inference runs on CPU. Expect ~10-30 tokens/sec
        for the 1B model. RAM is usually soldered at 16 GB (not upgradeable),
        but storage can be swapped.
      </InfoBox>

      <h3 className="mt-6 text-xl font-semibold">Physical Setup</h3>
      <ol className="mt-3 list-decimal space-y-2 pl-6 text-muted-foreground">
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

      <StepCheckbox stepId="hardware-ready" label="Hardware set up and powered on" />
    </section>
  )
}
