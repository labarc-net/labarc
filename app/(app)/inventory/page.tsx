import { AlertTriangle, Boxes, PackageCheck, TrendingDown } from 'lucide-react'
import { PageHeader } from '@/components/labarc/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/badge'
import { inventoryApiService } from '@/lib/labarc/services'
import type { InventoryItem } from '@/lib/labarc/types'

const statusConfig: Record<InventoryItem['status'], { label: string; level: 'healthy' | 'watch' | 'at-risk' | 'critical' }> = {
  ok: { label: 'In stock', level: 'healthy' },
  reorder: { label: 'Reorder', level: 'watch' },
  low: { label: 'Low stock', level: 'at-risk' },
  expiring: { label: 'Expiring', level: 'watch' },
  'stockout-risk': { label: 'Stockout risk', level: 'critical' },
}

function formatExpiry(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value || '—'
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
}

function InventoryRow({ item }: { item: InventoryItem }) {
  const status = statusConfig[item.status]
  const stockPercent = Math.min(100, Math.round((item.stock / Math.max(item.reorderLevel * 2, 1)) * 100))

  return (
    <tr className="border-b last:border-0">
      <td className="px-4 py-3">
        <div className="font-medium">{item.name}</div>
        <div className="text-xs text-muted-foreground">{item.category} · Lot {item.lot}</div>
      </td>
      <td className="px-4 py-3 text-sm">{item.department}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${stockPercent}%` }} />
          </div>
          <span className="font-mono text-sm tabular-nums">{item.stock} {item.unit}</span>
        </div>
        <div className="mt-1 text-xs text-muted-foreground">Reorder at {item.reorderLevel}</div>
      </td>
      <td className="px-4 py-3 text-sm">{formatExpiry(item.expiry)}</td>
      <td className="px-4 py-3 text-right"><StatusBadge level={status.level} label={status.label} /></td>
    </tr>
  )
}

export default async function InventoryPage() {
  const items = await inventoryApiService.list()
  const reorderItems = items.filter((item) => item.status === 'reorder' || item.status === 'low')
  const stockoutRisk = items.filter((item) => item.status === 'stockout-risk')
  const expiring = items.filter((item) => item.status === 'expiring')

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory"
        description="Monitor stock levels, expiry windows, and replenishment risk across the laboratory."
      />

      <section aria-label="Inventory summary" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SummaryCard icon={Boxes} label="Tracked items" value={items.length} />
        <SummaryCard icon={TrendingDown} label="Need attention" value={reorderItems.length} tone="warning" />
        <SummaryCard icon={AlertTriangle} label="Stockout risk" value={stockoutRisk.length} tone="critical" />
      </section>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>Stock overview</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Live inventory levels and replenishment thresholds.</p>
          </div>
          {expiring.length > 0 && <div className="text-sm text-warning">{expiring.length} expiring soon</div>}
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead className="border-y bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Item</th>
                  <th className="px-4 py-3 font-medium">Department</th>
                  <th className="px-4 py-3 font-medium">Stock</th>
                  <th className="px-4 py-3 font-medium">Expiry</th>
                  <th className="px-4 py-3 text-right font-medium">Status</th>
                </tr>
              </thead>
              <tbody>{items.map((item) => <InventoryRow key={item.id} item={item} />)}</tbody>
            </table>
          </div>
          {items.length === 0 && <div className="p-8 text-center text-sm text-muted-foreground">No inventory records found.</div>}
        </CardContent>
      </Card>
    </div>
  )
}

function SummaryCard({ icon: Icon, label, value, tone = 'default' }: { icon: typeof Boxes; label: string; value: number; tone?: 'default' | 'warning' | 'critical' }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`rounded-md p-2 ${tone === 'critical' ? 'bg-critical/10 text-critical' : tone === 'warning' ? 'bg-warning/10 text-warning' : 'bg-primary/10 text-primary'}`}>
          <Icon className="size-4" aria-hidden="true" />
        </div>
        <div>
          <div className="text-2xl font-semibold tabular-nums">{value}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  )
}
