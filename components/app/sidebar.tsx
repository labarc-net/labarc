'use client'

import { Activity } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { navGroups } from '@/lib/labarc/nav'
import { alertService } from '@/lib/labarc/services'
import { cn } from '@/lib/utils'

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const unread = alertService.unreadCount()

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 items-center gap-2.5 border-b border-sidebar-border px-5">
        <div className="flex size-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
          <Activity className="size-4.5" aria-hidden />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold tracking-tight">LabArc</div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Lab Operating System
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Primary">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-4">
            <div className="px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {group.label}
            </div>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active =
                  pathname === item.href ||
                  (item.href !== '/dashboard' && pathname.startsWith(item.href))
                const Icon = item.icon
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'group flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors',
                        active
                          ? 'bg-sidebar-primary/10 font-medium text-sidebar-primary'
                          : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                      )}
                    >
                      <Icon
                        className={cn(
                          'size-4 shrink-0',
                          active ? 'text-sidebar-primary' : 'text-muted-foreground',
                        )}
                        aria-hidden
                      />
                      <span className="truncate">{item.label}</span>
                      {item.badge === 'alert' && item.label === 'Alerts' && unread > 0 && (
                        <span className="ml-auto inline-flex min-w-4 items-center justify-center rounded-full bg-critical px-1 font-mono text-[10px] font-medium text-critical-foreground">
                          {unread}
                        </span>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-2.5 rounded-md px-2 py-1.5">
          <div className="flex size-8 items-center justify-center rounded-full bg-sidebar-accent text-xs font-semibold text-sidebar-accent-foreground">
            QM
          </div>
          <div className="min-w-0 leading-tight">
            <div className="truncate text-sm font-medium">Quality Manager</div>
            <div className="truncate text-xs text-muted-foreground">
              Central Diagnostic Lab
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
