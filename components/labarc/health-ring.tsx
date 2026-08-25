import { cn } from '@/lib/utils'
import { healthLevel, STATUS } from '@/lib/status'

const RING_COLOR: Record<string, string> = {
  healthy: 'var(--success)',
  watch: 'var(--warning)',
  'at-risk': 'var(--warning)',
  critical: 'var(--critical)',
  offline: 'var(--muted-foreground)',
  info: 'var(--info)',
  neutral: 'var(--muted-foreground)',
}

export function HealthRing({
  score,
  size = 88,
  strokeWidth = 8,
  className,
  showLabel = true,
}: {
  score: number
  size?: number
  strokeWidth?: number
  className?: string
  showLabel?: boolean
}) {
  const { level, label } = healthLevel(score)
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const color = RING_COLOR[level]

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Health score ${score} out of 100 — ${label}`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-lg font-semibold tabular-nums leading-none">
            {score}
          </span>
          <span className={cn('mt-0.5 text-[10px] font-medium', STATUS[level].fg)}>
            {label}
          </span>
        </div>
      )}
    </div>
  )
}
