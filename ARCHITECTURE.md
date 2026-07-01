# SEAP UI — Architecture & Implementation Reference

## Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + Vite 6 |
| Language | TypeScript 5.7 |
| Routing | React Router v7 |
| Styling | Tailwind CSS v3 with custom component classes |
| Notifications | react-hot-toast |
| Virtualization | react-window (opt-in per table) |
| HTTP | Custom `ApiClient` wrapper around `fetch` |

---

## Project layout

```
src/
├── components/
│   ├── entities/
│   │   ├── ProducerDetailModal.tsx  # Producer detail dialog (badges + info + fields list); self-fetches fields
│   │   └── FieldDetailModal.tsx     # Field detail dialog (<dl> of DetailRow rows)
│   ├── tables/
│   │   └── DataTable.tsx          # Universal table component
│   └── ui/
│       ├── DescriptionList.tsx    # InfoField + DetailRow presentational primitives
│       ├── EmptyState.tsx         # Empty / zero-data placeholder
│       ├── FormModal.tsx          # Modal + standard Cancel/Submit footer (create/edit dialogs)
│       ├── Modal.tsx              # Reusable dialog (escape + overlay click to close)
│       ├── PageHeader.tsx         # Title + description + right-side action slot
│       └── StatCard.tsx           # Dashboard stat card
├── hooks/
│   ├── useLookupModal.ts          # Fetch a single record by id → open its detail modal
│   └── useTableQuery.ts           # Pagination, search, sort, filter state + fetch
├── layouts/
│   ├── AppLayout.tsx              # Shell with sidebar + main content area
│   └── Sidebar.tsx                # Navigation sidebar
├── lib/
│   ├── api.ts                     # ApiClient (GET, POST, PUT, PATCH, DELETE, list)
│   ├── labels.ts                  # Enum → display-label and enum → badge-class maps
│   └── utils.ts                   # cn(), formatDate(), formatNumber(), formatCurrency()
├── pages/
│   ├── DashboardPage.tsx
│   ├── business-entities/
│   │   └── BusinessEntitiesListPage.tsx
│   ├── fields/
│   │   └── FieldsListPage.tsx
│   ├── plantings/
│   │   └── PlantingsListPage.tsx
│   ├── production/
│   │   └── ProductionListPage.tsx
│   ├── financials/
│   │   └── FinancialsListPage.tsx
│   ├── field-photos/
│   │   └── FieldPhotosListPage.tsx
│   └── field-issues/
│       └── FieldIssuesListPage.tsx
├── types/
│   ├── index.ts                   # Re-exports everything from models.ts
│   └── models.ts                  # All entity interfaces + API helper types
├── App.tsx
├── main.tsx
└── router.tsx
```

---

## Data model (`src/types/models.ts`)

### Enums

| Type | Values |
|---|---|
| `BusinessEntityType` | `INDIVIDUAL` \| `BUSINESS` |
| `BusinessEntityStatus` | `LEAD` \| `ACTIVE` \| `INACTIVE` |
| `Variety` | `V22` \| `V76` |
| `Sex` | `FEMALE` \| `MALE` |
| `PlantingMethod` | `PLANTING` \| `GRAFTING` |
| `TrainingShape` | `FISHBONE` \| `UMBRELLA` \| `OTHER` |
| `TransactionType` | `PAYMENT` \| `DEBT` \| `OFFSET` |
| `InvoiceStatus` | `ISSUED` \| `NOT_ISSUED` \| `PARTIAL` |
| `IssueSeverity` | `LOW` \| `MEDIUM` \| `HIGH` |
| `IssueStatus` | `OPEN` \| `RESOLVED` |

### Entity interfaces

#### `BusinessEntity`
Core entity for producers and businesses.

| Field | Type | Notes |
|---|---|---|
| `id` | string | |
| `display_name` | string | Required |
| `type` | `BusinessEntityType` | |
| `status` | `BusinessEntityStatus` | |
| `afm` | string? | Greek tax ID |
| `phone` | string? | |
| `email` | string? | |
| `representative_name` | string? | |
| `region` | string? | |
| `notes` | string? | |

#### `Field`
Agricultural plot belonging to a producer. Planting metadata is stored at field level (mirrors the source Excel structure).

