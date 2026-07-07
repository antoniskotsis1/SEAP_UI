# SEAP UI — Architecture & Implementation Reference

> This file describes **how the code is structured** (stack, layout, components).
> For **what the app is for and how the domain behaves**, see `AGENTS.md` and
> `src/docs/business-logic/`. When docs and code disagree, `src/types/models.ts`
> is the canonical schema.

## Stack

| Layer          | Technology                                    |
| -------------- | --------------------------------------------- |
| Framework      | React 19 + Vite 6                             |
| Language       | TypeScript 5.7                                |
| Routing        | React Router v7                               |
| Styling        | Tailwind CSS v3 with custom component classes |
| Form fields    | react-aria-components (TextField/TextArea)    |
| Icons          | react-icons (Feather / `Fi*`)                 |
| Dates          | date-fns                                      |
| Notifications  | react-hot-toast                               |
| Virtualization | react-window (opt-in per table)               |
| HTTP           | Custom `ApiClient` wrapper around `fetch`     |
| Demo data      | In-browser mock API (`src/lib/mock-data.ts`)  |

> **Data source**: `main.tsx` calls `setupMockApi()`, which patches `fetch` so
> the app runs entirely against in-browser mock data for the demo. There is no
> real backend yet; remove that call to talk to a live `/api`.

---

## Project layout

```
src/
├── components/
│   ├── entities/
│   │   ├── ProducerDetailModal.tsx   # Read-only producer dialog; self-fetches the producer's fields
│   │   ├── FieldDetailModal.tsx      # Read-only field dialog (<dl> of DetailRow rows)
│   │   ├── ProducerFormModal.tsx     # Create/edit producer
│   │   ├── FieldFormModal.tsx        # Create/edit field
│   │   ├── PlantingFormModal.tsx     # Create/edit planting (per-variety tree counts)
│   │   ├── ProductionFormModal.tsx   # Create/edit production record OR estimate
│   │   └── SettlementFormModal.tsx   # Create/edit settlement (Εκκαθάριση) + files
│   ├── tables/
│   │   └── DataTable.tsx             # Universal table component
│   └── ui/
│       ├── Button.tsx               # Variant button (primary/secondary/danger/ghost)
│       ├── DescriptionList.tsx      # InfoField + DetailRow presentational primitives
│       ├── EmptyState.tsx           # Empty / zero-data placeholder
│       ├── FormModal.tsx            # Modal + standard Cancel/Submit footer (create/edit dialogs)
│       ├── Modal.tsx               # Reusable dialog (escape + overlay click to close)
│       ├── PageHeader.tsx          # Title + description + right-side action slot
│       ├── SelectField.tsx         # Labelled <select>
│       ├── StatCard.tsx            # Dashboard stat card
│       ├── TextAreaField.tsx       # Labelled textarea (react-aria)
│       └── TextField.tsx           # Labelled text input (react-aria)
├── docs/
│   └── business-logic/
│       ├── domain-model.md          # Entities, relationships, financials, analyses
│       ├── production-and-settlements.md
│       └── photos-and-issues.md
├── hooks/
│   ├── useLookupModal.ts            # Fetch a single record by id → open its detail modal
│   └── useTableQuery.ts             # Pagination, search, sort, filter state + fetch
├── layouts/
│   ├── AppLayout.tsx               # Shell with sidebar + main content area
│   └── Sidebar.tsx                 # Navigation sidebar (collapsible Producers section)
├── lib/
│   ├── api.ts                      # ApiClient (GET, POST, PUT, PATCH, DELETE, list)
│   ├── labels.ts                   # Enum → Greek-label and enum → badge-class maps + orderings
│   ├── mock-data.ts                # In-browser mock API (fetch shim) for the demo
│   └── utils.ts                    # cn(), formatDate(), formatMonthYear(), formatNumber(), formatCurrency()
├── pages/
│   ├── DashboardPage.tsx
│   ├── producers/
│   │   └── ProducersListPage.tsx
│   ├── fields/
│   │   └── FieldsListPage.tsx
│   ├── plantings/
│   │   └── PlantingsListPage.tsx
│   ├── production/
│   │   ├── ProductionListPage.tsx   # Tab shell (Παραγωγή / Εκτίμηση / Εκκαθάριση)
│   │   ├── ProductionRecordsTab.tsx # Production + estimate tables (is_estimate flag)
│   │   └── SettlementsTab.tsx        # Settlements table
│   ├── financials/
│   │   └── FinancialsListPage.tsx
│   ├── field-photos/
│   │   └── FieldPhotosListPage.tsx
│   └── field-issues/
│       └── FieldIssuesListPage.tsx
├── types/
│   ├── index.ts                    # Re-exports everything from models.ts
│   └── models.ts                   # All entity interfaces + API helper types
├── App.tsx
├── main.tsx
└── router.tsx
```

