import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'

export function MetricCard({
  label,
  value,
  unit,
  delta,
  deltaGood,
  icon: Icon,
  hint,
}: {
  label: string
  value: string | number
  unit?: string
  /** signed change; sign drives arrow direction */
  delta?: number
  /** whether an increase is "good" (green). default true */
  deltaGood?: boolean
  icon?: LucideIcon
  hint?: string
}) {
  const up = (delta ?? 0) > 0
  const flat = (delta ?? 0) === 0
  const positive = deltaGood ?? true ? up : !up
  const DeltaIcon = flat ? Minus : up ? ArrowUpRight : ArrowDownRight

  return (
    <Card className="gap-0 p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        {Icon && <Icon className="size-4 text-muted-foreground" aria-hidden />}
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="font-mono text-2xl font-semibold tabular-nums tracking-tight">
          {value}
        </span>
        {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
      </div>
      <div className="mt-1.5 flex items-center gap-1.5">
        {delta != null && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 text-xs font-medium tabular-nums',
              flat
                ? 'text-muted-foreground'
                : positive
                  ? 'text-success'
                  : 'text-critical',
            )}
          >
            <DeltaIcon className="size-3" aria-hidden />
            {Math.abs(delta)}
            {typeof value === 'number' || String(value).includes('%') ? '' : ''}
          </span>
        )}
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
    </Card>
  )
}
