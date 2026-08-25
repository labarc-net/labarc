import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  BellRing,
  Boxes,
  Bot,
  CalendarClock,
  ClipboardList,
  Cpu,
  FileText,
  FlaskConical,
  GaugeCircle,
  GitBranch,
  LayoutDashboard,
  LineChart,
  Network,
  Radio,
  Settings,
  ShieldAlert,
  Timer,
  Users,
  Workflow,
} from 'lucide-react'

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  badge?: 'alert' | 'warning'
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

export const navGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [{ label: 'Command Center', href: '/dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Workforce', href: '/workforce', icon: Users },
      { label: 'Workflow', href: '/workflow', icon: Workflow },
      { label: 'TAT Intelligence', href: '/tat', icon: Timer },
      { label: 'Handover', href: '/handover', icon: ClipboardList },
    ],
  },
  {
    label: 'Laboratory',
    items: [
      { label: 'Equipment', href: '/equipment', icon: FlaskConical },
      { label: 'Maintenance', href: '/maintenance', icon: CalendarClock },
      { label: 'Quality Control', href: '/quality-control', icon: GaugeCircle },
      { label: 'Inventory', href: '/inventory', icon: Boxes },
      { label: 'Incidents', href: '/incidents', icon: ShieldAlert, badge: 'alert' },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { label: 'Analytics', href: '/analytics', icon: LineChart },
      { label: 'AI Assistant', href: '/ai-assistant', icon: Bot },
      { label: 'Digital Twin', href: '/digital-twin', icon: Network },
    ],
  },
  {
    label: 'Connectivity',
    items: [
      { label: 'Integrations', href: '/integrations', icon: GitBranch },
      { label: 'Devices / Sensors', href: '/devices', icon: Radio },
    ],
  },
  {
    label: 'Knowledge',
    items: [{ label: 'Documents', href: '/documents', icon: FileText }],
  },
  {
    label: 'System',
    items: [
      { label: 'Alerts', href: '/alerts', icon: BellRing, badge: 'alert' },
      { label: 'Settings', href: '/settings', icon: Settings },
    ],
  },
]

export const allNavItems: NavItem[] = navGroups.flatMap((g) => g.items)

export const iconMap = { Activity, Cpu }