| Field | Type | Notes |
|---|---|---|
| `id` | string | |
| `business_entity_id` | string | FK → BusinessEntity |
| `location_name` | string | Required |
| `stremmata` | number? | Total area in stremmata |
| `gps_coordinates` | string? | |
| `planting_year` | number? | Year of planting |
| `planting_method` | `PlantingMethod`? | |
| `training_shape` | `TrainingShape`? | |
| `rootstock` | string? | e.g. HAYWARD, BOUNTY, D1 |
| `spacing` | string? | e.g. "5Χ3" |
| `length_m` | number? | Row length — used for derived area calculation |
| `width_m` | number? | Row width — used for derived area calculation |
| `analysis_number` | string? | Quick-ref; full records in FieldAnalysis |

> **Derived area**: `used_area_m2 = tree_count × (length_m × width_m)`

#### `Planting`
Tree count bucket per field per sex/variety combination. Variety only applies to FEMALE trees; MALE trees are pollinators.

| Field | Type | Notes |
|---|---|---|
| `id` | string | |
| `field_id` | string | FK → Field |
| `sex` | `Sex` | |
| `variety` | `Variety`? | Required when `sex === "FEMALE"`, omit for MALE |
| `tree_count` | number | |

#### `FieldAnalysis`
Lab analysis records attachable to a field (Option B future feature).

| Field | Type |
|---|---|
| `id` | string |
| `field_id` | string |
| `analysis_number` | string |
| `lab_name` | string? |
| `taken_at` | string? |
| `received_at` | string? |
| `attachment_url` | string? |
| `notes` | string? |

#### `ProductionRecord`
Harvest record linked to a planting.

| Field | Type | Notes |
|---|---|---|
| `id` | string | |
| `planting_id` | string | FK → Planting |
| `harvest_year` | number | |
| `quantity_kg` | number | Gross/raw weight |
| `quantity_clean_kg` | number? | Net/clean weight (ΚΑΘΑΡΟ) |
| `is_estimate` | boolean | |
| `price_per_kg` | number? | Optional realized price |
| `notes` | string? | |

#### `FinancialTransaction`
Payment, debt, or offset record.

| Field | Type | Notes |
|---|---|---|
| `id` | string | |
| `business_entity_id` | string | FK → BusinessEntity |
| `field_id` | string? | Optional FK → Field |
| `type` | `TransactionType` | |
| `year` | number | |
| `stremmata_covered` | number? | |
| `amount` | number | Computed numeric amount |
| `raw_amount` | string? | Original Excel string e.g. "1200+288" — must not be lost |
| `invoice_status` | `InvoiceStatus` | |
| `invoice_reference` | string? | Invoice number/ref e.g. "ΤΙΜ 1.488" |
| `vat_note` | string? | e.g. "δεν έβαλε ΦΠΑ" |
| `notes` | string? | |
| `transaction_date` | string? | ISO date |

#### `FieldPhoto`

| Field | Type |
|---|---|
| `id` | string |
| `field_id` | string |
| `url` | string |
| `taken_at` | string? |
| `notes` | string? |

#### `FieldIssue`
Problem report for a field.

| Field | Type | Notes |
|---|---|---|
| `id` | string | |
| `field_id` | string | FK → Field |
| `title` | string | Short headline for list views |
| `description` | string | Full description |
| `severity` | `IssueSeverity` | |
| `status` | `IssueStatus` | |
| `reported_at` | string | ISO date |
| `resolved_at` | string? | ISO date |

---

## API client (`src/lib/api.ts`)

Base URL: `/api` (proxied by Vite in dev).

```ts
api.get<T>(endpoint)
api.post<T>(endpoint, data)
api.put<T>(endpoint, data)
api.patch<T>(endpoint, data)
api.delete<T>(endpoint)
api.list<T>(endpoint, params)   // GET with URLSearchParams, returns PaginatedResponse<T>
```

### REST endpoints (expected by the frontend)

| Entity | Endpoint |
|---|---|
| BusinessEntity | `/api/business-entities` |
| Field | `/api/fields` |
| Planting | `/api/plantings` |
| Production | `/api/production` |
| FinancialTransaction | `/api/financials` |
| FieldPhoto | `/api/field-photos` |
| FieldIssue | `/api/field-issues` |

All list endpoints accept query params: `page`, `page_size`, `search`, `sort_by`, `sort_dir`, plus entity-specific filter keys.

Response shape for list endpoints:
```json
{ "data": [...], "total": 100, "page": 1, "page_size": 50 }
```

---

## `useTableQuery` hook (`src/hooks/useTableQuery.ts`)

