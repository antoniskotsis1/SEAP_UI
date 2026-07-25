/**
 * Spec-accurate types for the **real** SEAPP backend, mirroring `src/api-spec.yaml`
 * (SEAPP API v1.0.0). These are the camelCase DTOs the server actually speaks.
 *
 * Scope: only the resources implemented so far — Producers, Fields, Productions.
 * As more of the API ships, extend this file (and `src/lib/services.ts`).
 *
 * Note: these deliberately live apart from `src/types/models.ts` (the app's
 * internal snake_case domain used by the still-mocked pages). The migration of
 * pages/forms/mock onto these DTOs is a follow-up.
 *
 * Domain note — **Production is a per-year kg yield of the two fruit varieties
 * (AC22 + AC76), with an `isEstimate` flag** distinguishing actual production
 * from an estimate. One record per field per year per kind. Matches the internal
 * `ProductionRecord` in models.ts.
 */

// ─── Pagination ──────────────────────────────────────────────────────────────

export type SortDirection = "ASC" | "DESC";

/** Envelope returned by every list endpoint. `page` is zero-based. */
export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

/** Common pagination / sorting query params. */
export interface PageRequest<TSortField extends string = string> {
  /** Zero-based page index (default 0). */
  page?: number;
  /** Page size (default 20). */
  size?: number;
  /** Sort direction (default ASC). Only applied when `sortBy` is set. */
  direction?: SortDirection;
  sortBy?: TSortField;
}

// ─── Error bodies ────────────────────────────────────────────────────────────

/** Body of a 400: map of `fieldName -> error message`. */
export type ValidationErrorResponse = Record<string, string>;
/** Body of a 404. */
export interface NotFoundResponse {
  message: string;
}

// ─── Producers ───────────────────────────────────────────────────────────────

export type ProducerStatus = "LEAD" | "ACTIVE" | "INACTIVE";
export type ProducerSortField =
  | "NAME"
  | "SURNAME"
  | "REGION"
  | "CREATED_AT"
  | "UPDATED_AT";

export interface CreateProducerDto {
  name: string;
  surname: string;
  status: ProducerStatus;
  taxIdentificationNumber?: string | null;
  phone?: string | null;
  email?: string | null;
  representativeName?: string | null;
  region?: string | null;
  notes?: string | null;
}

/** Full-replacement update; same shape as create. */
export type EditProducerDto = CreateProducerDto;

