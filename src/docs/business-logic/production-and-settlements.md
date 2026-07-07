# Production, estimates & settlements

This is the part of the domain most likely to be modeled wrong, so read it before
touching anything under `src/pages/production/`.

## The mental model: three things, two entities

Users think in terms of **three kinds of yearly record** for a field:

1. **Παραγωγή (Production)** — the actual harvested yield.
2. **Πρόβλεψη (Estimate)** — a forecast of the yield.
3. **Εκκαθάριση (Settlement)** — the official settlement paperwork (files).

In the data model these map to **two** entities:

| User-facing tab | Entity | How it's identified |
| --- | --- | --- |
| Παραγωγή | `ProductionRecord` | `is_estimate === false` |
| Πρόβλεψη | `ProductionRecord` | `is_estimate === true` |
| Εκκαθάριση | `Settlement` | its own entity |

The Production page (`ProductionListPage.tsx`) renders these as three tabs;
the first two share `ProductionRecordsTab` with an `isEstimate` prop, the third
uses `SettlementsTab`.

## ProductionRecord rules

- **One record per field per `harvest_year`.** A field has at most one production
  record for a given year. `is_estimate` flips it between actual and estimate —
  it is **not** valid to model "the estimate" and "the actual" as two rows of the
  same kind for the same year; they are the same record type distinguished by the
  flag. (If the product later needs to keep an estimate _and_ an actual for the
  same year side by side, that's a schema change to discuss, not something to
  hack around by duplicating rows.)
- **Yield is per fruit-bearing variety only:** `ac22_kg` and `ac76_kg`, both in
  kilograms. There is **no male yield** — `MALE` vines never produce.
- `quantity_kg` is the pre-computed total `ac22_kg + ac76_kg`. Keep it consistent
  whenever either component changes; render it, don't let users hand-edit it out
  of sync.
- Sensible default sort is by `harvest_year` (descending) — most recent first.

## Settlement (Εκκαθάριση) rules

- A `Settlement` is **one record per field per `year`**, holding **one or more
  files** (`files: SettlementFile[]`).
- Each file is either `EXCEL` or `PDF` (`SettlementFileType`), with a
  `file_name`, `file_url`, optional `size_bytes`, and `uploaded_at`.
- Settlement is deliberately **decoupled from `ProductionRecord`**: the settlement
  is the paperwork that comes back (e.g. from the packing house / cooperative),
  independent of whatever estimate or measured figure was recorded. Do not try to
  read yield numbers out of settlements or merge the two entities.

## Common tasks & the right approach

- **"Show a field's production history"** → list its `ProductionRecord`s across
  years; within a year, the actual (`is_estimate=false`) is the headline, the
  estimate (`is_estimate=true`) is the forecast.
- **"Add a settlement file"** → append to the existing year's `Settlement.files`
  if that field already has a settlement for that year; otherwise create the
  `Settlement` first.
- **"Compare estimate vs actual"** → both live in `ProductionRecord` for the same
  `(field_id, harvest_year)`, split by `is_estimate`.