---

## Data model (`src/types/models.ts`)

> Canonical schema. Every entity except the enum/helper types carries
> `created_at` / `updated_at` timestamps unless noted otherwise.

### Enums

| Type              | Values                                                                                   |
| ----------------- | ---------------------------------------------------------------------------------------- |
| `ProducerStatus`  | `LEAD` \| `ACTIVE` \| `INACTIVE`                                                          |
| `Variety`         | `MALE` \| `AC22` \| `AC76` (only `AC22`/`AC76` bear fruit; `MALE` is a pollinator)        |
| `PlantingMethod`  | `PLANTING` \| `GRAFTING` \| `MIX`                                                         |
| `TrainingShape`   | `FISHBONE` \| `UMBRELLA` \| `OTHER` \| `MIX`                                              |
| `TransactionType` | `PAYMENT` \| `DEBT` \| `OFFSET`                                                           |
| `InvoiceStatus`   | `ISSUED` \| `NOT_ISSUED` \| `PARTIAL`                                                     |
| `IssueSeverity`   | `LOW` \| `MEDIUM` \| `HIGH`                                                               |
| `IssueStatus`     | `OPEN` \| `RESOLVED`                                                                      |
| `PhotoCategory`   | `KLADEMA` \| `ARAIWMA_BLASTOU` \| `ARAIWMA_KARPOU` \| `KALOKAIRI_NERA` \| `PERIODOS_SUGKOMIDIS` \| `OTHER` |
| `SettlementFileType` | `EXCEL` \| `PDF`                                                                       |

### Entity interfaces

#### `Producer` / `ProducerListItem`

| Field                 | Type             | Notes                              |
| --------------------- | ---------------- | ---------------------------------- |
| `id`                  | string           |                                    |
| `display_name`        | string           | Required                           |
| `status`              | `ProducerStatus` |                                    |
| `afm`                 | string?          | Greek tax ID                       |
| `phone`               | string?          |                                    |
| `email`               | string?          |                                    |
| `representative_name` | string?          |                                    |
| `region`              | string?          |                                    |
| `notes`               | string?          |                                    |
| `total_stremmata`     | number?          | **`ProducerListItem` only** — sum across the producer's fields |

#### `Field`

Agricultural plot belonging to a producer.

| Field              | Type                 | Notes                                                |
| ------------------ | -------------------- | ---------------------------------------------------- |
| `id`               | string               |                                                      |
| `producer_id`      | string               | FK → Producer                                        |
| `producer_name`    | string               | Denormalized for display                             |
| `location_name`    | string               | Required                                             |
| `region`           | string?              |                                                      |
| `stremmata`        | number?              | Total area in stremmata                              |
| `gps_coordinates`  | string?              |                                                      |
| `comments`         | string?              |                                                      |
| `planting_date`    | string?              | ISO date                                             |
| `planting_method`  | `PlantingMethod`?    |                                                      |
| `training_shape`   | `TrainingShape`?     |                                                      |
| `rootstock`        | string?              | e.g. HAYWARD, BOUNTY, D1                             |
| `spacing`          | string?              | e.g. "5Χ3"                                           |
| `total_plants`     | number?              |                                                      |
| `analyses`         | `FieldAnalysisFile[]`? | Uploaded soil/leaf analysis spreadsheets           |
| `planting_summary` | string?              | Derived display summary (trees × variety)            |
| `photo_count`      | number?              | Derived count of attached photos                     |
| `created_at`       | string               |                                                      |
| `updated_at`       | string               |                                                      |

#### `FieldAnalysisFile`

Uploaded soil/leaf analysis spreadsheet attached to a field (`Field.analyses`).

