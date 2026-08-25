'use client'

import { Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { allNavItems } from '@/lib/labarc/nav'
import { equipmentService } from '@/lib/labarc/services'
import { cn } from '@/lib/utils'

interface CommandEntry {
  label: string
  group: string
  href: string
}

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const entries = useMemo<CommandEntry[]>(() => {
    const nav = allNavItems.map((n) => ({
      label: n.label,
      group: 'Navigate',
      href: n.href,
    }))
    const equip = equipmentService.list().map((e) => ({
      label: e.name,
      group: 'Equipment',
      href: `/equipment/${e.id}`,
    }))
    return [...nav, ...equip]
  }, [])

  const filtered = useMemo(() => {
    if (!query.trim()) return entries
    const q = query.toLowerCase()
    return entries.filter((e) => e.label.toLowerCase().includes(q))
  }, [entries, query])

  useEffect(() => {
    if (open) {
      setQuery('')
      setActive(0)
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  useEffect(() => setActive(0), [query])

  function go(href: string) {
    onOpenChange(false)
    router.push(href)
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-foreground/20 p-4 pt-[12vh] backdrop-blur-sm"
      onClick={() => onOpenChange(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="w-full max-w-xl overflow-hidden rounded-xl border bg-popover shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            setActive((a) => Math.min(a + 1, filtered.length - 1))
          } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setActive((a) => Math.max(a - 1, 0))
          } else if (e.key === 'Enter' && filtered[active]) {
            e.preventDefault()
            go(filtered[active].href)
          } else if (e.key === 'Escape') {
            onOpenChange(false)
          }
        }}
      >
        <div className="flex items-center gap-2.5 border-b px-4">
          <Search className="size-4 text-muted-foreground" aria-hidden />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search modules, equipment, actions…"
            className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            ESC
          </kbd>
        </div>
        <ul className="max-h-80 overflow-y-auto p-1.5">
          {filtered.length === 0 && (
            <li className="px-3 py-8 text-center text-sm text-muted-foreground">
              No results for “{query}”
            </li>
          )}
          {filtered.map((entry, i) => (
            <li key={`${entry.href}-${entry.label}`}>
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onClick={() => go(entry.href)}
                className={cn(
                  'flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm',
                  i === active
                    ? 'bg-accent text-accent-foreground'
                    : 'text-foreground',
                )}
              >
                <span>{entry.label}</span>
                <span className="text-xs text-muted-foreground">{entry.group}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
