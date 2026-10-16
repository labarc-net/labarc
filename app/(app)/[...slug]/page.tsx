import { notFound } from 'next/navigation'
import { Activity, ArrowUpRight, CircleAlert, Clock3, Database, MoreHorizontal } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { allNavItems } from '@/lib/labarc/nav'
import { alertService, dashboardService, deviceService, equipmentService, incidentService, integrationService, knowledgeService, maintenanceService, qcService, tatService, workforceService, workflowService } from '@/lib/labarc/services'

const pageData: Record<string, { eyebrow: string; title: string; description: string; metric: string; metricLabel: string; trend: string }> = {
  workforce: { eyebrow: 'Operations', title: 'Workforce', description: 'Monitor staffing, coverage, and workload across the laboratory.', metric: '94%', metricLabel: 'Coverage today', trend: '+6.4%' },
  workflow: { eyebrow: 'Operations', title: 'Workflow', description: 'Track specimen flow and identify stages that need attention.', metric: '1,284', metricLabel: 'Active specimens', trend: '+12.8%' },
  tat: { eyebrow: 'Operations', title: 'TAT Intelligence', description: 'Understand turnaround performance and emerging delays.', metric: '87.6%', metricLabel: 'Within target', trend: '+3.2%' },
  handover: { eyebrow: 'Operations', title: 'Handover', description: 'Keep shift transitions clear, accountable, and up to date.', metric: '8', metricLabel: 'Open handovers', trend: '-2 today' },
  equipment: { eyebrow: 'Laboratory', title: 'Equipment', description: 'View instrument availability, utilization, and operating status.', metric: '98.2%', metricLabel: 'Uptime', trend: '+1.1%' },
  maintenance: { eyebrow: 'Laboratory', title: 'Maintenance', description: 'Plan preventive maintenance and follow up on service work.', metric: '12', metricLabel: 'Due this week', trend: '3 urgent' },
  'quality-control': { eyebrow: 'Laboratory', title: 'Quality Control', description: 'Review QC performance and exceptions across active panels.', metric: '99.1%', metricLabel: 'Pass rate', trend: '+0.8%' },
  incidents: { eyebrow: 'Laboratory', title: 'Incidents', description: 'Capture, triage, and resolve laboratory incidents.', metric: '4', metricLabel: 'Needs review', trend: '1 critical' },
  analytics: { eyebrow: 'Intelligence', title: 'Analytics', description: 'Explore operational trends across your laboratory network.', metric: '18.4k', metricLabel: 'Tests this month', trend: '+14.2%' },
  'ai-assistant': { eyebrow: 'Intelligence', title: 'AI Assistant', description: 'Ask questions about operations and surface the next best action.', metric: '24', metricLabel: 'Insights available', trend: 'Updated now' },
  'digital-twin': { eyebrow: 'Intelligence', title: 'Digital Twin', description: 'See a live operational model of your laboratory environment.', metric: '7/8', metricLabel: 'Systems online', trend: '1 degraded' },
  integrations: { eyebrow: 'Connectivity', title: 'Integrations', description: 'Manage connected systems and data exchange health.', metric: '6', metricLabel: 'Connected systems', trend: 'All healthy' },
  devices: { eyebrow: 'Connectivity', title: 'Devices / Sensors', description: 'Monitor connected devices and environmental telemetry.', metric: '42', metricLabel: 'Devices reporting', trend: '+4 this month' },
  documents: { eyebrow: 'Knowledge', title: 'Documents', description: 'Find procedures, policies, and laboratory knowledge in one place.', metric: '186', metricLabel: 'Published documents', trend: '12 updated' },
  alerts: { eyebrow: 'System', title: 'Alerts', description: 'Review active alerts and keep critical work visible.', metric: '7', metricLabel: 'Active alerts', trend: '2 high priority' },
  settings: { eyebrow: 'System', title: 'Settings', description: 'Configure your LabArc workspace and operational preferences.', metric: '100%', metricLabel: 'Workspace health', trend: 'Up to date' },
  workspace: { eyebrow: 'Team workspace', title: 'Team workspace', description: 'Coordinate your laboratory team through shared channels, handovers, and operational updates.', metric: '24', metricLabel: 'Active members', trend: '+3 this week' },
}

const dataFor = (slug: string) => ({
  workforce: workforceService.list(), workflow: workflowService.stages(), equipment: equipmentService.list(), maintenance: maintenanceService.list(), incidents: incidentService.list(), 'quality-control': qcService.list(), tat: tatService.list(), devices: deviceService.list(), integrations: integrationService.list(), documents: knowledgeService.list(), alerts: alertService.list(),
}[slug] ?? dashboardService.earlyWarnings()) as unknown as Array<Record<string, unknown>>

