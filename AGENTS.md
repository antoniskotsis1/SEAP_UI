# AGENTS.md — SEAP

> Read this before writing or changing any code in this repo. It describes **what
> the app is for and how the domain is supposed to behave**. For _how the code is
> structured_ (stack, folder layout, components), see `ARCHITECTURE.md`.

## What SEAP is

SEAP is an internal tool for managing **kiwi producers** and their **production**.
A small team uses it to keep track of who grows kiwis, on which fields, how those
fields are planted, how much they yield each year, the settlement paperwork that
comes back from the packing house, and photographic documentation of the field
work (pruning, thinning, harvest, and any problems).

The UI is in **Greek**; enum values are stored in English and mapped to Greek
labels in `src/lib/labels.ts`. Never hard-code Greek strings in components — add
or reuse a label map.

## The domain in one picture

```
Producer ──1:N── Field ──1:N── Planting            (variety composition: MALE / AC22 / AC76)
                   │
                   ├──1 per year── ProductionRecord (actual OR estimate, kg of AC22 + AC76)
                   ├──1 per year── Settlement        (Εκκαθάριση — the official files)
                   ├──1:N────────── FieldPhoto        (6 categories) ──0:1── FieldIssue
                   └──1:N────────── FieldAnalysis     (soil / leaf analysis files)

Producer ──1:N── FinancialTransaction                (payment / debt / offset)
```

## Golden rules (do not break these)

1. **Only `AC22` and `AC76` bear fruit. `MALE` never produces.** Male vines are
   pollinators. There is no "male yield" field anywhere, and there must never be.
   `ProductionRecord` only carries `ac22_kg` and `ac76_kg`.
2. **A field has at most one `ProductionRecord` per `harvest_year`.** "Actual
   production" and "estimate" are the **same** record type, distinguished by the
   `is_estimate` boolean — not two separate rows for the same year/kind.
3. **Εκκαθάριση (Settlement) is a separate entity from production**, one per
   field per `year`, and it holds files (Excel/PDF). Do not fold settlement data
   into `ProductionRecord`.
4. **Every `FieldIssue` is attached to a `FieldPhoto`** (`photo_id`). Issues are
   reported _from_ a photo, never free-standing.
5. **Photos belong to exactly one of the 6 categories** (see
   `docs/business-logic/photos-and-issues.md`). Do not invent categories.
6. `quantity_kg` on a production record is always `ac22_kg + ac76_kg`. Keep it
   consistent if you touch either component.
7. Amounts, dates and numbers are formatted through the helpers in
   `src/lib/utils.ts` (`formatCurrency`, `formatDate`, `formatNumber`). Use them.

## Where to read more

| Topic | File |
| --- | --- |
| Entities, relationships, financials, analyses | `docs/business-logic/domain-model.md` |
| Production, estimates & settlements (the subtle part) | `docs/business-logic/production-and-settlements.md` |
| Field photos & issues | `docs/business-logic/photos-and-issues.md` |
| Code structure & components | `ARCHITECTURE.md` |

## Source of truth

When docs and code disagree, **`src/types/models.ts` wins** — it is the canonical
schema. If you change the domain, update `models.ts`, then these docs, then
`labels.ts`.
