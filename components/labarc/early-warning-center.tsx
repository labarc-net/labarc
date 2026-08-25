import { ArrowRight, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { StatusBadge, StatusDot } from '@/components/ui/badge'
import { SEVERITY_LEVEL } from '@/lib/status'
import type { EarlyWarning } from '@/lib/labarc/types'
import { cn } from '@/lib/utils'

const CATEGORY_LABEL: Record<EarlyWarning['category'], string> = {
  equipment: 'Equipment',
  qc: 'Quality Control',
  inventory: 'Inventory',
  tat: 'Turnaround',
  incident: 'Incident',
  maintenance: 'Maintenance',
  environmental: 'Environmental',
  power: 'Power',
}

export function EarlyWarningCenter({ warnings }: { warnings: EarlyWarning[] }) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b bg-muted/40 px-5 py-3.5">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" aria-hidden />
          <h2 className="text-sm font-semibold tracking-tight">Early Warning Center</h2>
        </div>
        <span className="text-xs text-muted-foreground">
          {warnings.length} predictions · next 14 days
        </span>
      </div>
      <ul className="divide-y">
        {warnings.map((w) => {
          const level = SEVERITY_LEVEL[w.severity]
          const body = (
            <div className="flex items-start gap-3 px-5 py-3.5 transition-colors hover:bg-muted/40">
              <StatusDot
                level={level}
                pulse={w.severity === 'critical'}
                className="mt-1.5"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">{w.entity}</span>
                  <StatusBadge
                    level={level}
                    label={CATEGORY_LABEL[w.category]}
                    icon={false}
                    className="px-1.5 py-0"
                  />
                </div>
                <p className="mt-0.5 text-sm text-foreground/90">{w.message}</p>
                <p className="mt-0.5 text-xs text-muted-foreground text-pretty">
                  {w.detail}
                </p>
                <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="tabular-nums">
                    ETA <span className="font-medium text-foreground">{w.eta}</span>
                  </span>
                  <span aria-hidden>·</span>
                  <span className="tabular-nums">
                    Confidence{' '}
                    <span className="font-mono font-medium text-foreground">
                      {Math.round(w.confidence * 100)}%
                    </span>
                  </span>
                </div>
              </div>
              {w.href && (
                <ArrowRight
                  className="mt-1 size-4 shrink-0 text-muted-foreground"
                  aria-hidden
                />
              )}
            </div>
          )
          return (
            <li key={w.id}>
              {w.href ? (
                <Link href={w.href} className={cn('block')}>
                  {body}
                </Link>
              ) : (
                body
              )}
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
