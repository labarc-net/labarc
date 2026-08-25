import { ArrowRight } from 'lucide-react'
import { PageHeader, SectionTitle } from '@/components/labarc/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge, StatusDot } from '@/components/ui/badge'
import { workflowService } from '@/lib/labarc/services'

export default function WorkflowPage() {
  const stages = workflowService.stages()
  const maxWait = Math.max(...stages.map((s) => s.avgWaitMinutes))
  const bottleneck = stages.reduce((a, b) => (b.avgWaitMinutes > a.avgWaitMinutes ? b : a))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Workflow"
        description="Sample flow from receipt to report. Each stage shows live volume and average wait so bottlenecks surface before they cascade into TAT breaches."
      />

      {/* Pipeline */}
      <section aria-label="Sample pipeline">
        <SectionTitle hint={`Bottleneck: ${bottleneck.label}`}>Live pipeline</SectionTitle>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch">
          {stages.map((s, i) => (
            <div key={s.key} className="flex flex-1 items-stretch gap-3">
              <Card className="flex-1 gap-0 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">{s.label}</span>
                  <StatusDot level={s.status} pulse={s.status === 'at-risk'} />
                </div>
                <div className="mt-2 font-mono text-2xl font-semibold tabular-nums">{s.count}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {s.avgWaitMinutes > 0 ? `${s.avgWaitMinutes} min avg wait` : 'no wait'}
                </div>
                {/* wait intensity bar */}
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${
                      s.status === 'at-risk' ? 'bg-critical' : s.status === 'watch' ? 'bg-warning' : 'bg-chart-2'
                    }`}
                    style={{ width: `${maxWait ? (s.avgWaitMinutes / maxWait) * 100 : 0}%` }}
                  />
                </div>
              </Card>
              {i < stages.length - 1 && (
                <div className="hidden items-center lg:flex">
                  <ArrowRight className="size-4 text-muted-foreground/50" aria-hidden />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Stage detail</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="pb-2 font-medium">Stage</th>
                    <th className="pb-2 text-right font-medium">In stage</th>
                    <th className="pb-2 text-right font-medium">Avg wait</th>
                    <th className="pb-2 text-right font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stages.map((s) => (
                    <tr key={s.key} className="border-b last:border-0">
                      <td className="py-2.5 font-medium">{s.label}</td>
                      <td className="py-2.5 text-right font-mono tabular-nums">{s.count}</td>
                      <td className="py-2.5 text-right font-mono tabular-nums text-muted-foreground">
                        {s.avgWaitMinutes} min
                      </td>
                      <td className="py-2.5 text-right">
                        <StatusBadge level={s.status} icon={false} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="border-warning/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <StatusDot level="at-risk" />
              Bottleneck advisory
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-2 text-sm">
            <p className="text-pretty">
              <span className="font-medium">{bottleneck.label}</span> is the current constraint with{' '}
              <span className="font-mono tabular-nums">{bottleneck.count}</span> samples and a{' '}
              <span className="font-mono tabular-nums">{bottleneck.avgWaitMinutes}-minute</span> average wait.
            </p>
            <p className="text-muted-foreground text-pretty">
              At the present arrival rate this stage will drive the Chemistry TAT target within the hour.
              Reallocating one validated analyst to the Analysis stage clears the queue fastest.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
