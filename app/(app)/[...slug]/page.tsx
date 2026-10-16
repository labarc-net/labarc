import { notFound } from 'next/navigation'
import { Activity, ArrowUpRight, CircleAlert, Clock3, Database, MoreHorizontal, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { allNavItems } from '@/lib/labarc/nav'
import { alertService, dashboardService, deviceService, equipmentService, incidentService, integrationService, knowledgeService, maintenanceService, qcService, tatService, workforceService, workflowService } from '@/lib/labarc/services'

type ModulePage = { eyebrow: string; title: string; description: string; metric: string; metricLabel: string; trend: string; focus: string; actions: string[] }

const pageData: Record<string, ModulePage> = {
  workforce: { eyebrow: 'Operations', title: 'Workforce', description: 'Manage staff coverage, workload, competency, and shift accountability across the laboratory.', metric: '94%', metricLabel: 'Coverage today', trend: '+6.4%', focus: 'Workload intelligence', actions: ['Review overloaded staff', 'Open today’s roster', 'Assign pending tasks'] },
  workflow: { eyebrow: 'Operations', title: 'Workflow', description: 'Track specimens from receipt through validation, reporting, and escalation.', metric: '1,284', metricLabel: 'Active specimens', trend: '+12.8%', focus: 'Specimen flow', actions: ['View task queues', 'Inspect bottlenecks', 'Open workflow templates'] },
  tat: { eyebrow: 'Operations', title: 'TAT Intelligence', description: 'Predict turnaround risk and make capacity recommendations before targets are missed.', metric: '87.6%', metricLabel: 'Within target', trend: '+3.2%', focus: 'Predictive turnaround', actions: ['Review breach risks', 'Compare departments', 'Open recommendations'] },
  handover: { eyebrow: 'Operations', title: 'Handover', description: 'Create structured shift handovers for unresolved incidents, QC, stock, maintenance, and next-shift tasks.', metric: '8', metricLabel: 'Open handovers', trend: '-2 today', focus: 'Shift continuity', actions: ['Start handover', 'Review unresolved items', 'Generate shift summary'] },
  equipment: { eyebrow: 'Laboratory', title: 'Equipment', description: 'View instrument availability, utilization, telemetry, error history, and health signals.', metric: '98.2%', metricLabel: 'Uptime', trend: '+1.1%', focus: 'Digital equipment profiles', actions: ['Open equipment twin', 'Review failure risk', 'Add instrument'] },
  maintenance: { eyebrow: 'Laboratory', title: 'Maintenance', description: 'Plan preventive maintenance, calibration, service work, and equipment downtime.', metric: '12', metricLabel: 'Due this week', trend: '3 urgent', focus: 'Preventive maintenance', actions: ['View maintenance calendar', 'Log service event', 'Review overdue work'] },
  'quality-control': { eyebrow: 'Laboratory', title: 'Quality Control', description: 'Monitor QC pass rates, drift, Westgard signals, reagent lots, and analyzer comparisons.', metric: '99.1%', metricLabel: 'Pass rate', trend: '+0.8%', focus: 'Predictive QC', actions: ['Open QC trends', 'Review drift warnings', 'Compare analyzers'] },
  incidents: { eyebrow: 'Laboratory', title: 'Incidents', description: 'Capture incidents, investigate root causes, coordinate CAPA, and preserve the audit trail.', metric: '4', metricLabel: 'Needs review', trend: '1 critical', focus: 'Root cause intelligence', actions: ['Report incident', 'Review CAPA', 'Find similar incidents'] },
  analytics: { eyebrow: 'Intelligence', title: 'Analytics', description: 'Explore operational, quality, equipment, inventory, workforce, and management trends.', metric: '18.4k', metricLabel: 'Tests this month', trend: '+14.2%', focus: 'Laboratory intelligence', actions: ['Open operations view', 'Compare periods', 'Export report'] },
  'ai-assistant': { eyebrow: 'Intelligence', title: 'AI Assistant', description: 'Investigate laboratory questions using operational history, SOPs, incidents, QC, and equipment context.', metric: '24', metricLabel: 'Insights available', trend: 'Updated now', focus: 'Evidence-based assistance', actions: ['Ask about an incident', 'Troubleshoot equipment', 'Search knowledge base'] },
  'digital-twin': { eyebrow: 'Intelligence', title: 'Digital Twin', description: 'See a living model of people, equipment, workflows, sensors, QC, inventory, and environment.', metric: '7/8', metricLabel: 'Systems online', trend: '1 degraded', focus: 'Laboratory digital twin', actions: ['Open equipment map', 'Inspect degraded system', 'View live signals'] },
  integrations: { eyebrow: 'Connectivity', title: 'Integrations', description: 'Connect LIS, LIMS, EMR, instruments, sensors, and file-based data exchange through isolated connectors.', metric: '6', metricLabel: 'Connected systems', trend: 'All healthy', focus: 'Integration hub', actions: ['Add connector', 'Review message logs', 'Test data exchange'] },
  devices: { eyebrow: 'Connectivity', title: 'Devices / Sensors', description: 'Monitor telemetry from analyzers, refrigerators, rooms, power systems, and edge gateways.', metric: '42', metricLabel: 'Devices reporting', trend: '+4 this month', focus: 'Sensor and gateway health', actions: ['Add device', 'Review telemetry', 'Check gateway status'] },
  documents: { eyebrow: 'Knowledge', title: 'Documents', description: 'Find SOPs, policies, service manuals, troubleshooting guides, and approved laboratory knowledge.', metric: '186', metricLabel: 'Published documents', trend: '12 updated', focus: 'RAG knowledge engine', actions: ['Upload document', 'Browse SOPs', 'Review recent changes'] },
  alerts: { eyebrow: 'System', title: 'Alerts', description: 'Review equipment, QC, temperature, inventory, TAT, incident, maintenance, and power alerts.', metric: '7', metricLabel: 'Active alerts', trend: '2 high priority', focus: 'Early warning center', actions: ['Acknowledge high priority', 'Configure rules', 'View alert history'] },
  settings: { eyebrow: 'System', title: 'Settings', description: 'Configure organization, facilities, departments, roles, permissions, alert rules, and audit preferences.', metric: '100%', metricLabel: 'Workspace health', trend: 'Up to date', focus: 'Organization controls', actions: ['Manage members', 'Configure alerts', 'Open audit log'] },
  workspace: { eyebrow: 'Team workspace', title: 'Team workspace', description: 'Coordinate the laboratory team through shared channels, handovers, announcements, and operational updates.', metric: '24', metricLabel: 'Active members', trend: '+3 this week', focus: 'Shared operational context', actions: ['Create channel', 'Invite teammate', 'Review mentions'] },
}

const channelData: Record<string, ModulePage> = {
  general: { eyebrow: 'Team workspace', title: 'General', description: 'Company-wide updates, announcements, and shared context for the lab team.', metric: '18', metricLabel: 'Unread messages', trend: '3 new today', focus: 'Team communication', actions: ['Post update', 'Search channel', 'View members'] },
  operations: { eyebrow: 'Team workspace', title: 'Operations', description: 'Coordinate workflow, staffing, and daily operational decisions.', metric: '6', metricLabel: 'Open threads', trend: '2 need review', focus: 'Operational coordination', actions: ['Start thread', 'Share handover', 'Mention supervisor'] },
  quality: { eyebrow: 'Team workspace', title: 'Quality', description: 'Discuss QC exceptions, audits, and quality actions with the team.', metric: '2', metricLabel: 'Open actions', trend: '1 due today', focus: 'Quality collaboration', actions: ['Post QC note', 'Link incident', 'Review actions'] },
  handover: { eyebrow: 'Team workspace', title: 'Handover', description: 'Keep shift transitions clear with shared notes and accountable follow-up.', metric: '4', metricLabel: 'Active handovers', trend: 'Next shift in 2h', focus: 'Shift continuity', actions: ['Start handover', 'Add unresolved item', 'Generate summary'] },
}

const serviceRows: Record<string, () => unknown[]> = {
  workforce: () => workforceService.list(), workflow: () => workflowService.stages(), equipment: () => equipmentService.list(), maintenance: () => maintenanceService.list(), incidents: () => incidentService.list(), 'quality-control': () => qcService.list(), tat: () => tatService.list(), devices: () => deviceService.list(), integrations: () => integrationService.list(), documents: () => knowledgeService.list(), alerts: () => alertService.list(),
}

const previewRows = (key: string, isChannel: boolean) => isChannel ? ['Shift update · Central Diagnostic Lab', 'Pending review · Chemistry bench', 'Daily stand-up', 'Instrument status'] : (serviceRows[key]?.() ?? dashboardService.earlyWarnings()).slice(0, 5).map((row: any, index) => String(row.name ?? row.title ?? row.label ?? row.code ?? row.id ?? `${pageData[key].title} item ${index + 1}`))

export default async function MockModulePage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params
  const isChannel = slug[0] === 'channels' && slug.length === 2 && Boolean(channelData[slug[1]])
  if (slug.length !== 1 || slug[0] === 'dashboard' || slug[0] === 'inventory' || (!pageData[slug[0]] && !isChannel)) notFound()
  const key = isChannel ? slug[1] : slug[0]
  const page = isChannel ? channelData[key] : pageData[key]
  const navItem = allNavItems.find((item) => item.href === (isChannel ? `/channels/${key}` : `/${key}`))
  const rows = previewRows(key, isChannel)
  return (
    <main className="mx-auto w-full max-w-[1440px] space-y-6 p-6 lg:p-8">
      <header className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div className="space-y-2"><div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{navItem && <navItem.icon className="size-4" />}{page.eyebrow}</div><h1 className="text-3xl font-semibold tracking-tight">{page.title}</h1><p className="max-w-2xl text-sm leading-6 text-muted-foreground">{page.description}</p></div>
        <Badge className="w-fit gap-1.5 border-primary/25 bg-primary/10 px-3 py-1.5 text-primary"><Database className="size-3.5" /> Preview data</Badge>
      </header>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{page.metricLabel}</CardTitle></CardHeader><CardContent><div className="text-3xl font-semibold">{page.metric}</div><p className="mt-1 text-xs text-emerald-500">{page.trend}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Operational signal</CardTitle></CardHeader><CardContent><div className="flex items-center gap-2 text-2xl font-semibold">Healthy <Activity className="size-5 text-emerald-500" /></div><p className="mt-1 text-xs text-muted-foreground">No service interruptions detected</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Last sync</CardTitle></CardHeader><CardContent><div className="flex items-center gap-2 text-2xl font-semibold">2m <Clock3 className="size-5 text-muted-foreground" /></div><p className="mt-1 text-xs text-muted-foreground">Refreshes when backend data is available</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Attention needed</CardTitle></CardHeader><CardContent><div className="flex items-center gap-2 text-2xl font-semibold">3 <CircleAlert className="size-5 text-amber-500" /></div><p className="mt-1 text-xs text-muted-foreground">Items to review today</p></CardContent></Card>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Card><CardHeader className="flex flex-row items-center justify-between"><div><CardTitle>{page.focus}</CardTitle><p className="mt-1 text-sm text-muted-foreground">A focused view of the work that matters next.</p></div><button className="rounded-md p-2 text-muted-foreground hover:bg-muted" aria-label="More options"><MoreHorizontal className="size-5" /></button></CardHeader><CardContent><div className="divide-y divide-border">{rows.map((row, index) => <div key={`${row}-${index}`} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"><div><p className="font-medium">{row}</p><p className="mt-1 text-xs text-muted-foreground">Record updated recently · {isChannel ? 'team workspace' : 'operational preview'}</p></div><div className="flex items-center gap-3"><Badge className={index === 0 ? 'border-primary/30 bg-primary/10 text-primary' : 'border-border text-muted-foreground'}>{index === 0 ? 'Review' : 'On track'}</Badge><ArrowUpRight className="size-4 text-muted-foreground" /></div></div>)}</div></CardContent></Card>
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="size-4 text-primary" /> Suggested next actions</CardTitle><p className="mt-1 text-sm text-muted-foreground">Recommendations are previews until the corresponding backend module is enabled.</p></CardHeader><CardContent className="space-y-2">{page.actions.map((action) => <button key={action} className="flex w-full items-center justify-between rounded-lg border border-border px-3 py-3 text-left text-sm transition-colors hover:border-primary/40 hover:bg-primary/5"><span>{action}</span><ArrowUpRight className="size-4 text-muted-foreground" /></button>)}</CardContent></Card>
      </div>
    </main>
  )
}
