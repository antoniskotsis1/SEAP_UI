// ─── Enums ───────────────────────────────────────────────────────────────────

export type ProducerStatus = "LEAD" | "ACTIVE" | "INACTIVE";

export type Variety = "MALE" | "AC22" | "AC76";
export type PlantingMethod = "PLANTING" | "GRAFTING" | "MIX";
export type TrainingShape = "FISHBONE" | "UMBRELLA" | "OTHER" | "MIX";

export type TransactionType = "PAYMENT" | "DEBT" | "OFFSET";
export type InvoiceStatus = "ISSUED" | "NOT_ISSUED" | "PARTIAL";

export type IssueSeverity = "LOW" | "MEDIUM" | "HIGH";
export type IssueStatus = "OPEN" | "RESOLVED";

export type PhotoCategory =
  | "KLADEMA"
  | "ARAIWMA_BLASTOU"
  | "ARAIWMA_KARPOU"
  | "KALOKAIRI_NERA"
  | "PERIODOS_SUGKOMIDIS"
  | "OTHER";

// ─── Entities ────────────────────────────────────────────────────────────────

export interface Producer {
  id: string;
  display_name: string;
  status: ProducerStatus;
  afm?: string;
  phone?: string;
  email?: string;
  representative_name?: string;
  region?: string;
  notes?: string;
}

export interface ProducerListItem extends Producer {
  /** Sum of stremmata across all of this producer's fields. */
  total_stremmata?: number;
}

/** An uploaded soil/leaf analysis spreadsheet (Excel) attached to a field. */
export interface FieldAnalysisFile {
  id: string;
  file_name: string;
  file_url: string;
  size_bytes?: number;
  uploaded_at: string;
}

export interface Field {
  id: string;
  // ── Owning producer (denormalized from Producer for display) ──────
  producer_id: string;
  producer_name: string;
  location_name: string;
  region?: string;
  stremmata?: number;
  gps_coordinates?: string;
  comments?: string;

  // ── Planting metadata ─────────────────────────────────────────────
  planting_date?: string;
  planting_method?: PlantingMethod;
  training_shape?: TrainingShape;
  rootstock?: string;
  spacing?: string;
  total_plants?: number;

  /** Uploaded analysis spreadsheets (Excel) for this field. */
  analyses?: FieldAnalysisFile[];

  /** Derived display summary of the field's plantings (trees × variety). */
  planting_summary?: string;
  /**
   * Derived per-variety tree counts aggregated across the field's plantings,
   * for rendering variety pills. Ordered by `VARIETY_ORDER`.
   */
  planting_varieties?: VarietyCount[];
  /** Derived count of photos attached to this field (for the photos list). */
  photo_count?: number;
  created_at: string;
  updated_at: string;
}

/** Number of trees of a single variety within a planting. */
export interface VarietyCount {
  variety: Variety;
  tree_count: number;
}

export interface Planting {
  id: string;
  field_id: string;
  /** Per-variety tree counts; a planting may contain any of the three varieties. */
  varieties: VarietyCount[];
  /** Total trees across all varieties (sum of `varieties[].tree_count`). */
  tree_count: number;
  planting_year?: number;
  planting_method?: PlantingMethod;
  training_shape?: TrainingShape;
  rootstock?: string;
  spacing?: string;
  /** Free-text notes about this planting. */
  comments?: string;
  created_at: string;
  updated_at: string;
}