| Field | `id` | `file_name` | `file_url` | `size_bytes?` | `uploaded_at` |
| ----- | ---- | ----------- | ---------- | ------------- | ------------- |

#### `Planting`

Per-variety tree counts within a field. A planting may hold any of the three varieties.

| Field            | Type              | Notes                                       |
| ---------------- | ----------------- | ------------------------------------------- |
| `id`             | string            |                                             |
| `field_id`       | string            | FK → Field                                  |
| `varieties`      | `VarietyCount[]`  | `{ variety, tree_count }` per variety       |
| `tree_count`     | number            | Total across all varieties                  |
| `planting_year`  | number?           |                                             |
| `planting_method`| `PlantingMethod`? |                                             |
| `training_shape` | `TrainingShape`?  |                                             |
| `rootstock`      | string?           |                                             |
| `spacing`        | string?           |                                             |
| `created_at` / `updated_at` | string |                                     |

#### `ProductionRecord`

One production **or estimate** record per field per harvest year. Distinguished by `is_estimate` — not two separate row types. Only fruit varieties produce.

| Field          | Type    | Notes                          |
| -------------- | ------- | ------------------------------ |
| `id`           | string  |                                |
| `field_id`     | string  | FK → Field                     |
| `harvest_year` | number  |                                |
| `ac22_kg`      | number  | Yield of AC22                  |
| `ac76_kg`      | number  | Yield of AC76                  |
| `quantity_kg`  | number  | Always `ac22_kg + ac76_kg`     |
| `is_estimate`  | boolean | `false` = actual, `true` = estimate |
| `notes`        | string? |                                |
| `created_at` / `updated_at` | string |                    |

#### `Settlement` / `SettlementFile` (Εκκαθάριση)

Official settlement paperwork — a separate entity from production, one per field per year, holding one or more files.

`Settlement`: `id`, `field_id` (FK → Field), `year`, `files: SettlementFile[]`, `notes?`, `created_at`, `updated_at`.
`SettlementFile`: `id`, `file_name`, `file_url`, `file_type` (`SettlementFileType`), `size_bytes?`, `uploaded_at`.

#### `FieldAnalysis`

Structured lab-analysis record (separate from the uploaded `FieldAnalysisFile`).

`id`, `field_id`, `analysis_number`, `lab_name?`, `taken_at?`, `received_at?`, `attachment_url?`, `notes?`, `created_at`, `updated_at`.

#### `FinancialTransaction`

Payment, debt, or offset record.

| Field               | Type              | Notes                                                    |
| ------------------- | ----------------- | -------------------------------------------------------- |
| `id`                | string            |                                                          |
| `producer_id`       | string            | FK → Producer                                            |
| `field_id`          | string?           | Optional FK → Field                                      |
| `type`              | `TransactionType` |                                                          |
| `year`              | number            |                                                          |
| `stremmata_covered` | number?           |                                                          |
| `amount`            | number            | Computed numeric amount                                  |
| `raw_amount`        | string?           | Original Excel string e.g. "1200+288" — must not be lost |
| `invoice_status`    | `InvoiceStatus`   |                                                          |
| `invoice_reference` | string?           | Invoice number/ref e.g. "ΤΙΜ 1.488"                      |
| `vat_note`          | string?           | e.g. "δεν έβαλε ΦΠΑ"                                     |
| `notes`             | string?           |                                                          |
| `transaction_date`  | string?           | ISO date                                                 |
| `created_at` / `updated_at` | string    |                                                          |

#### `FieldPhoto`

| Field       | Type            | Notes                                          |
| ----------- | --------------- | ---------------------------------------------- |
| `id`        | string          |                                                |
| `field_id`  | string          | FK → Field                                     |
| `url`       | string          |                                                |
| `category`  | `PhotoCategory` | One of the 6 categories                        |
| `taken_at`  | string?         |                                                |
| `notes`     | string?         |                                                |
| `created_at`| string          |                                                |
| `issue`     | `FieldIssue`?   | Server-joined when the photo documents a problem |

#### `FieldIssue`

Problem report — always tied to a photo.

