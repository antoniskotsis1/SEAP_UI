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

/** One settlement record per field per year, holding one or more files. */
export interface Settlement {
  id: string;
  field_id: string;
  year: number;
  files: SettlementFile[];
  notes?: string;
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
}

export interface FieldIssue {
  id: string;
  field_id: string;
  title: string;
  description: string;
  severity: IssueSeverity;
  status: IssueStatus;
  reported_at: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
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
