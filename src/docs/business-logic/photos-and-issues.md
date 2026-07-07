# Field photos & issues

Covers `FieldPhoto`, `FieldIssue`, and the pages under `src/pages/field-photos/`
and `src/pages/field-issues/`.

## Field photos

A `FieldPhoto` is an image documenting work or conditions on a specific field.

- Belongs to **one Field** (`field_id`).
- Has exactly **one category** (`PhotoCategory`) — one of the six below.
- Optional `taken_at` and `notes`.
- May carry an attached `issue` (a `FieldIssue`) when the photo documents a
  problem. When present, it is server-joined onto the photo for display.

### The 6 photo categories

There are **exactly six** categories. Do not add, remove, or rename them without
a deliberate domain change (update `PhotoCategory` in `models.ts` and
`labels.ts`). Canonical order is `PHOTO_CATEGORY_ORDER` in `labels.ts`.

| Value | Label (Greek) | Meaning |
| --- | --- | --- |
| `KLADEMA` | Κλάδεμα | Pruning |
| `ARAIWMA_BLASTOU` | Αραίωμα Βλαστού-Μπουμπούκι | Shoot / bud thinning |
| `ARAIWMA_KARPOU` | Αραίωμα Καρπού | Fruit thinning |
| `KALOKAIRI_NERA` | Καλοκαιρινή Επίβλεψη | Summer supervision |
| `PERIODOS_SUGKOMIDIS` | Συγκομιδή | Harvest |
| `OTHER` | Άλλο | Anything that doesn't fit above |

> Note: the enum key `KALOKAIRI_NERA` and its Greek label
> ("Καλοκαιρινή Επίβλεψη") differ in wording; the **label** is what users see.
> Don't "fix" the key to match — renaming an enum value is a data migration.

## Field issues

A `FieldIssue` records a problem observed on a field.

- **Always attached to a photo** (`photo_id`). Issues are reported _from_ a photo;
  there is no such thing as a field issue without an originating photo. Enforce
  this when building any "report issue" flow — start from a photo.
- Belongs to the same field (`field_id`) as its photo.
- Has a `title`, `description`, a `severity` (`LOW` / `MEDIUM` / `HIGH`), and a
  `status` (`OPEN` / `RESOLVED`).
- `reported_at` is set when raised; `resolved_at` when closed.

### Severity → label & color

| Severity | Label | Badge |
| --- | --- | --- |
| `LOW` | Χαμηλή | gray |
| `MEDIUM` | Μέτρια | yellow |
| `HIGH` | Υψηλή | red |

### Status → label & color

| Status | Label | Badge |
| --- | --- | --- |
| `OPEN` | Ανοιχτό | yellow |
| `RESOLVED` | Επιλύθηκε | green |

## Photo thumbnail borders (visual convention)

Photo thumbnails are wrapped in a colored border signalling issue state — see
`photoIssueBorder()` in `labels.ts`. Keep this convention consistent:

- **Green** — no issue on the photo.
- **Yellow** — an issue of `LOW` or `MEDIUM` severity.
- **Red** — an issue of `HIGH` severity.