| Field         | Type            | Notes                             |
| ------------- | --------------- | --------------------------------- |
| `id`          | string          |                                   |
| `field_id`    | string          | FK → Field                        |
| `photo_id`    | string?         | The photo this issue was reported from |
| `title`       | string          | Short headline for list views     |
| `description` | string          | Full description                  |
| `severity`    | `IssueSeverity` |                                   |
| `status`      | `IssueStatus`   |                                   |
| `reported_at` | string          | ISO date                          |
| `resolved_at` | string?         | ISO date                          |
| `created_at` / `updated_at` | string |                             |

---

## API client (`src/lib/api.ts`)

Base URL: `/api`. In the demo, `setupMockApi()` intercepts these calls.

```ts
api.get<T>(endpoint);
api.post<T>(endpoint, data);
api.put<T>(endpoint, data);
api.patch<T>(endpoint, data);
api.delete<T>(endpoint);
api.list<T>(endpoint, params); // GET with URLSearchParams → PaginatedResponse<T>
```

- Sets `Content-Type: application/json`; throws the parsed `ApiError` on non-2xx.
- Returns `undefined` for `204 No Content`.

### REST endpoints (expected by the frontend)

| Entity               | Endpoint            |
| -------------------- | ------------------- |
| Producer             | `/api/producers`    |
| Field                | `/api/fields`       |
| Planting             | `/api/plantings`    |
| Production           | `/api/production`   |
| Settlement           | `/api/settlements`  |
| FinancialTransaction | `/api/financials`   |
| FieldPhoto           | `/api/field-photos` |
| FieldIssue           | `/api/field-issues` |

All list endpoints accept: `page`, `page_size`, `search`, `sort_by`, `sort_dir`, plus entity-specific filter keys.

Response shape for list endpoints:

```json
{ "data": [...], "total": 100, "page": 1, "page_size": 50 }
```

---

## `useTableQuery` hook (`src/hooks/useTableQuery.ts`)

Manages all table state (pagination, debounced search, sort, filters, fetch with request-abort) in one place. Options:

```ts
useTableQuery<T>({
  endpoint: string,
  defaultPageSize?: number,          // default 50
  defaultSortBy?: string,
  defaultSortDir?: SortDirection,    // default "asc"
  debounceMs?: number,               // default 300ms
  defaultFilters?: Record<string, string>,
  staticParams?: Record<string, string>, // always sent, never cleared by clearFilters (e.g. a tab's is_estimate)
})
```

Returns: `data`, `total`, `page`, `pageSize`, `isLoading`, `error`, `search`, `setSearch`, `sortBy`, `sortDir`, `toggleSort`, `filters`, `setFilter`, `clearFilters`, `setPage`, `setPageSize`, `totalPages`, `refetch`.

## `useLookupModal` hook (`src/hooks/useLookupModal.ts`)

`useLookupModal<T>(endpoint)` → `{ record, openById(id?), close }`. Fetches a single record by id (`list({ id })`, takes `data[0]`) and holds it as the open state of a detail modal. Pair with the entity detail modals.

---

## `DataTable` component (`src/components/tables/DataTable.tsx`)

Generic, fully-typed table. Key props:

```ts
<DataTable<T>
  columns={Column<T>[]}
  data={T[]}
  keyExtractor={(row) => string}
  onRowClick?={(row) => void}

  // State
  isLoading?  error?

  // Toolbar
  search?  onSearchChange?  searchPlaceholder?
  filters?  activeFilters?  onFilterChange?  onClearFilters?
  toolbarExtra?   // ReactNode inserted at right of toolbar

  // Sort
  sortBy?  sortDir?  onSort?

  // Pagination
  page?  pageSize?  total?  totalPages?  onPageChange?  onPageSizeChange?

  // Virtualization (react-window, for 100+ rows)
  virtualized?  rowHeight?  maxHeight?
/>
```

`Column<T>` definition:

```ts
{ key: string; header: string; render: (row: T) => ReactNode; sortable?: boolean; className?: string; width?: string }
```

---

## `Modal` & `FormModal` (`src/components/ui/`)

```ts
<Modal open onClose title footer? wide?>{/* content */}</Modal>
```

- Closes on Escape or overlay click; locks body scroll while open; footer slot is right-aligned.

```ts
<FormModal open onClose title onSubmit saving submitLabel? wide?>{/* fields */}</FormModal>
```

- Wraps `Modal` with the standard `Ακύρωση` + submit footer. `saving` disables the submit button and shows `Αποθήκευση…`.

---

