import { Lightbulb, Sparkles } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { StatusDot } from '@/components/ui/badge'
import type { AiInsight } from '@/lib/labarc/types'

export function AiInsightCard({ insight }: { insight: AiInsight }) {
  return (
    <Card className="gap-0 overflow-hidden border-primary/25">
      <div className="flex items-center justify-between border-b border-primary/15 bg-primary/5 px-5 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" aria-hidden />
          <span className="text-sm font-semibold">AI Insight</span>
        </div>
        <span className="font-mono text-xs text-muted-foreground">
          {Math.round(insight.confidence * 100)}% confidence
        </span>
      </div>

      <div className="space-y-4 p-5">
        <p className="text-sm leading-relaxed text-pretty">{insight.summary}</p>

        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Contributing signals
          </div>
          <ul className="space-y-1.5">
            {insight.signals.map((s) => (
              <li key={s.label} className="flex items-center gap-2.5 text-sm">
                <StatusDot level={s.level} />
                <span className="flex-1 text-foreground/90">{s.label}</span>
                <span className="font-mono text-xs tabular-nums text-muted-foreground">
                  {s.delta}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-start gap-2.5 rounded-md border bg-muted/50 p-3">
          <Lightbulb className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Recommended action
            </div>
            <p className="mt-0.5 text-sm text-pretty">{insight.recommendation}</p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Basis: <span className="text-foreground/70">{insight.source}</span>
        </p>
      </div>
    </Card>
  )
}
