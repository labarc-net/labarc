# LabArc Server — Incidents & CAPA (Phase 4, part 2)

Incident -> Investigation -> Root Cause -> Corrective Action ->
Preventive Action -> Verification -> Closure, with a full timeline per
incident.

## Endpoints

- `GET   /api/organizations/:orgId/incidents?departmentId=&status=&severity=&equipmentId=`
- `GET   /api/organizations/:orgId/incidents/:id` — adds the full `timeline[]`
- `POST  /api/organizations/:orgId/incidents` —
  `{ departmentId, equipmentId?, title, type, severity, description, immediateAction?, dueDate?, ownerUserId? }`
  — the reporter is always the authenticated caller, not a client-supplied field
- `PATCH /api/organizations/:orgId/incidents/:id` —
  `{ title?, severity?, status?, ownerUserId?, immediateAction?, rootCauses?, correctiveAction?, preventiveAction?, dueDate? }`
- `POST  /api/organizations/:orgId/incidents/:id/timeline` — `{ event }`,
  a free-text investigation note

`severity` reuses the same `low | moderate | high | critical` vocabulary
as equipment's `failureRisk` (Phase 4) — one shared severity language
across the platform rather than a parallel one for incidents.

## Two audit trails, on purpose

- `audit_events` (Phase 2): system-level, one line per action, for
  security/compliance review.
- `incident_timeline_events`: the human CAPA narrative — "Incident
  reported", "Status changed from open to investigating", "Corrective
  action recorded", plus any free-text notes investigators add. Status
  changes and first-time corrective/preventive-action/root-cause entries
  are logged automatically; everything else goes through the `timeline`
  endpoint.

`reference` (e.g. `INC-2026-0007`) is generated from a per-organization,
per-year count. Documented in code: two incidents created in the same
org+year at the exact same instant could theoretically collide — a DB
sequence is a reasonable hardening step if that turns out to matter.

## Not implemented (by design)

`aiSimilar` (the frontend's AI-suggested similar-incidents list) isn't in
the API response — like equipment's `aiInsight`, it needs the AI/RAG
assistant (Phase 8) and would otherwise be fabricated content.

## Setup

No new environment variables, dependencies, or permission keys this
phase (`incidents.read` / `incidents.manage` already exist).

```bash
# from server/
pnpm run db:generate
pnpm run db:migrate
pnpm run start:dev
pnpm run test     # includes the CAPA state-transition unit tests
```

## Next

Phase 5 — Quality (QC results, control trends, QC-based alerts), which
also gives Equipment's health score its documented-but-missing QC-drift
input.
