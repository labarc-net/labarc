import {
  Activity,
  Boxes,
  ClipboardCheck,
  FlaskConical,
  ShieldAlert,
  Timer,
} from 'lucide-react'
import Link from 'next/link'
import { AiInsightCard } from '@/components/labarc/ai-insight-card'
import { DepartmentBars, Sparkline } from '@/components/labarc/charts'
import { EarlyWarningCenter } from '@/components/labarc/early-warning-center'
import { MetricCard } from '@/components/labarc/metric-card'
import { PageHeader, SectionTitle } from '@/components/labarc/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge, StatusDot } from '@/components/ui/badge'
import {
  alertService,
  dashboardService,
  equipmentService,
  incidentService,
} from '@/lib/labarc/services'
import { SEVERITY_LEVEL, type StatusLevel } from '@/lib/status'

const EQ_STATUS: Record<string, StatusLevel> = {
  operational: 'healthy',
  watch: 'watch',
  'at-risk': 'at-risk',
  critical: 'critical',
  offline: 'offline',
}

export default function DashboardPage() {
  const kpis = dashboardService.kpis()
  const warnings = dashboardService.earlyWarnings()
  const workload = dashboardService.departmentWorkload()
  const environmental = dashboardService.environmental()
  const equipment = equipmentService.list()
  const incidents = incidentService.list().filter((i) => i.status !== 'closed' && i.status !== 'resolved')
  const alerts = alertService.list().slice(0, 5)
  const topInsight = equipment.find((e) => e.id === 'eq-ch-02')!.aiInsight

  return (
    <div className="space-y-6">
      <PageHeader
        title="Command Center"
        description="A live, unified view of laboratory operations — what is happening now, what is likely to happen next, and where to act first."
        actions={
          <div className="flex items-center gap-2 rounded-md border bg-card px-3 py-1.5 text-xs text-muted-foreground">
            <StatusDot level="healthy" />
            Monday, Aug 25 · 09:14 · Day shift
          </div>
        }
      />

      {/* KPI row */}
      <section aria-label="Key metrics">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <MetricCard label="Samples Today" value={kpis.workload.value} delta={kpis.workload.delta} deltaGood={false} icon={Activity} hint="vs avg" />
          <MetricCard label="Pending" value={kpis.pending.value} delta={kpis.pending.delta} deltaGood={false} icon={ClipboardCheck} hint="in queue" />
          <MetricCard label="Avg TAT" value={kpis.avgTatMinutes.value} unit="min" delta={kpis.avgTatMinutes.delta} deltaGood icon={Timer} />
          <MetricCard label="Equip. Uptime" value={kpis.equipmentAvailability.value} unit="%" delta={kpis.equipmentAvailability.delta} deltaGood icon={FlaskConical} />
          <MetricCard label="Active Incidents" value={kpis.activeIncidents.value} delta={kpis.activeIncidents.delta} deltaGood={false} icon={ShieldAlert} />
          <MetricCard label="QC Pass Rate" value={kpis.qcPassRate.value} unit="%" delta={kpis.qcPassRate.delta} deltaGood icon={Boxes} />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Left: early warnings + workload */}
        <div className="space-y-6 xl:col-span-2">
          <EarlyWarningCenter warnings={warnings} />

          <Card>
            <CardHeader>
              <CardTitle>Department Workload vs Capacity</CardTitle>
            </CardHeader>
            <CardContent>
              <DepartmentBars data={workload} />
              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2.5 rounded-sm bg-chart-1" /> Workload
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2.5 rounded-sm bg-muted-foreground/40" /> Capacity
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2.5 rounded-sm bg-critical" /> Over 90%
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: top AI insight */}
        <div className="space-y-6">
          <div>
            <SectionTitle hint="Highest priority">Focus of the day</SectionTitle>
            <AiInsightCard insight={topInsight} />
          </div>
        </div>
      </div>

      {/* Equipment strip */}
      <section aria-label="Equipment status">
        <SectionTitle hint="Real-time">Equipment status</SectionTitle>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {equipment.map((e) => {
            const util = e.telemetry.find((t) => t.key === 'util')
            return (
              <Link key={e.id} href={`/equipment/${e.id}`}>
                <Card className="gap-0 p-4 transition-colors hover:border-primary/40 hover:bg-muted/30">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{e.name}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {e.department} · {e.model}
                      </div>
                    </div>
                    <StatusBadge level={EQ_STATUS[e.status]} icon />
                  </div>
                  <div className="mt-3 flex items-end justify-between gap-3">
                    <div>
                      <div className="font-mono text-lg font-semibold tabular-nums">
                        {e.healthScore}
                        <span className="ml-0.5 text-xs font-normal text-muted-foreground">/100</span>
                      </div>
                      <div className="text-xs text-muted-foreground">Health · {e.utilization}% util</div>
                    </div>
                    <div className="h-9 w-24">
                      {util && (
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
                      )}
                    </div>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      </section>

      {/* Bottom: environmental + incidents + alerts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Environmental Monitoring</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-2">
            {environmental.map((env) => (
              <div key={env.id} className="flex items-center gap-3">
                <StatusDot level={env.status} pulse={env.status === 'critical'} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm">{env.name}</div>
                  <div className="text-xs text-muted-foreground">Target {env.target}</div>
                </div>
                <div className="h-7 w-16">
                  <Sparkline
                    data={env.trend}
                    color={env.status === 'critical' ? 'var(--critical)' : 'var(--chart-2)'}
                  />
                </div>
                <div className="w-16 text-right font-mono text-sm tabular-nums">
                  {env.reading}
                  <span className="text-xs text-muted-foreground"> {env.unit}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Incidents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5 pt-2">
            {incidents.map((i) => (
              <Link
                key={i.id}
                href={`/incidents/${i.id}`}
                className="flex items-start gap-2.5 rounded-md p-1.5 hover:bg-muted/50"
              >
                <StatusDot level={SEVERITY_LEVEL[i.severity]} className="mt-1.5" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm">{i.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {i.ref} · {i.department}
                  </div>
                </div>
                <span className="shrink-0 font-mono text-[10px] uppercase text-muted-foreground">
                  {i.status}
                </span>
              </Link>
            ))}
            {incidents.length === 0 && (
              <p className="text-sm text-muted-foreground">No active incidents.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5 pt-2">
            {alerts.map((a) => (
              <div key={a.id} className="flex items-start gap-2.5">
                <StatusDot level={SEVERITY_LEVEL[a.severity]} className="mt-1.5" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm">{a.title}</div>
                  <div className="text-xs text-muted-foreground">{a.entity} · {a.at}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
