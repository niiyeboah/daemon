import { useAtom } from 'jotai'
import { Checkbox } from '@/components/ui/checkbox'
import { progressAtom } from '@/store/atoms'

interface StepCheckboxProps {
  stepId: string
  label: string
}

export function StepCheckbox({ stepId, label }: StepCheckboxProps) {
  const [progress, setProgress] = useAtom(progressAtom)
  const checked = progress[stepId] ?? false

  return (
    <label className="my-3 flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3 transition-colors hover:bg-muted/50">
      <Checkbox
        checked={checked}
        onCheckedChange={(value) => {
          setProgress((prev) => ({ ...prev, [stepId]: value === true }))
        }}
      />
      <span className={checked ? 'text-muted-foreground line-through' : ''}>
        {label}
      </span>
    </label>
  )
}
