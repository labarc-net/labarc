'use client'

import { BellRing, Menu, Search, X } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Sidebar } from '@/components/app/sidebar'
import { CommandPalette } from '@/components/app/command-palette'
import { ThemeToggle } from '@/components/app/theme-toggle'
import { StatusDot } from '@/components/ui/badge'
import { alertService } from '@/lib/labarc/services'
import { cn } from '@/lib/utils'

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const pathname = usePathname()
  const unread = alertService.unreadCount()

  useEffect(() => setMobileOpen(false), [pathname])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="flex min-h-svh bg-background">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-svh w-64 shrink-0 border-r lg:block">
        <Sidebar />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-foreground/30 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-72 border-r shadow-xl">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3 z-10 inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
              aria-label="Close navigation"
            >
              <X className="size-4" />
            </button>
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur-md sm:px-6">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="inline-flex size-9 items-center justify-center rounded-md border text-muted-foreground hover:bg-accent lg:hidden"
            aria-label="Open navigation"
          >
            <Menu className="size-4" />
          </button>

          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="group flex h-9 flex-1 items-center gap-2 rounded-md border bg-card px-3 text-sm text-muted-foreground transition-colors hover:bg-accent sm:max-w-xs"
          >
            <Search className="size-4" aria-hidden />
            <span className="flex-1 text-left">Search…</span>
            <kbd className="hidden rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] sm:inline">
              ⌘K
            </kbd>
          </button>

          <div className="ml-auto flex items-center gap-2">
            <div className="hidden items-center gap-1.5 rounded-md border bg-card px-2.5 py-1.5 sm:flex">
              <StatusDot level="healthy" />
              <span className="text-xs text-muted-foreground">Live · synced 30s ago</span>
            </div>
            <ThemeToggle />
            <Link
              href="/alerts"
              className="relative inline-flex size-9 items-center justify-center rounded-md border text-muted-foreground hover:bg-accent"
              aria-label={`Alerts${unread ? `, ${unread} unread` : ''}`}
            >
              <BellRing className="size-4" />
              {unread > 0 && (
                <span
                  className={cn(
                    'absolute -right-1 -top-1 inline-flex min-w-4 items-center justify-center rounded-full bg-critical px-1 font-mono text-[10px] font-medium text-critical-foreground',
                  )}
                >
                  {unread}
                </span>
              )}
            </Link>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  )
}
