'use client'

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const AXIS = 'var(--muted-foreground)'
const GRID = 'var(--border)'

function TooltipBox({ active, payload, label, unit }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-md border bg-popover px-2.5 py-1.5 text-xs shadow-md">
      {label != null && (
        <div className="mb-0.5 font-medium text-popover-foreground">{label}</div>
      )}
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 text-muted-foreground">
          <span
            className="inline-block size-2 rounded-full"
            style={{ background: p.color ?? p.stroke ?? p.fill }}
          />
          <span className="tabular-nums text-popover-foreground">
            {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
            {unit ? ` ${unit}` : ''}
          </span>
        </div>
      ))}
    </div>
  )
}

/** Small inline sparkline for dense contexts */
export function Sparkline({
  data,
  color = 'var(--chart-1)',
  height = 36,
}: {
  data: number[]
  color?: string
  height?: number
}) {
  const chartData = data.map((value, i) => ({ i, value }))
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 2, bottom: 2, left: 0, right: 0 }}>
        <defs>
          <linearGradient id={`spark-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#spark-${color})`}
          isAnimationActive={false}
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function TelemetryChart({
  data,
  color = 'var(--chart-1)',
  unit,
  height = 200,
}: {
  data: { t: string; value: number }[]
  color?: string
  unit?: string
  height?: number
}) {
  const id = `tel-${Math.abs(hashColor(color))}`
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.28} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke={GRID} strokeDasharray="3 3" />
        <XAxis
          dataKey="t"
          tick={{ fontSize: 10, fill: AXIS }}
          tickLine={false}
          axisLine={false}
          interval={11}
          minTickGap={24}
        />
        <YAxis
          tick={{ fontSize: 10, fill: AXIS }}
          tickLine={false}
          axisLine={false}
          width={44}
        />
        <Tooltip content={<TooltipBox unit={unit} />} />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill={`url(#${id})`}
          isAnimationActive={false}
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function TatChart({
  data,
  target,
  height = 220,
}: {
  data: { t: string; tat: number; predicted?: number }[]
  target: number
  height?: number
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={GRID} strokeDasharray="3 3" />
        <XAxis dataKey="t" tick={{ fontSize: 10, fill: AXIS }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 10, fill: AXIS }} tickLine={false} axisLine={false} width={40} />
        <Tooltip content={<TooltipBox unit="min" />} />
        <ReferenceLine
          y={target}
          stroke="var(--critical)"
          strokeDasharray="4 4"
          strokeWidth={1.5}
          label={{ value: 'Target', fontSize: 10, fill: 'var(--critical)', position: 'insideTopRight' }}
        />
        <Line type="monotone" dataKey="tat" stroke="var(--chart-1)" strokeWidth={2} dot={false} isAnimationActive={false} />
        <Line
          type="monotone"
          dataKey="predicted"
          stroke="var(--warning)"
          strokeWidth={2}
          strokeDasharray="5 4"
          dot={false}
          isAnimationActive={false}
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function LeveyJenningsChart({
  data,
  mean,
  sd,
  unit,
  height = 220,
}: {
  data: { n: number; value: number }[]
  mean: number
  sd: number
  unit?: string
  height?: number
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: -6, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={GRID} strokeDasharray="3 3" />
        <XAxis dataKey="n" tick={{ fontSize: 10, fill: AXIS }} tickLine={false} axisLine={false} />
        <YAxis
          domain={[mean - 3.4 * sd, mean + 3.4 * sd]}
          tick={{ fontSize: 10, fill: AXIS }}
          tickLine={false}
          axisLine={false}
          width={52}
          tickFormatter={(v) => v.toFixed(2)}
        />
        <Tooltip content={<TooltipBox unit={unit} />} />
        {[-3, -2, -1, 0, 1, 2, 3].map((z) => (
          <ReferenceLine
            key={z}
            y={mean + z * sd}
            stroke={z === 0 ? 'var(--muted-foreground)' : Math.abs(z) === 3 ? 'var(--critical)' : Math.abs(z) === 2 ? 'var(--warning)' : GRID}
            strokeDasharray={z === 0 ? '0' : '3 3'}
            strokeWidth={z === 0 ? 1.5 : 1}
            label={{ value: z === 0 ? 'x̄' : `${z > 0 ? '+' : ''}${z}SD`, fontSize: 9, fill: AXIS, position: 'right' }}
          />
        ))}
        <Line type="linear" dataKey="value" stroke="var(--chart-1)" strokeWidth={1.8} dot={{ r: 2.5, fill: 'var(--chart-1)' }} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function DepartmentBars({
  data,
  height = 220,
}: {
  data: { department: string; workload: number; capacity: number }[]
  height?: number
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }} barGap={2}>
        <CartesianGrid vertical={false} stroke={GRID} strokeDasharray="3 3" />
        <XAxis dataKey="department" tick={{ fontSize: 10, fill: AXIS }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 10, fill: AXIS }} tickLine={false} axisLine={false} width={40} />
        <Tooltip content={<TooltipBox />} cursor={{ fill: 'var(--muted)', opacity: 0.5 }} />
        <Bar dataKey="capacity" fill="var(--muted)" radius={[3, 3, 0, 0]} isAnimationActive={false} />
        <Bar dataKey="workload" radius={[3, 3, 0, 0]} isAnimationActive={false}>
          {data.map((d, i) => (
            <Cell
              key={i}
              fill={d.workload / d.capacity > 0.9 ? 'var(--critical)' : d.workload / d.capacity > 0.8 ? 'var(--warning)' : 'var(--chart-1)'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function ConsumptionBars({
  data,
  color = 'var(--chart-1)',
  height = 40,
}: {
  data: number[]
  color?: string
  height?: number
}) {
  const chartData = data.map((value, i) => ({ i, value }))
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} margin={{ top: 2, bottom: 0, left: 0, right: 0 }}>
        <Bar dataKey="value" fill={color} radius={[2, 2, 0, 0]} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  )
}

function hashColor(s: string) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i)
  return h
}