## Shared building blocks (reuse before hand-rolling)

| Module                              | Use for                                                                                                                                     |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `ui/FormModal`                      | Create/edit dialogs. Props: `open, onClose, title, onSubmit, saving, submitLabel?, wide?`.                                                 |
| `ui/TextField` / `ui/TextAreaField` / `ui/SelectField` | Labelled form controls (TextField/TextArea via react-aria). Use inside form modals.                                    |
| `ui/Button`                         | `variant` = `primary` \| `secondary` \| `danger` \| `ghost`.                                                                               |
| `entities/*FormModal`               | Create/edit dialogs per entity (Producer, Field, Planting, Production, Settlement). Take `open, onClose, onSaved` + optional record to edit. |
| `entities/ProducerDetailModal`      | Read-only producer dialog. `producer: Producer \| null`, `onClose`, optional `onEdit`; fetches and lists that producer's fields itself.     |
| `entities/FieldDetailModal`         | Read-only field dialog. `field: Field \| null`, `onClose`, optional `onEdit`.                                                               |
| `ui/DescriptionList`                | `InfoField` (grid cell) and `DetailRow` (labelled row); both render `null` on empty value.                                                  |
| `hooks/useLookupModal<T>(endpoint)` | Fetch a single record by id then open its detail modal.                                                                                     |
| `lib/labels`                        | Enum → Greek label maps, enum → `badge-*` class maps, `VARIETY_ORDER`, `PHOTO_CATEGORY_ORDER`, and `photoIssueBorder()`. Never re-declare these in a page. |
| `lib/utils`                         | `cn()`, `formatDate()`, `formatMonthYear()`, `formatNumber()`, `formatCurrency()`.                                                          |

---

## CSS utility classes (`src/index.css`)

| Class                               | Purpose                                 |
| ----------------------------------- | --------------------------------------- |
| `.btn-primary`                      | Brand-coloured filled button            |
| `.btn-secondary`                    | White outlined button                   |
| `.btn-danger`                       | Red filled button                       |
| `.btn-ghost`                        | Transparent hover button                |
| `.input`                            | Standard form input / select / textarea |
| `.label`                            | Form field label                        |
| `.card`                             | White rounded container with border     |
| `.badge-green/yellow/red/gray/blue` | Inline status badge                     |

---

## Page patterns

Every list page follows this structure:

```
PageHeader (title + description + "New X" button)
  ↓
EmptyState   ← shown when no data AND no active search/filter
  OR
DataTable    ← shown when data exists or search/filter is active
  ↓
*FormModal   ← create/edit dialog
*DetailModal ← read-only dialog opened by row click (via useLookupModal for cross-entity lookups)
```

Create/edit flow:

1. Click "New X" (or a row's edit) → open the form modal (`editing` holds the record being edited, or `null` to create).
2. Fill form → validated on submit (required checks, toast errors).
3. `api.post`/`api.put(endpoint, payload)` → success toast + `table.refetch()` + modal closes.
4. On error → error toast, modal stays open.

---

## Routing (`src/router.tsx`) & navigation

All routes render inside `AppLayout`:

| Path            | Page                |
| --------------- | ------------------- |
| `/` (index)     | DashboardPage       |
| `/producers`    | ProducersListPage   |
| `/fields`       | FieldsListPage      |
| `/plantings`    | PlantingsListPage   |
| `/production`   | ProductionListPage (tabs: Παραγωγή / Εκτίμηση / Εκκαθάριση) |
| `/financials`   | FinancialsListPage  |
| `/field-photos` | FieldPhotosListPage |
| `/field-issues` | FieldIssuesListPage |

The `Sidebar` shows a collapsible Producers section (status sub-links) plus Fields, Plantings, Production, Photos, Issues. The **Financials** nav item is gated behind the `VITE_SHOW_FINANCIALS === "true"` env flag (the route itself always exists).

---

## What is NOT yet implemented

- **Real backend** — the app runs on an in-browser mock API (`setupMockApi()`); no live server.
- **Dedicated detail/edit routes** — editing happens in modals; there are no `/entity/:id` routes.
- **Real file upload** — analysis/settlement/photo files are referenced by URL; no upload pipeline.
- **Authentication** — no auth layer.
- **Dashboard data** — DashboardPage exists but StatCards are static.
