# LabArc Server — Phase 5 (Quality / QC)

QC controls (analyte + level + instrument panels), QC result recording,
Levey-Jennings-style stats, trend detection, and a real Westgard
multirule engine.

## Endpoints

- `GET   /api/organizations/:orgId/qc?departmentId=`
- `GET   /api/organizations/:orgId/qc/:id`
- `POST  /api/organizations/:orgId/qc` —
  `{ departmentId, equipmentId?, analyte, level, instrumentLabel, targetMean, targetSd, unit }`
- `PATCH /api/organizations/:orgId/qc/:id` — adjust target mean/SD (e.g.
  after a new control lot), instrument label, or unit
- `POST  /api/organizations/:orgId/qc/:id/results` — `{ value }`, records
  one QC run

Each panel's `mean`/`sd`/`cv`/`trend`/`status`/`risk`/`westgardFlags`/
`recommendation` are all computed live from the last 20 recorded results
— nothing is stored beyond the raw values.

## Westgard multirules (real, not simulated)

`QcRulesService` implements the standard clinical-lab multirule set:
`1_2s` (warning trigger), `1_3s`, `2_2s`, `R_4s`, `4_1s`, `10x`
(rejection rules), evaluated as z-scores against each control's
**target** mean/SD — the established value for that control lot, which
is standard practice. This is well-established deterministic statistics,
not a model, and is unit-tested against textbook-style sequences for
every rule.

Trend detection (`stable | drifting-up | drifting-down`) is a
deliberately simple heuristic — compare the average of the first half
vs. the second half of the recent window against half a target SD —
same "start simple" philosophy as TAT prediction and equipment health
scoring elsewhere in LabArc.

## Closing the Phase 4 gap: QC feeds equipment health

Since Phase 4, `EquipmentHealthService` had a documented (not faked) gap:
QC drift as a health-score input, waiting on the QC module. This phase
fills it in — `EquipmentService` now asks `QcService` for the worst QC
risk among any QC controls linked to a piece of equipment, and
`EquipmentHealthService` deducts for it (0/10/20/30 points for
low/moderate/high/critical). Equipment with no linked QC controls is
unaffected (`qcRiskLevel: null` — nothing pretended).

## Not implemented (by design)

Nothing AI-related in this module to omit — QC scoring is pure
statistics, not AI, so there's no equivalent to equipment's `aiInsight`
or incidents' `aiSimilar` to leave out here.

## Setup

No new environment variables, dependencies, or permission keys this
phase (`qc.read` / `qc.manage` already exist).

```bash
# from server/
pnpm run db:generate
pnpm run db:migrate
pnpm run start:dev
pnpm run test     # includes the full Westgard rule-by-rule test suite
                   # and the equipment-health QC-deduction tests
```

## Next

Phase 6 — Inventory (stock tracking, consumption trends, reorder
recommendations).
