import type { ReactNode } from 'react'
import { Info, AlertTriangle, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'

interface InfoBoxProps {
  variant: 'note' | 'warning' | 'tip'
  children: ReactNode
}

const config = {
  note: {
    icon: Info,
    label: 'Note',
    className: 'border-blue-500/30 bg-blue-50/50 dark:bg-blue-950/20',
    iconClassName: 'text-blue-500',
  },
  warning: {
    icon: AlertTriangle,
    label: 'Warning',
    className: 'border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20',
    iconClassName: 'text-amber-500',
  },
  tip: {
    icon: Lightbulb,
    label: 'Tip',
    className: 'border-green-500/30 bg-green-50/50 dark:bg-green-950/20',
    iconClassName: 'text-green-500',
  },
}

export function InfoBox({ variant, children }: InfoBoxProps) {
  const { icon: Icon, label, className, iconClassName } = config[variant]

  return (
    <div className={cn('my-4 rounded-lg border-l-4 p-4', className)}>
      <div className="mb-1 flex items-center gap-2">
        <Icon className={cn('h-4 w-4', iconClassName)} />
        <span className="text-sm font-semibold">{label}</span>
      </div>
      <div className="text-sm text-muted-foreground">{children}</div>
    </div>
  )
}
