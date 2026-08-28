# LabArc Server — Phase 3 (Laboratory Operations)

Adds Workflow (the sample/task queue and its stage pipeline), Workforce
(staff profiles + live workload), and TAT (turnaround-time metrics) on
top of Phases 1–2.

## Workflow

- Every organization gets a default 6-stage pipeline the first time it's
  needed: `received -> processing -> analysis -> qc -> validation -> reported`
  (each with a target dwell time used for the board's status flag).
- `GET  /api/organizations/:orgId/operations/workflow/stages`
- `GET  /api/organizations/:orgId/operations/workflow/board?departmentId=` —
  one row per stage: current queue count + typical dwell time
- `GET  /api/organizations/:orgId/operations/workflow/items` — filter by
  `departmentId`, `stageKey`, `status`, `assignedStaffId`
- `POST /api/organizations/:orgId/operations/workflow/items`
- `PATCH /api/organizations/:orgId/operations/workflow/items/:id/advance`
  — moves to the next stage, or `{ "toStageKey": "..." }` for a specific one
- `PATCH /api/organizations/:orgId/operations/workflow/items/:id/complete`
- `PATCH /api/organizations/:orgId/operations/workflow/items/:id/assign`
  — `{ "staffProfileId": "..." }`, or `null` to unassign

## Workforce

A staff profile layers shift/capacity/competencies on top of an existing
membership (Identity's concern) — it doesn't duplicate RBAC.

- `GET   /api/organizations/:orgId/operations/workforce/staff?departmentId=`
  — `assignedTasks`, `pendingTasks`, `overdueTasks`, and `capacityPct` are
  computed live from `work_items`, not stored
- `POST  /api/organizations/:orgId/operations/workforce/staff` —
  `{ membershipId, shift, taskCapacity?, competencies?, available? }`
- `PATCH /api/organizations/:orgId/operations/workforce/staff/:id`

## TAT

- `GET   /api/organizations/:orgId/operations/tat` — one entry per
  department: current TAT (trailing 4h average), target, queue size,
  staff capacity %, a rules-based `predictedBreachMinutes`, a templated
  recommendation, and a 24h hourly history
- `PATCH /api/organizations/:orgId/operations/tat/targets/:departmentId`
  — `{ targetMinutes }` (defaults to 120 if never set)

`predictedBreachMinutes` is intentionally a simple, explainable
heuristic (current TAT vs. target; queue size vs. throughput) — per the
spec's "start simple, add ML later" guidance for TAT prediction. It's
not a trained model, and it returns `null` rather than guessing when
there isn't enough completed-item data yet.

## What's out of scope here (by design)

- No combined "Command Center" KPI-snapshot endpoint yet — that's a
  cross-module aggregate (it also needs Equipment, QC, and Incidents),
  and building it now would mean faking the fields those modules own.
  It lands once those exist.
- No background jobs — TAT history is computed on read from
  `work_item_stage_events` / `work_items`, not from periodic snapshots.
  Fine at this data volume; a rollup job is a natural addition once
  Phase 9's job infrastructure exists.

## Setup

No new environment variables or dependencies in this phase.

```bash
# from server/
pnpm run db:generate       # generate the migration for the 5 new tables
pnpm run db:migrate
pnpm run db:seed           # re-run: picks up the new operations.*/workforce.*
                            # permissions additively (safe to re-run)
pnpm run start:dev
pnpm run test              # includes the new rules-based unit tests
```

## Next (Phase 4 — Equipment)

Equipment, equipment health (rules-based scoring), and maintenance.
