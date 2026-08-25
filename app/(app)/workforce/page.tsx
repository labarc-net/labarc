import { PageHeader } from '@/components/labarc/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge, StatusBadge, StatusDot } from '@/components/ui/badge'
import { workforceService } from '@/lib/labarc/services'
import type { StatusLevel } from '@/lib/status'

export default function WorkforcePage() {
  const staff = workforceService.list()
  const active = staff.filter((s) => s.available)
  const overloaded = staff.filter((s) => s.status === 'at-risk')

  return (
    <div className="space-y-6">
      <PageHeader
        title="Workforce"
        description="Staff capacity, workload distribution, and competency coverage across shifts — surfacing who is overloaded and where to rebalance."
        actions={
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{active.length} on shift</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-warning" /> {overloaded.length} at capacity
            </span>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {staff.map((s) => (
          <Card key={s.id} className="gap-0 p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 font-medium text-primary">
                  {s.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </div>
                <div>
                  <div className="font-medium">{s.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {s.role} · {s.department}
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <StatusBadge level={s.status} label={`${s.capacity}% load`} icon={false} />
                <span className="text-xs text-muted-foreground">{s.shift} shift</span>
              </div>
            </div>

            {/* Capacity bar */}
            <div className="mt-4">
              <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                <span>Capacity utilization</span>
                <span className="font-mono tabular-nums">{s.capacity}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full ${
                    s.capacity > 85 ? 'bg-critical' : s.capacity > 70 ? 'bg-warning' : 'bg-chart-2'
                  }`}
                  style={{ width: `${s.capacity}%` }}
                />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 border-t pt-4">
              <TaskStat label="Assigned" value={s.assignedTasks} />
              <TaskStat label="Pending" value={s.pendingTasks} level={s.pendingTasks > 3 ? 'watch' : undefined} />
              <TaskStat label="Overdue" value={s.overdueTasks} level={s.overdueTasks > 0 ? 'critical' : undefined} />
            </div>

            <div className="mt-4 flex flex-wrap gap-1.5">
              {s.competencies.map((c) => (
                <Badge key={c} className="bg-muted text-muted-foreground">
                  {c}
                </Badge>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

function TaskStat({
  label,
  value,
  level,
}: {
  label: string
  value: number
  level?: StatusLevel
}) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-1.5">
        {level && <StatusDot level={level} />}
        <span className="font-mono text-lg font-semibold tabular-nums">{value}</span>
      </div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  )
}
