import { notFound } from 'next/navigation'
import { Hash } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const channels: Record<string, { description: string; unread: string; trend: string }> = {
  general: { description: 'Company-wide updates, announcements, and shared context for the lab team.', unread: '18', trend: '3 new today' },
  operations: { description: 'Coordinate workflow, staffing, and daily operational decisions.', unread: '6', trend: '2 need review' },
  quality: { description: 'Discuss QC exceptions, audits, and quality actions with the team.', unread: '2', trend: '1 due today' },
  handover: { description: 'Keep shift transitions clear with shared notes and accountable follow-up.', unread: '4', trend: 'Next shift in 2h' },
}

const messages = [
  ['Maya Chen', 'Shift update · Central Diagnostic Lab', 'The morning chemistry run is on schedule.'],
  ['Quality Manager', 'Pending review · Chemistry bench', 'Two results are ready for a second review.'],
  ['Operations team', 'Daily stand-up', 'Coverage is confirmed for the afternoon shift.'],
  ['System Bot', 'Instrument status', 'All connected instruments are reporting normally.'],
]

export default async function ChannelPage({ params }: { params: Promise<{ channel: string }> }) {
  const { channel } = await params
  const data = channels[channel]
  if (!data) notFound()
  const title = channel.charAt(0).toUpperCase() + channel.slice(1)
  return (
    <main className="mx-auto w-full max-w-[1200px] space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-2"><div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground"><Hash className="size-4" />Team workspace</div><h1 className="text-3xl font-semibold tracking-tight">{title}</h1><p className="max-w-2xl text-sm text-muted-foreground">{data.description}</p></div>
        <Badge className="hidden border-border px-3 py-1.5 text-muted-foreground sm:flex">Preview workspace</Badge>
      </header>
      <div className="grid gap-4 sm:grid-cols-3"><Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Unread messages</CardTitle></CardHeader><CardContent><div className="text-3xl font-semibold">{data.unread}</div><p className="mt-1 text-xs text-emerald-500">{data.trend}</p></CardContent></Card><Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Team members</CardTitle></CardHeader><CardContent><div className="text-3xl font-semibold">24</div><p className="mt-1 text-xs text-muted-foreground">5 active now</p></CardContent></Card><Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Latest activity</CardTitle></CardHeader><CardContent><div className="text-3xl font-semibold">2m</div><p className="mt-1 text-xs text-muted-foreground">Updated just now</p></CardContent></Card></div>
      <Card><CardHeader><CardTitle>Recent messages</CardTitle><p className="mt-1 text-sm text-muted-foreground">Shared updates from your laboratory team.</p></CardHeader><CardContent><div className="divide-y divide-border">{messages.map(([author, subject, body]) => <article key={subject} className="flex gap-3 py-4 first:pt-0 last:pb-0"><div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{author.split(' ').map((name) => name[0]).join('').slice(0, 2)}</div><div><p className="font-medium">{subject}</p><p className="mt-1 text-sm text-muted-foreground">{body}</p><p className="mt-2 text-xs text-muted-foreground">{author} · recently</p></div></article>)}</div></CardContent></Card>
    </main>
  )
}
