# LabArc Server — Phase 4 (Equipment)

Adds the Equipment registry, telemetry/error/downtime tracking, a
transparent rules-based health engine, and Maintenance records.

## Scope note

The master plan groups "equipment, equipment health, maintenance,
incidents" into one phase. This script covers equipment + health +
maintenance. Incidents/CAPA (Incident -> Investigation -> Root Cause ->
Corrective/Preventive Action -> Verification -> Closure) is substantial
enough to ship as its own follow-on rather than bundling it in here.

## Equipment

- `GET  /api/organizations/:orgId/equipment?departmentId=` — summary
  shape: static fields + computed `status`, `healthScore`, `failureRisk`,
  `utilization`, `downtimeHoursMonth`, `nextMaintenance`, `lastMaintenance`
- `GET  /api/organizations/:orgId/equipment/:id` — adds `errorCodes[]`
  and `telemetry[]` (with up to 50 recent points per metric) — the full
  shape the frontend's `Equipment` type expects, **except** `aiInsight`
  (see below)
- `POST  /api/organizations/:orgId/equipment`
- `PATCH /api/organizations/:orgId/equipment/:id` — including
  `operationalState: "offline"` to manually take equipment out of service
- `POST  /api/organizations/:orgId/equipment/:id/telemetry` —
  `{ metricKey, unit, value }`. This is the ingestion point a simulator,
  test script, or (later) an MQTT bridge all feed the same way.
- `POST  /api/organizations/:orgId/equipment/:id/errors` — `{ code }`
- `POST  /api/organizations/:orgId/equipment/:id/downtime/start`
- `PATCH /api/organizations/:orgId/equipment/:id/downtime/end`

### Health scoring (rules-based, on purpose)

`EquipmentHealthService` starts every piece of equipment at 100 and
deducts explainable points for: recent error events (capped), telemetry
drift beyond a threshold (capped), overdue or soon-due maintenance,
downtime hours this month (capped), and utilization overload. No hidden
weights, no trained model — per the spec's explicit instruction not to
pretend an ML model exists. **QC drift and equipment age are documented
but not yet wired in** — QC drift needs the QC module (Phase 5); adding
either now would mean faking a signal that doesn't exist yet.

`status` and `failureRisk` are both derived from the same `healthScore`
using the same breakpoints the frontend's `healthLevel()` helper already
uses (spec §12) — 80/60/40 — so the two layers won't drift out of sync.
`offline` is the one exception: it's a manual flag on the equipment
record, never computed.

**Not implemented**: `aiInsight` (the frontend's per-equipment AI
summary/recommendation) is deliberately left out of the API response —
it needs the AI/RAG assistant (Phase 8), and fabricating a static
"insight" string now would be exactly the kind of faked AI content the
spec warns against.

## Maintenance

- `GET   /api/organizations/:orgId/maintenance?equipmentId=&status=`
- `POST  /api/organizations/:orgId/maintenance` —
  `{ equipmentId, type, scheduledFor, technicianStaffProfileId?, durationHours?, notes? }`
- `PATCH /api/organizations/:orgId/maintenance/:id`

`status` in the database is `scheduled | in_progress | completed |
cancelled` — `overdue` is never stored; it's computed at read time from
`scheduled` + a past-due date (`displayStatus`), so it can't go stale.

## Setup

No new environment variables or dependencies in this phase.

```bash
# from server/
pnpm run db:generate       # generates the migration for the 5 new tables
pnpm run db:migrate
pnpm run db:seed           # re-run: picks up technicians' new equipment.manage
pnpm run start:dev
pnpm run test              # includes the health-scoring and maintenance unit tests
```

## Next

Incidents/CAPA (the rest of the original Phase 4 grouping), then Phase 5
— Quality (QC, QC trends, QC alerts) per the plan.
