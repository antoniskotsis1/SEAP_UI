# Domain model

Canonical schema lives in `src/types/models.ts`. This document explains the
_meaning_ and _rules_ behind those types. Field-by-field column lists belong in
`ARCHITECTURE.md`; here we describe behavior.

## Entities & relationships

### Producer

A kiwi grower (person or business). Core record everything else hangs off.

- Has a `status`: `LEAD` (Lead), `ACTIVE` (Ενεργός), `INACTIVE` (Ανενεργός).
- Optional identifying/contact info: `afm` (Greek tax ID), `phone`, `email`,
  `representative_name`, `region`.
- A producer **owns many Fields** (1:N).
- In list views, `total_stremmata` is a **derived** roll-up of the area across
  all the producer's fields — never edit it directly; it is computed.

### Field (Χωράφι)

A single agricultural plot belonging to one producer.

- Belongs to **exactly one Producer** (`producer_id`). `producer_name` is
  denormalized onto the field for display convenience — the producer is the owner
  of truth.
- Area is tracked in **stremmata** (`stremmata`), the Greek unit of land area
  (1 stremma = 1000 m²). Some fields also carry `gps_coordinates`.
- Carries **planting metadata** (date, method, training shape, rootstock,
  spacing, total plants) that summarizes how the plot is established.
- Has derived display helpers: `planting_summary` (trees × variety) and
  `photo_count`. These are computed server-side; treat as read-only in the UI.
- A field can have attached `analyses` (soil/leaf analysis spreadsheets).

### Planting (Φύτευση)

The **variety composition** of a field — how many trees of each variety it holds.

- Belongs to **one Field** (`field_id`).
- `varieties` is a list of `{ variety, tree_count }`. A planting may mix any of
  the three varieties. `tree_count` on the planting is the **sum** across
  `varieties[].tree_count`.
- Carries its own `planting_method`, `training_shape`, `rootstock`, `spacing`,
  and `planting_year`, plus optional free-text `comments`.

> **Business rule (confirm if changing):** conceptually a field has **one**
> planting describing its variety mix. The schema keys `Planting` by `field_id`
> and does not hard-forbid multiple, so if you build a field detail view, present
> the planting as the field's composition (and decide deliberately whether to
> allow more than one). `Field.planting_summary` is the derived one-line version.

### Variety (Ποικιλία)

Three values: `MALE` (Αρσενικά), `AC22`, `AC76`.

- **Only `AC22` and `AC76` bear fruit.** `MALE` vines are pollinators and never
  have yield. This is the single most important invariant in the app — see
  `production-and-settlements.md`.
- Canonical display order is `AC22`, `AC76`, `MALE` (`VARIETY_ORDER` in
  `labels.ts`).

### ProductionRecord & Settlement

The yearly output of a field. Because this is the subtle part, it has its own
document: **`production-and-settlements.md`**. Summary:

- `ProductionRecord` — one per field per `harvest_year`; `is_estimate`
  distinguishes an **estimate** from **actual** production.
- `Settlement` (Εκκαθάριση) — a **separate** entity, one **per `year`** (not per
  field). The external partner sends one or more files that already cover every
  field for that year; we archive those files (Excel/PDF) against the year, with
  optional free-text `comments`.

### FieldPhoto & FieldIssue

Photographic documentation of field work, and problems flagged on a field.
Covered in **`photos-and-issues.md`**. Summary: every photo has one of 6
categories; an issue always belongs to a field and **may optionally** originate
from a photo (`photo_id`) — issues can also be reported standalone.

### FieldAnalysis (Ανάλυση)

Soil / leaf laboratory analyses attached to a field.

- Belongs to one Field (`field_id`).
- `FieldAnalysis` is the structured record (`analysis_number`, `lab_name`,
  `taken_at`, `received_at`, `notes`, optional `attachment_url`).
- `FieldAnalysisFile` (referenced from `Field.analyses`) is a lighter attachment
  representation (an uploaded Excel spreadsheet) used in field detail.

### FinancialTransaction (Οικονομικά)

Money moving between the business and a producer.

- Belongs to a **Producer** (`producer_id`), optionally scoped to a specific
  **Field** (`field_id`) and always to a `year`.
- `type`: `PAYMENT` (Πληρωμή), `DEBT` (Οφειλή), `OFFSET` (Συμψηφισμός).
- `invoice_status`: `ISSUED` (Εκδόθηκε), `NOT_ISSUED` (Δεν εκδόθηκε),
  `PARTIAL` (Μερική). Related fields: `invoice_reference`, `vat_note`,
  `stremmata_covered`, `raw_amount` (the original as-entered string before
  normalization into numeric `amount`).
- Always format `amount` with `formatCurrency`.

## Vocabularies (enum → Greek label)

Keep these in sync with `src/lib/labels.ts`. The English key is what's stored;
the Greek string is what users see.

| Enum              | Value → Label                                                            |
| ----------------- | ------------------------------------------------------------------------ |
| `ProducerStatus`  | `LEAD`→Lead · `ACTIVE`→Ενεργός · `INACTIVE`→Ανενεργός                    |
| `Variety`         | `AC22`→AC22 · `AC76`→AC76 · `MALE`→Αρσενικά                              |
| `PlantingMethod`  | `PLANTING`→Φύτευση · `GRAFTING`→Εμβολιασμός · `MIX`→Μεικτό               |
| `TrainingShape`   | `FISHBONE`→Ψαροκόκαλο · `UMBRELLA`→Ομπρέλα · `MIX`→Μεικτό · `OTHER`→Άλλο |
| `TransactionType` | `PAYMENT`→Πληρωμή · `DEBT`→Οφειλή · `OFFSET`→Συμψηφισμός                 |
| `InvoiceStatus`   | `ISSUED`→Εκδόθηκε · `NOT_ISSUED`→Δεν εκδόθηκε · `PARTIAL`→Μερική         |
| `IssueSeverity`   | `LOW`→Χαμηλή · `MEDIUM`→Μέτρια · `HIGH`→Υψηλή                            |
| `IssueStatus`     | `OPEN`→Ανοιχτό · `RESOLVED`→Επιλύθηκε                                    |
| `PhotoCategory`   | see `photos-and-issues.md`                                               |

## Derived / read-only fields — do not edit directly

These are computed (usually server-side) and should be rendered, never written,
from the UI: `Producer.total_stremmata`, `Field.planting_summary`,
`Field.photo_count`, `Planting.tree_count` (sum of variety counts),
`ProductionRecord.quantity_kg` (sum of the two variety kg).
