import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, CalendarClock, ShieldAlert } from 'lucide-react'
import { AiInsightCard } from '@/components/labarc/ai-insight-card'
import { TelemetryChart } from '@/components/labarc/charts'
import { HealthRing } from '@/components/labarc/health-ring'
import { PageHeader, SectionTitle } from '@/components/labarc/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge, StatusBadge, StatusDot } from '@/components/ui/badge'
import {
  equipmentService,
  incidentService,
  maintenanceService,
} from '@/lib/labarc/services'
import { SEVERITY_LEVEL, type StatusLevel } from '@/lib/status'

const EQ_STATUS: Record<string, StatusLevel> = {
  operational: 'healthy',
  watch: 'watch',
  'at-risk': 'at-risk',
  critical: 'critical',
  offline: 'offline',
}

const TELE_COLOR: Record<string, string> = {
  healthy: 'var(--chart-2)',
  watch: 'var(--warning)',
  'at-risk': 'var(--warning)',
  critical: 'var(--critical)',
  offline: 'var(--muted-foreground)',
  info: 'var(--info)',
  neutral: 'var(--chart-1)',
}

const MX_STATUS: Record<string, StatusLevel> = {
  scheduled: 'info',
  overdue: 'critical',
  completed: 'healthy',
  'in-progress': 'watch',
}

export function generateStaticParams() {
  return equipmentService.list().map((e) => ({ id: e.id }))
}

export default async function EquipmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const e = equipmentService.getById(id)
  if (!e) notFound()

  const maintenance = maintenanceService.forEquipment(e.id)
  const incidents = incidentService.forEquipment(e.id)

  return (
    <div className="space-y-6">
      <Link
        href="/equipment"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        All equipment
      </Link>

      <PageHeader
        title={e.name}
        description={`${e.manufacturer} ${e.model} · Serial ${e.serialNumber} · ${e.location}`}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge level={EQ_STATUS[e.status]} icon />
            <StatusBadge level={SEVERITY_LEVEL[e.failureRisk]} label={`${e.failureRisk} failure risk`} icon={false} />
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column: telemetry + specs */}
        <div className="space-y-6 lg:col-span-2">
          {/* Health + quick stats */}
          <Card>
            <CardContent className="flex flex-wrap items-center gap-6">
              <HealthRing score={e.healthScore} size={104} strokeWidth={9} />
              <div className="grid flex-1 grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-4">
                <Stat label="Utilization" value={`${e.utilization}%`} />
                <Stat label="Downtime / mo" value={`${e.downtimeHoursMonth}h`} />
                <Stat label="Last service" value={e.lastMaintenance} />
                <Stat label="Next service" value={e.nextMaintenance} />
              </div>
            </CardContent>
          </Card>

          {/* Telemetry grid */}
          <div>
            <SectionTitle hint="Last 24 hours">Live telemetry</SectionTitle>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {e.telemetry.map((t) => {
                const last = t.points[t.points.length - 1]?.value
                return (
                  <Card key={t.key} className="gap-0 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-sm font-medium">{t.label}</div>
                        <div className="font-mono text-lg font-semibold tabular-nums">
                          {last}
                          <span className="ml-1 text-xs font-normal text-muted-foreground">
                            {t.unit}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <StatusDot level={t.status} pulse={t.status === 'critical'} />
                        <span
                          className={`font-mono text-xs tabular-nums ${
                            t.drift > 6 ? 'text-critical' : t.drift > 2 ? 'text-warning-foreground dark:text-warning' : 'text-muted-foreground'
                          }`}
                        >
                          {t.drift > 0 ? '+' : ''}
                          {t.drift}%
                        </span>
                      </div>
                    </div>
                    <div className="mt-2">
                      <TelemetryChart
                        data={t.points}
                        unit={t.unit}
                        height={110}
                        color={TELE_COLOR[t.status]}
                      />
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Specs + error codes */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Asset details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5 pt-2 text-sm">
                <SpecRow label="Department" value={e.department} />
                <SpecRow label="Installed" value={e.installedOn} />
                <SpecRow label="Warranty until" value={e.warrantyUntil} />
                <SpecRow label="Service provider" value={e.serviceProvider} />
                <SpecRow label="Serial number" value={e.serialNumber} mono />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent error codes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-2">
                {e.errorCodes.length === 0 && (
                  <p className="text-sm text-muted-foreground">No recent errors logged.</p>
                )}
                {e.errorCodes.map((c) => (
                  <div key={c.code} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Badge className="border-critical/30 bg-critical-muted font-mono text-critical">
                        {c.code}
                      </Badge>
                      <span className="text-muted-foreground">{c.count}× occurrences</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{c.lastSeen}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right column: AI insight + maintenance + incidents */}
        <div className="space-y-6">
          <AiInsightCard insight={e.aiInsight} />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarClock className="size-4 text-muted-foreground" aria-hidden />
                Maintenance history
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-2">
              {maintenance.length === 0 && (
                <p className="text-sm text-muted-foreground">No records.</p>
              )}
              {maintenance.map((m) => (
                <div key={m.id} className="flex items-start gap-3 border-b pb-3 last:border-0 last:pb-0">
                  <StatusDot level={MX_STATUS[m.status]} className="mt-1.5" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">{m.type}</span>
                      <span className="text-xs text-muted-foreground">{m.scheduledFor}</span>
                    </div>
                    <p className="text-xs text-muted-foreground text-pretty">{m.notes}</p>
                    <span className="text-xs text-muted-foreground">{m.technician}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert className="size-4 text-muted-foreground" aria-hidden />
                Linked incidents
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 pt-2">
              {incidents.length === 0 && (
                <p className="text-sm text-muted-foreground">No linked incidents.</p>
              )}
              {incidents.map((i) => (
                <Link
                  key={i.id}
                  href={`/incidents/${i.id}`}
                  className="flex items-start gap-2.5 rounded-md p-1.5 hover:bg-muted/50"
                >
                  <StatusDot level={SEVERITY_LEVEL[i.severity]} className="mt-1.5" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm">{i.title}</div>
                    <div className="text-xs text-muted-foreground">{i.ref} · {i.status}</div>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-mono text-sm font-semibold tabular-nums">{value}</div>
    </div>
  )
}

function SpecRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className={mono ? 'font-mono text-xs tabular-nums' : 'font-medium'}>{value}</span>
    </div>
  )
}