export interface ProducerDto {
  id: string;
  name: string;
  surname: string;
  status: ProducerStatus;
  taxIdentificationNumber?: string | null;
  phone?: string | null;
  email?: string | null;
  representativeName?: string | null;
  region?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Optional `GET /producers` filters (null/omitted means "don't filter"). */
export interface ProducerFilter {
  name?: string;
  surname?: string;
  status?: ProducerStatus;
  taxIdentificationNumber?: string;
  phone?: string;
  email?: string;
  representativeName?: string;
  region?: string;
  notes?: string;
}

// ─── Fields ──────────────────────────────────────────────────────────────────

export type PlantingMethod = "PLANTING" | "GRAFTING" | "MIX";
export type TrainingShape = "FISHBONE" | "UMBRELLA" | "OTHER" | "MIX";
export type FieldSortField =
  | "LOCATION_NAME"
  | "REGION"
  | "AREA"
  | "TOTAL_TREES"
  | "PLANTING_DATE"
  | "CREATED_AT"
  | "UPDATED_AT";

export interface CreateFieldDto {
  producerId: string;
  locationName: string;
  region?: string | null;
  /** Area in stremmata. */
  area?: number | null;
  gpsCoordinates?: string | null;
  comments?: string | null;
  /** ISO-8601 LocalDate (YYYY-MM-DD). */
  plantingDate?: string | null;
  plantingMethod?: PlantingMethod | null;
  trainingShape?: TrainingShape | null;
  rootstock?: string | null;
  spacing?: string | null;
  maleCount?: number;
  ac22Count?: number;
  ac76Count?: number;
}

/** Full-replacement update; same shape as create. */
export type EditFieldDto = CreateFieldDto;

export interface FieldDto {
  id: string;
  producerId: string;
  /** Resolved from the Producer module (may be null). */
  producerName?: string | null;
  locationName: string;
  region?: string | null;
  area?: number | null;
  gpsCoordinates?: string | null;
  comments?: string | null;
  plantingDate?: string | null;
  plantingMethod?: PlantingMethod | null;
  trainingShape?: TrainingShape | null;
  rootstock?: string | null;
  spacing?: string | null;
  maleCount: number;
  ac22Count: number;
  ac76Count: number;
  /** Derived: maleCount + ac22Count + ac76Count. */
  totalTrees: number;
  createdAt: string;
  updatedAt: string;
}

/** Optional `GET /fields` filters. */
export interface FieldFilter {
  producerId?: string;
  locationName?: string;
  region?: string;
  plantingMethod?: PlantingMethod;
  trainingShape?: TrainingShape;
  rootstock?: string;
}

// ─── Productions (per-year kg yield; actual or estimate) ─────────────────────

export type ProductionSortField =
  | "YEAR"
  | "TOTAL_TREES"
  | "IS_ESTIMATION"
  | "CREATED_AT"
  | "UPDATED_AT";

export interface CreateProductionDto {
  fieldId: string;
  /** 1900–2100. */
  year: number;
  /** Yield of AC22 in kg. */
  ac22Kg?: number;
  /** Yield of AC76 in kg. */
  ac76Kg?: number;
  /** `false` → actual production, `true` → estimate. Defaults to false. */
  isEstimation?: boolean;
}

/** Full-replacement update; same shape as create. */
export type EditProductionDto = CreateProductionDto;

export interface ProductionDto {
  id: string;
  fieldId: string;
  year: number;
  ac22Kg: number;
  ac76Kg: number;
  /** Derived tree count carried from the field (not a kg total). */
  totalTrees: number;
  isEstimation: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Optional `GET /productions` filters. */
export interface ProductionFilter {
  fieldId?: string;
  year?: number;
  /** Separate actual production (`false`) from estimates (`true`). */
  isEstimation?: boolean;
}

// ─── Issues ──────────────────────────────────────────────────────────────────

export type IssueSeverity = "LOW" | "MEDIUM" | "HIGH";
export type IssueState = "OPEN" | "IN_PROGRESS" | "CLOSED" | "OBSOLETE";
export type IssueSortField =
  | "TITLE"
  | "SEVERITY"
  | "STATE"
  | "CREATED_AT"
  | "UPDATED_AT";

export interface CreateIssueDto {
  /** Optional field this issue relates to. */
  fieldId?: string | null;
  title: string;
  description?: string | null;
  severity: IssueSeverity;
  state: IssueState;
}

/** Full-replacement update; same shape as create. */
export type EditIssueDto = CreateIssueDto;

export interface IssueDto {
  id: string;
  fieldId?: string | null;
  title: string;
  description?: string | null;
  severity: IssueSeverity;
  state: IssueState;
  createdAt: string;
  updatedAt: string;
}

/** Optional `GET /issues` filters. */
export interface IssueFilter {
  fieldId?: string;
  title?: string;
  severity?: IssueSeverity;
  state?: IssueState;
}

// ─── Files (generic binary assets; upload + read only) ───────────────────────

export type FileSortField =
  | "ORIGINAL_FILENAME"
  | "CONTENT_TYPE"
  | "SIZE_BYTES"
  | "CREATED_AT"
  | "UPDATED_AT";

export interface FileDto {
  id: string;
  contentType: string;
  sizeBytes: number;
  originalFilename: string;
  comments?: string | null;
  /** Presigned download URL (time-limited). */
  url: string;
  createdAt: string;
  updatedAt: string;
}

export interface FileFilter {
  originalFilename?: string;
  contentType?: string;
  comments?: string;
}

// ─── Images (optionally linked to a field / producer / issue) ────────────────

export type ImageSortField =
  | "SIZE_BYTES"
  | "CATEGORY"
  | "CREATED_AT"
  | "UPDATED_AT";

export interface ImageDto {
  id: string;
  fieldId?: string | null;
  producerId?: string | null;
  issueId?: string | null;
  contentType: string;
  sizeBytes: number;
  originalFilename: string;
  category?: string | null;
  notes?: string | null;
  /** Presigned download URL (time-limited). */
  url: string;
  createdAt: string;
  updatedAt: string;
}

export interface ImageFilter {
  fieldId?: string;
  producerId?: string;
  issueId?: string;
  category?: string;
}

/** Multipart fields accepted alongside the binary on `POST /images`. */
export interface UploadImageFields {
  fieldId?: string;
  producerId?: string;
  issueId?: string;
  category?: string;
  notes?: string;
}
