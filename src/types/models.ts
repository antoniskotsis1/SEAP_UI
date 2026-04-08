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
  analysis_number?: string;
  created_at: string;
  updated_at: string;
}

export interface Planting {
  id: string;
  field_id: string;
  variety: Variety;
  sex: Sex;
  tree_count: number;
  planting_year: number;
  planting_method: PlantingMethod;
  training_shape: TrainingShape;
  rootstock?: string;
  spacing?: string;
  created_at: string;
  updated_at: string;
}

export interface ProductionRecord {
  id: string;
  planting_id: string;
  harvest_year: number;
  quantity_kg: number;
  is_estimate: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface FinancialTransaction {
  id: string;
  business_entity_id: string;
  type: TransactionType;
  year: number;
  stremmata_covered?: number;
  amount: number;
  invoice_status: InvoiceStatus;
  invoice_notes?: string;
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

/** Query params sent to every list endpoint: GET /api/<entity>?... */
export interface TableQueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_dir?: SortDirection;
  /** Arbitrary filter key-values, e.g. { status: "ACTIVE", type: "BUSINESS" } */
  [filterKey: string]: string | number | undefined;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
}

/** Describes one filter the table toolbar should render */
export interface FilterOption {
  key: string;
  label: string;
  options: { value: string; label: string }[];
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}
