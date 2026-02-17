import { useAtom, useAtomValue } from 'jotai'
import { Monitor, Terminal, Apple } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { osAtom, activeSectionAtom, progressSummaryAtom } from '@/store/atoms'
import { SECTIONS } from '@/store/constants'
import type { OsChoice } from '@/types'
import { cn } from '@/lib/utils'

const osOptions: { value: OsChoice; label: string; icon: typeof Monitor }[] = [
  { value: 'windows', label: 'Windows', icon: Monitor },
  { value: 'ubuntu', label: 'Ubuntu', icon: Terminal },
  { value: 'macos', label: 'macOS', icon: Apple },
]

export function Sidebar() {
  const [selectedOs, setSelectedOs] = useAtom(osAtom)
  const activeSection = useAtomValue(activeSectionAtom)
  const { completed, total } = useAtomValue(progressSummaryAtom)
  const progressPercent = total > 0 ? (completed / total) * 100 : 0

  return (
    <nav className="flex h-full flex-col gap-4 p-4">
      <div>
        <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Platform
        </span>
        <div className="flex gap-1">
          {osOptions.map(({ value, label, icon: Icon }) => (
            <Button
              key={value}
              variant={selectedOs === value ? 'default' : 'outline'}
              size="sm"
              className="flex-1 gap-1.5 text-xs"
              onClick={() => setSelectedOs(value)}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </Button>
          ))}
        </div>
      </div>

      <Separator />

      <div className="flex-1">
        <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Sections
        </span>
        <ul className="space-y-0.5">
          {SECTIONS.map(({ id, title }) => (
            <li key={id}>
              <a
                href={`#${id}`}
                className={cn(
                  'block rounded-md px-3 py-1.5 text-sm transition-colors',
                  activeSection === id
                    ? 'bg-accent font-medium text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                )}
              >
                {title}
              </a>
            </li>
          ))}
        </ul>
      </div>

      <Separator />

      <div>
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Progress
          </span>
          <span className="text-xs text-muted-foreground">
            {completed}/{total}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </nav>
  )
}
