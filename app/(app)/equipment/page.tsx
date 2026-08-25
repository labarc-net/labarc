import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { HealthRing } from '@/components/labarc/health-ring'
import { Sparkline } from '@/components/labarc/charts'
import { PageHeader } from '@/components/labarc/page-header'
import { Card } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/badge'
import { equipmentService } from '@/lib/labarc/services'
import { SEVERITY_LEVEL, type StatusLevel } from '@/lib/status'

const EQ_STATUS: Record<string, StatusLevel> = {
  operational: 'healthy',
  watch: 'watch',
  'at-risk': 'at-risk',
  critical: 'critical',
  offline: 'offline',
}

export default function EquipmentPage() {
  const equipment = equipmentService
    .list()
    .slice()
    .sort((a, b) => a.healthScore - b.healthScore)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Equipment"
        description="Every analyzer, instrument, and cold-storage unit with a live health score, utilization, and predictive failure risk."
        actions={
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-critical" /> {equipment.filter((e) => e.status === 'critical').length} critical
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-warning" /> {equipment.filter((e) => e.status === 'watch' || e.status === 'at-risk').length} watch
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-success" /> {equipment.filter((e) => e.status === 'operational').length} operational
            </span>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {equipment.map((e) => {
          const util = e.telemetry.find((t) => t.key === 'util') ?? e.telemetry[0]
          return (
            <Link key={e.id} href={`/equipment/${e.id}`} className="group">
              <Card className="h-full gap-0 p-5 transition-colors hover:border-primary/40 hover:bg-muted/20">
                <div className="flex items-start gap-4">
                  <HealthRing score={e.healthScore} size={72} strokeWidth={7} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate font-medium">{e.name}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          {e.manufacturer} · {e.model}
                        </div>
                      </div>
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <StatusBadge level={EQ_STATUS[e.status]} icon />
                      <StatusBadge level={SEVERITY_LEVEL[e.failureRisk]} label={`${e.failureRisk} risk`} icon={false} />
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 items-end gap-3 border-t pt-4">
                  <div>
                    <div className="text-xs text-muted-foreground">Utilization</div>
                    <div className="font-mono text-sm font-semibold tabular-nums">{e.utilization}%</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Downtime/mo</div>
                    <div className="font-mono text-sm font-semibold tabular-nums">{e.downtimeHoursMonth}h</div>
                  </div>
                  <div className="h-8">
                    <Sparkline
                      data={util.points.map((p) => p.value)}
                      color={
                        e.status === 'critical'
                          ? 'var(--critical)'
                          : e.status === 'operational'
                            ? 'var(--chart-2)'
                            : 'var(--warning)'
                      }
                    />
                  </div>
                </div>

                <div className="mt-3 text-xs text-muted-foreground">
                  {e.location} · Next service {e.nextMaintenance}
                </div>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