const channelData: Record<string, { title: string; description: string; metric: string; metricLabel: string; trend: string }> = {
  general: { title: 'General', description: 'Company-wide updates, announcements, and shared context for the lab team.', metric: '18', metricLabel: 'Unread messages', trend: '3 new today' },
  operations: { title: 'Operations', description: 'Coordinate workflow, staffing, and daily operational decisions.', metric: '6', metricLabel: 'Open threads', trend: '2 need review' },
  quality: { title: 'Quality', description: 'Discuss QC exceptions, audits, and quality actions with the team.', metric: '2', metricLabel: 'Open actions', trend: '1 due today' },
  handover: { title: 'Handover', description: 'Keep shift transitions clear with shared notes and accountable follow-up.', metric: '4', metricLabel: 'Active handovers', trend: 'Next shift in 2h' },
}

export default async function MockModulePage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params
  const isChannel = slug[0] === 'channels' && slug.length === 2 && Boolean(channelData[slug[1]])
  if (slug.length !== 1 || slug[0] === 'dashboard' || slug[0] === 'inventory' || (!pageData[slug[0]] && !isChannel)) notFound()
  const key = isChannel ? slug[1] : slug[0]
  const page = isChannel ? { eyebrow: 'Team workspace', ...channelData[key] } : pageData[key]
  const navItem = allNavItems.find((item) => item.href === (isChannel ? `/channels/${key}` : `/${key}`))
  const rows = isChannel ? [
    { name: 'Shift update · Central Diagnostic Lab', title: 'Maya shared a team update' },
    { name: 'Pending review · Chemistry bench', title: 'Quality Manager posted a note' },
    { name: 'Daily stand-up', title: 'Operations team started a thread' },
    { name: 'Instrument status', title: 'System Bot shared an alert' },
  ] : dataFor(key).slice(0, 5)
  const rowLabel = (row: Record<string, unknown>, index: number) => String(row.name ?? row.title ?? row.label ?? row.code ?? row.id ?? `${page.title} item ${index + 1}`)
  return (
    <main className="mx-auto w-full max-w-[1440px] space-y-6 p-6 lg:p-8">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2"><div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{navItem && <navItem.icon className="size-4" />}{page.eyebrow}</div><h1 className="text-3xl font-semibold tracking-tight">{page.title}</h1><p className="max-w-2xl text-sm text-muted-foreground">{page.description}</p></div>
        <Badge className="hidden gap-1.5 border-border px-3 py-1.5 text-muted-foreground sm:flex"><Database className="size-3.5" /> Preview data</Badge>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{page.metricLabel}</CardTitle></CardHeader><CardContent><div className="text-3xl font-semibold">{page.metric}</div><p className="mt-1 text-xs text-emerald-500">{page.trend}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Operational signal</CardTitle></CardHeader><CardContent><div className="flex items-center gap-2 text-3xl font-semibold">Healthy <Activity className="size-5 text-emerald-500" /></div><p className="mt-1 text-xs text-muted-foreground">No service interruptions detected</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Last sync</CardTitle></CardHeader><CardContent><div className="flex items-center gap-2 text-3xl font-semibold">2m <Clock3 className="size-5 text-muted-foreground" /></div><p className="mt-1 text-xs text-muted-foreground">Data refreshed automatically</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Attention needed</CardTitle></CardHeader><CardContent><div className="flex items-center gap-2 text-3xl font-semibold">3 <CircleAlert className="size-5 text-amber-500" /></div><p className="mt-1 text-xs text-muted-foreground">Items to review today</p></CardContent></Card>
      </div>
      <Card><CardHeader className="flex flex-row items-center justify-between"><div><CardTitle>Recent {page.title.toLowerCase()} activity</CardTitle><p className="mt-1 text-sm text-muted-foreground">A preview of the latest operational records.</p></div><button className="rounded-md p-2 text-muted-foreground hover:bg-muted" aria-label="More options"><MoreHorizontal className="size-5" /></button></CardHeader><CardContent><div className="divide-y divide-border">{rows.map((row, index) => <div key={index} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"><div><p className="font-medium">{rowLabel(row, index)}</p><p className="mt-1 text-xs text-muted-foreground">Record updated recently · preview workspace</p></div><div className="flex items-center gap-3"><Badge className={index === 0 ? 'border-primary/30 bg-primary/10 text-primary' : 'border-border text-muted-foreground'}>{index === 0 ? 'Active' : 'On track'}</Badge><ArrowUpRight className="size-4 text-muted-foreground" /></div></div>)}</div></CardContent></Card>
    </main>
  )
}
