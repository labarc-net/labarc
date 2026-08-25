import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  CircleCheck,
  CircleSlash,
  Info,
  ShieldAlert,
  TriangleAlert,
} from 'lucide-react'

export type StatusLevel =
  | 'healthy'
  | 'watch'
  | 'at-risk'
  | 'critical'
  | 'offline'
  | 'info'
  | 'neutral'

type StatusMeta = {
  label: string
  icon: LucideIcon
  /** text color token */
  fg: string
  /** subtle background token */
  bg: string
  /** solid dot / accent color token */
  dot: string
  /** border token */
  border: string
}

export const STATUS: Record<StatusLevel, StatusMeta> = {
  healthy: {
    label: 'Healthy',
    icon: CircleCheck,
    fg: 'text-success',
    bg: 'bg-success-muted',
    dot: 'bg-success',
    border: 'border-success/30',
  },
  watch: {
    label: 'Watch',
    icon: Activity,
    fg: 'text-warning-foreground dark:text-warning',
    bg: 'bg-warning-muted',
    dot: 'bg-warning',
    border: 'border-warning/40',
  },
  'at-risk': {
    label: 'At Risk',
    icon: TriangleAlert,
    fg: 'text-warning-foreground dark:text-warning',
    bg: 'bg-warning-muted',
    dot: 'bg-warning',
    border: 'border-warning/40',
  },
  critical: {
    label: 'Critical',
    icon: ShieldAlert,
    fg: 'text-critical',
    bg: 'bg-critical-muted',
    dot: 'bg-critical',
    border: 'border-critical/40',
  },
  offline: {
    label: 'Offline',
    icon: CircleSlash,
    fg: 'text-muted-foreground',
    bg: 'bg-muted',
    dot: 'bg-muted-foreground',
    border: 'border-border',
  },
  info: {
    label: 'Info',
    icon: Info,
    fg: 'text-info',
    bg: 'bg-info-muted',
    dot: 'bg-info',
    border: 'border-info/30',
  },
  neutral: {
    label: 'Normal',
    icon: CircleCheck,
    fg: 'text-muted-foreground',
    bg: 'bg-muted',
    dot: 'bg-muted-foreground',
    border: 'border-border',
  },
}

/** Map a 0-100 health score to a status level + label per spec §12 */
export function healthLevel(score: number): {
  level: StatusLevel
  label: string
} {
  if (score >= 95) return { level: 'healthy', label: 'Excellent' }
  if (score >= 80) return { level: 'healthy', label: 'Healthy' }
  if (score >= 60) return { level: 'watch', label: 'Watch' }
  if (score >= 40) return { level: 'at-risk', label: 'At Risk' }
  return { level: 'critical', label: 'Critical' }
}

export type Severity = 'low' | 'moderate' | 'high' | 'critical'

export const SEVERITY_LEVEL: Record<Severity, StatusLevel> = {
  low: 'info',
  moderate: 'watch',
  high: 'at-risk',
  critical: 'critical',
}
