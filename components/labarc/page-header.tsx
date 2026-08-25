import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string
  description?: string
  actions?: ReactNode
  className?: string
}) {
  return (
    <header
      className={cn(
        'flex flex-col gap-3 border-b pb-5 sm:flex-row sm:items-end sm:justify-between',
        className,
      )}
    >
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight text-balance">{title}</h1>
        {description && (
          <p className="max-w-2xl text-sm text-muted-foreground text-pretty">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  )
}

export function SectionTitle({
  children,
  hint,
  className,
}: {
  children: ReactNode
  hint?: string
  className?: string
}) {
  return (
    <div className={cn('mb-3 flex items-center justify-between gap-2', className)}>
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {children}
      </h2>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </div>
  )
}