export interface FieldAnalysis {
  id: string;
  field_id: string;
  analysis_number: string;
  lab_name?: string;
  taken_at?: string;
  received_at?: string;
  attachment_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

/**
 * One production (or estimate) record per field per harvest year.
 * Only the two fruit-bearing varieties produce; males never do.
 */
export interface ProductionRecord {
  id: string;
  field_id: string;
  harvest_year: number;
  // Yield in kg per fruit variety
  ac22_kg: number;
  ac76_kg: number;
  // Pre-computed total (ac22_kg + ac76_kg)
  quantity_kg: number;
  /** `false` → actual production, `true` → estimate. */
  is_estimate: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// ─── Settlement (Εκκαθάριση) ─────────────────────────────────────────────────

export type SettlementFileType = "EXCEL" | "PDF";

/** A single uploaded settlement document (Excel or PDF). */
export interface SettlementFile {
  id: string;
  file_name: string;
  file_url: string;
  file_type: SettlementFileType;
  size_bytes?: number;
  uploaded_at: string;
}

/**
 * One settlement record **per year** (not per field). The packing house /
 * external partner sends one or more files that already cover every field for
 * that year; we simply archive those files against the year, with optional
 * free-text comments.
 */
export interface Settlement {
  id: string;
  year: number;
  files: SettlementFile[];
  comments?: string;
  created_at: string;
  updated_at: string;
}

export interface FinancialTransaction {
  id: string;
  producer_id: string;
  field_id?: string;
  type: TransactionType;
  year: number;
  stremmata_covered?: number;
  amount: number;
  raw_amount?: string;
  invoice_status: InvoiceStatus;
  invoice_reference?: string;
  vat_note?: string;
  notes?: string;
  transaction_date?: string;
  created_at: string;
  updated_at: string;
}

export interface FieldPhoto {
  id: string;
  field_id: string;
  url: string;
  category: PhotoCategory;
  taken_at?: string;
  notes?: string;
  created_at: string;
  /** Populated (server-joined) when this photo documents a problem. */
  issue?: FieldIssue;
}

export interface FieldIssue {
  id: string;
  field_id: string;
  /**
   * The photo this issue was reported from, when it originated from one.
   * Undefined for issues reported standalone from the issues page.
   */
  photo_id?: string;
  title: string;
  description: string;
  severity: IssueSeverity;
  status: IssueStatus;
  reported_at: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

/** Actual production for one harvest year, split by fruit variety (kg). */
export interface ProductionYearPoint {
  year: number;
  ac22_kg: number;
  ac76_kg: number;
}

/** Total trees of a variety across every field, for the composition chart. */
export interface VarietyCompositionPoint {
  variety: Variety;
  tree_count: number;
}

/** Count of open issues at a given severity. */
export interface SeverityCountPoint {
  severity: IssueSeverity;
  count: number;
}

/** Estimate vs. actual production for a single year (kg). */
export interface EstimateVsActualPoint {
  year: number;
  estimate_kg: number;
  actual_kg: number;
}

/** Productivity (actual kg per stremma) for one harvest year. */
export interface YieldPerStremmaPoint {
  year: number;
  kg_per_stremma: number;
}

/** Number of producers in a given status. */
export interface StatusCountPoint {
  status: ProducerStatus;
  count: number;
}

/** Total land area (stremmata) in a region. */
export interface RegionStremmataPoint {
  region: string;
  stremmata: number;
}

/** Number of field photos in a given category. */
export interface CategoryCountPoint {
  category: PhotoCategory;
  count: number;
}

/** Aggregate figures shown on the dashboard. No financial data by design. */
export interface DashboardStats {
  activeProducers: number;
  totalFields: number;
  /** Total land area across all fields, in stremmata. */
  totalStremmata: number;
  /** Actual (non-estimate) production for the latest harvest year, in kg. */
  totalProduction: number;
  openIssues: number;
  /** Actual production per harvest year (AC22 + AC76), oldest → newest. */
  productionByYear: ProductionYearPoint[];
  /** Tree population split across AC22 / AC76 / MALE. */
  varietyComposition: VarietyCompositionPoint[];
  /** Open issues grouped by severity (LOW / MEDIUM / HIGH). */
  openIssuesBySeverity: SeverityCountPoint[];
  /** Estimate vs. actual production for the most recent year with data. */
  estimateVsActual: EstimateVsActualPoint | null;
  /** Actual kg per stremma per harvest year, oldest → newest. */
  yieldPerStremmaByYear: YieldPerStremmaPoint[];
  /** Producers grouped by status (LEAD / ACTIVE / INACTIVE). */
  producersByStatus: StatusCountPoint[];
  /** Total stremmata per region, largest first. */
  stremmataByRegion: RegionStremmataPoint[];
  /** Field photos grouped by category. */
  photosByCategory: CategoryCountPoint[];
}

// ─── API helpers ─────────────────────────────────────────────────────────────

export type SortDirection = "asc" | "desc";

export interface TableQueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_dir?: SortDirection;
  [filterKey: string]: string | number | undefined;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface FilterOption {
  key: string;
  label: string;
  options: { value: string; label: string }[];
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}
