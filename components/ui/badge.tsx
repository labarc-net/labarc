import { cn } from '@/lib/utils'
import { STATUS, type StatusLevel } from '@/lib/status'
import type { ComponentProps } from 'react'

function Badge({
  className,
  ...props
}: ComponentProps<'span'>) {
  return (
    <span
      data-slot="badge"
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs font-medium whitespace-nowrap',
        className,
      )}
      {...props}
    />
  )
}

/** A colored status pill with icon + text (never color alone — per spec §4) */
function StatusBadge({
  level,
  label,
  className,
  icon = true,
  ...props
}: ComponentProps<'span'> & {
  level: StatusLevel
  label?: string
  icon?: boolean
}) {
  const meta = STATUS[level]
  const Icon = meta.icon
  return (
    <span
      data-slot="status-badge"
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        meta.bg,
        meta.fg,
        meta.border,
        className,
      )}
      {...props}
    >
      {icon && <Icon className="size-3.5" aria-hidden />}
      {label ?? meta.label}
    </span>
  )
}

/** A small dot indicator for dense contexts */
function StatusDot({
  level,
  pulse,
  className,
}: {
  level: StatusLevel
  pulse?: boolean
  className?: string
}) {
  const meta = STATUS[level]
  return (
    <span
      className={cn(
        'inline-block size-2 shrink-0 rounded-full',
        meta.dot,
        pulse && level === 'critical' && 'animate-pulse-ring',
        className,
      )}
      aria-hidden
    />
  )
}

export { Badge, StatusBadge, StatusDot }
