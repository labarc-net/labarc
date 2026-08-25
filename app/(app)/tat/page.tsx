import { TatChart } from '@/components/labarc/charts'
import { PageHeader } from '@/components/labarc/page-header'
import { MetricCard } from '@/components/labarc/metric-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge, StatusDot } from '@/components/ui/badge'
import { tatService } from '@/lib/labarc/services'

function fmt(mins: number) {
  if (mins >= 120) return `${(mins / 60).toFixed(1)}h`
  return `${mins}m`
}

export default function TatPage() {
  const metrics = tatService.list()
  const atRisk = metrics.filter((m) => m.predictedBreachMinutes != null)
  const avg = Math.round(metrics.reduce((s, m) => s + m.currentMinutes, 0) / metrics.length)

  return (
    <div className="space-y-6">
      <PageHeader
        title="TAT Intelligence"
        description="Turnaround time by department against target, with a predictive model that flags likely breaches before they happen and recommends the intervention."
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard label="Depts within target" value={`${metrics.length - atRisk.length}/${metrics.length}`} />
        <MetricCard label="Predicted breaches" value={atRisk.length} deltaGood={false} />
        <MetricCard label="Avg current TAT" value={avg} unit="min" />
        <MetricCard label="Total in queue" value={metrics.reduce((s, m) => s + m.queue, 0)} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {metrics.map((m) => {
          const breach = m.predictedBreachMinutes != null
          const ratio = m.currentMinutes / m.targetMinutes
          return (
            <Card key={m.department}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">{m.department}</CardTitle>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {m.queue} in queue · {m.capacityPct}% capacity
                    </p>
                  </div>
                  {breach ? (
                    <StatusBadge level="at-risk" label={`Breach in ${m.predictedBreachMinutes}m`} />
                  ) : (
                    <StatusBadge level="healthy" label="Within target" />
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="mb-3 flex items-end gap-6">
                  <div>
                    <div className="text-xs text-muted-foreground">Current</div>
                    <div
                      className={`font-mono text-2xl font-semibold tabular-nums ${
                        ratio > 0.95 ? 'text-warning-foreground dark:text-warning' : ''
                      }`}
                    >
                      {fmt(m.currentMinutes)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Target</div>
                    <div className="font-mono text-2xl font-semibold tabular-nums text-muted-foreground">
                      {fmt(m.targetMinutes)}
                    </div>
                  </div>
                </div>

                <TatChart data={m.history} target={m.targetMinutes} height={160} />

                <div className="mt-3 flex items-start gap-2.5 rounded-md border bg-muted/40 p-3 text-sm">
                  <StatusDot level={breach ? 'at-risk' : 'healthy'} className="mt-1.5" />
                  <p className="text-pretty text-muted-foreground">{m.recommendation}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
