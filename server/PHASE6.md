# LabArc Server — Phase 6 (Inventory)

Inventory items (reagents, controls, calibrators, consumables, spare
parts, PPE), an append-only stock movement log, consumption-rate/trend
computation, and a transparent reorder/expiry/stockout status engine.

## Endpoints

- `GET   /api/organizations/:orgId/inventory?departmentId=`
- `GET   /api/organizations/:orgId/inventory/:id`
- `POST  /api/organizations/:orgId/inventory` —
  `{ departmentId, name, category, lot, unit, reorderLevel, leadTimeDays, expiry?, supplier, initialStock? }`
  — `initialStock`, if given, is recorded as an initial `received` movement
  so a new item doesn't start life at a confusing zero.
- `PATCH  /api/organizations/:orgId/inventory/:id` — static fields only
  (name, lot, unit, reorderLevel, leadTimeDays, expiry, supplier) — stock
  itself only changes through movements, never a direct field edit
- `POST  /api/organizations/:orgId/inventory/:id/movements` —
  `{ quantity, reason }`. Positive quantity = received, negative =
  consumed/wasted/adjusted down. `reason` is one of `received | consumed
  | adjusted | wasted`.

## Computed, not stored

Like equipment health, TAT, and QC stats in earlier phases, current
stock is never a stored column — it's `sum(quantity)` over
`inventory_stock_movements`. `dailyConsumption` is the trailing-14-day
average consumption rate; `consumptionTrend` is a zero-filled 7-day
daily series for charting.

## Status precedence (rules-based, explainable)

One status wins per item, in this order:

1. **stockout-risk** — projected days until empty (`stock ÷
   dailyConsumption`) is less than or equal to the supplier lead time:
   even reordering right now wouldn't arrive in time.
2. **expiring** — expiry date within 30 days, independent of quantity.
3. **reorder** — stock at or below the configured reorder level.
4. **low** — stock at or below 1.5× the reorder level (an early,
   softer warning).
5. **ok** — otherwise.

Every status ships with a plain-language `recommendation` string
explaining *why* — per the spec's explicit "make recommendations
explainable" instruction for inventory intelligence.

## Setup

No new environment variables, dependencies, or permission keys this
phase (`inventory.read` / `inventory.manage` already exist).

```bash
# from server/
pnpm run db:generate
pnpm run db:migrate
pnpm run start:dev
pnpm run test     # includes the full status-precedence rule test suite
```

## Next

Phase 7 — Intelligence (analytics, alerts, a rules engine tying
equipment/QC/inventory/TAT signals together, and early warnings) — the
natural point to finally build the Command Center KPI-snapshot endpoint
that's been deliberately deferred since Phase 3.