Manages all table state in one place. Options:

```ts
useTableQuery<T>({
  endpoint: string,
  defaultPageSize?: number,   // default 50
  defaultSortBy?: string,
  defaultSortDir?: SortDirection,
  debounceMs?: number,        // default 300ms
})
```

Returns: `data`, `total`, `page`, `pageSize`, `isLoading`, `error`, `search`, `setSearch`, `sortBy`, `sortDir`, `toggleSort`, `filters`, `setFilter`, `clearFilters`, `setPage`, `setPageSize`, `totalPages`, `refetch`.

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
  isLoading?   error?

  // Toolbar
  search?  onSearchChange?  searchPlaceholder?
  filters?  activeFilters?  onFilterChange?  onClearFilters?
  toolbarExtra?   // ReactNode inserted at right of toolbar

  // Sort
  sortBy?  sortDir?  onSort?

  // Pagination
  page?  pageSize?  total?  totalPages?  onPageChange?  onPageSizeChange?

  // Virtualization (react-window, for 100+ rows)
  virtualized?   rowHeight?  maxHeight?
/>
```

`Column<T>` definition:
```ts
{ key: string; header: string; render: (row: T) => ReactNode; sortable?: boolean; className?: string }
```

---

## `Modal` component (`src/components/ui/Modal.tsx`)

```ts
<Modal open={boolean} onClose={() => void} title={string} footer={ReactNode} wide?>
  {/* form content */}
</Modal>
```

- Closes on Escape or overlay click
- Locks body scroll while open
- Footer slot is right-aligned (use for Cancel + Submit buttons)

---

## Shared building blocks (reuse before hand-rolling)

Every list page composes these instead of duplicating markup:

| Module | Use for |
|---|---|
| `ui/FormModal` | Create/edit dialogs — wraps `Modal` with the standard `Ακύρωση` + submit footer (`saving` disables the button and shows `Αποθήκευση…`). Props: `open, onClose, title, onSubmit, saving, submitLabel?, wide?`. |
| `entities/ProducerDetailModal` | Read-only producer dialog. Pass `entity: BusinessEntity \| null` + `onClose`; it fetches and lists that producer's fields itself. |
| `entities/FieldDetailModal` | Read-only field dialog. Pass `field: FieldListItem \| null` + `onClose`. |
| `ui/DescriptionList` | `InfoField` (grid cell) and `DetailRow` (labelled row); both render `null` on empty value. |
| `hooks/useLookupModal<T>(endpoint)` | Returns `{ record, openById(id?), close }` — fetch a single record by id then open its detail modal. Pair with the two entity modals. |
| `lib/labels` | Enum → Greek label maps and enum → `badge-*` class maps (entity/planting/field/issue/financial/photo). Never re-declare these in a page. |

---

## CSS utility classes (`src/index.css`)

| Class | Purpose |
|---|---|
| `.btn-primary` | Brand-coloured filled button |
| `.btn-secondary` | White outlined button |
| `.btn-danger` | Red filled button |
| `.btn-ghost` | Transparent hover button |
| `.input` | Standard form input / select / textarea |
| `.label` | Form field label |
| `.card` | White rounded container with border |
| `.badge-green/yellow/red/gray/blue` | Inline status badge |

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
Modal        ← create dialog, opened by the header/empty-state button
```

Creation flow:
1. User clicks "New X" → `setModalOpen(true)`, form reset to `emptyForm`
2. User fills form → fields validated on submit (required checks, toast errors)
3. `api.post(endpoint, payload)` → success toast + `table.refetch()` + modal closes
4. On error → error toast, modal stays open

---

## Routing (`src/router.tsx`)

All routes render inside `AppLayout`:

| Path | Page |
|---|---|
| `/` | DashboardPage |
| `/business-entities` | BusinessEntitiesListPage |
| `/fields` | FieldsListPage |
| `/plantings` | PlantingsListPage |
| `/production` | ProductionListPage |
| `/financials` | FinancialsListPage |
| `/field-photos` | FieldPhotosListPage |
| `/field-issues` | FieldIssuesListPage |

---

## What is NOT yet implemented

- **Detail / edit pages** — clicking a row logs to console; no `/entity/:id` routes exist
- **FieldAnalysis page** — entity is defined in types but has no page or route
- **File upload** — FieldPhoto URL is entered manually; no real upload
- **Authentication** — no auth layer
- **Dashboard data** — DashboardPage exists but StatCards are static
