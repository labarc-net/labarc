import { MessageSquare, Users, Hash } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const channels = [
  ['general', 'Company-wide updates and announcements', '18'],
  ['operations', 'Daily workflow and staffing coordination', '6'],
  ['quality', 'QC exceptions and quality actions', '2'],
  ['handover', 'Shift transitions and follow-up', '4'],
]

export default function WorkspacePage() {
  return <main className="mx-auto w-full max-w-[1200px] space-y-6"><header className="space-y-2"><div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground"><MessageSquare className="size-4" />Team workspace</div><h1 className="text-3xl font-semibold tracking-tight">Team workspace</h1><p className="max-w-2xl text-sm text-muted-foreground">A shared space for laboratory updates, operational coordination, and shift handovers.</p></header><div className="grid gap-4 sm:grid-cols-3"><Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Active members</CardTitle></CardHeader><CardContent><div className="flex items-center gap-2 text-3xl font-semibold">24 <Users className="size-5 text-primary" /></div><p className="mt-1 text-xs text-emerald-500">+3 this week</p></CardContent></Card><Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Channels</CardTitle></CardHeader><CardContent><div className="text-3xl font-semibold">4</div><p className="mt-1 text-xs text-muted-foreground">All team channels active</p></CardContent></Card><Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Unread updates</CardTitle></CardHeader><CardContent><div className="text-3xl font-semibold">30</div><p className="mt-1 text-xs text-muted-foreground">Across the workspace</p></CardContent></Card></div><Card><CardHeader><CardTitle>Channels</CardTitle><p className="mt-1 text-sm text-muted-foreground">Choose a channel to view the latest team activity.</p></CardHeader><CardContent><div className="grid gap-3 sm:grid-cols-2">{channels.map(([name, description, unread]) => <Link key={name} href={`/channels/${name}`} className="group flex items-center justify-between rounded-lg border p-4 transition-colors hover:border-primary/40 hover:bg-muted/40"><div className="flex items-start gap-3"><Hash className="mt-0.5 size-4 text-primary" /><div><p className="font-medium capitalize">{name}</p><p className="mt-1 text-sm text-muted-foreground">{description}</p></div></div><Badge variant="outline">{unread}</Badge></Link>)}</div></CardContent></Card></main>
}
