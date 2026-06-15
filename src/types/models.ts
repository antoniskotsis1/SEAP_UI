// ─── Enums ───────────────────────────────────────────────────────────────────

export type BusinessEntityType = "INDIVIDUAL" | "BUSINESS";
export type BusinessEntityStatus = "LEAD" | "ACTIVE" | "INACTIVE";

export type Variety = "V22" | "V76";
export type Sex = "FEMALE" | "MALE";
export type PlantingMethod = "PLANTING" | "GRAFTING";
export type TrainingShape = "FISHBONE" | "UMBRELLA" | "OTHER";

export type TransactionType = "PAYMENT" | "DEBT" | "OFFSET";
export type InvoiceStatus = "ISSUED" | "NOT_ISSUED" | "PARTIAL";

export type IssueSeverity = "LOW" | "MEDIUM" | "HIGH";
export type IssueStatus = "OPEN" | "RESOLVED";

// ─── Entities ────────────────────────────────────────────────────────────────

export interface BusinessEntity {
  id: string;
  display_name: string;
  type: BusinessEntityType;
  status: BusinessEntityStatus;
  afm?: string;
  phone?: string;
  email?: string;
  representative_name?: string;
  region?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Field {
  id: string;
  business_entity_id: string;
  location_name: string;
  stremmata?: number;
  gps_coordinates?: string;

  // ── Planting metadata (Excel has these at field-row level) ─────────
  planting_year?: number;
  planting_method?: PlantingMethod;
  training_shape?: TrainingShape;
  rootstock?: string;
  spacing?: string;
  length_m?: number;
  width_m?: number;

  /** Kept as quick-reference; full records live in FieldAnalysis */
  analysis_number?: string;
  created_at: string;
  updated_at: string;
}

/**
 * A tree count bucket within a field for a given variety+sex combination.
 * Variety is ONLY set for FEMALE trees (V22 or V76).
 * MALE trees are pollinators — variety does not apply.
 *
 * Used area (m²) is derived, not stored:
 *   used_area = tree_count * (field.length_m * field.width_m) / 1000
 */
export interface Planting {
  id: string;
  field_id: string;
  sex: Sex;
  /** Required when sex === "FEMALE", must be undefined when sex === "MALE" */
  variety?: Variety;
  tree_count: number;
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

export interface ProductionRecord {
  id: string;
  planting_id: string;
  harvest_year: number;
  quantity_kg: number;
  quantity_clean_kg?: number;
  is_estimate: boolean;
  price_per_kg?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface FinancialTransaction {
  id: string;
  business_entity_id: string;
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
