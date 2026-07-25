/**
 * Typed clients for the **real** SEAPP backend, one per implemented resource.
 * These speak the exact contract in `src/api-spec.yaml`:
 *   - camelCase DTOs (see `src/types/api.ts`)
 *   - paginated envelope `{ content, page, size, totalElements, totalPages }`
 *   - pagination/sort params `page` (0-based), `size`, `direction`, `sortBy`
 *   - `PUT` for updates (full replacement)
 *
 * Only Producers, Fields and Productions are served so far; add more as the
 * backend ships them.
 */
import { seappApi } from "@/lib/api";
import type {
  CreateFieldDto,
  CreateIssueDto,
  CreateProducerDto,
  CreateProductionDto,
  EditFieldDto,
  EditIssueDto,
  EditProducerDto,
  EditProductionDto,
  FieldDto,
  FieldFilter,
  FieldSortField,
  FileDto,
  FileFilter,
  FileSortField,
  ImageDto,
  ImageFilter,
  ImageSortField,
  IssueDto,
  IssueFilter,
  IssueSortField,
  PagedResponse,
  PageRequest,
  ProducerDto,
  ProducerFilter,
  ProducerSortField,
  ProductionDto,
  ProductionFilter,
  ProductionSortField,
  UploadImageFields,
} from "@/types/api";

/** List params = pagination/sorting + the resource's optional filters. */
type ListParams<TFilter, TSortField extends string> = PageRequest<TSortField> &
  TFilter;

// ─── Producers ───────────────────────────────────────────────────────────────

export const producersApi = {
  list(params?: ListParams<ProducerFilter, ProducerSortField>) {
    return seappApi.getPaged<ProducerDto>("/producers", params);
  },
  get(id: string) {
    return seappApi.get<ProducerDto>(`/producers/${id}`);
  },
  create(dto: CreateProducerDto) {
    return seappApi.post<ProducerDto>("/producers", dto);
  },
  update(id: string, dto: EditProducerDto) {
    return seappApi.put<ProducerDto>(`/producers/${id}`, dto);
  },
};

// ─── Fields ──────────────────────────────────────────────────────────────────

export const fieldsApi = {
  list(params?: ListParams<FieldFilter, FieldSortField>) {
    return seappApi.getPaged<FieldDto>("/fields", params);
  },
  get(id: string) {
    return seappApi.get<FieldDto>(`/fields/${id}`);
  },
  create(dto: CreateFieldDto) {
    return seappApi.post<FieldDto>("/fields", dto);
  },
  update(id: string, dto: EditFieldDto) {
    return seappApi.put<FieldDto>(`/fields/${id}`, dto);
  },
};

// ─── Productions ─────────────────────────────────────────────────────────────

export const productionsApi = {
  list(params?: ListParams<ProductionFilter, ProductionSortField>) {
    return seappApi.getPaged<ProductionDto>("/productions", params);
  },
  get(id: string) {
    return seappApi.get<ProductionDto>(`/productions/${id}`);
  },
  create(dto: CreateProductionDto) {
    return seappApi.post<ProductionDto>("/productions", dto);
  },
  update(id: string, dto: EditProductionDto) {
    return seappApi.put<ProductionDto>(`/productions/${id}`, dto);
  },
};

// ─── Issues ──────────────────────────────────────────────────────────────────

export const issuesApi = {
  list(params?: ListParams<IssueFilter, IssueSortField>) {
    return seappApi.getPaged<IssueDto>("/issues", params);
  },
  get(id: string) {
    return seappApi.get<IssueDto>(`/issues/${id}`);
  },
  create(dto: CreateIssueDto) {
    return seappApi.post<IssueDto>("/issues", dto);
  },
  update(id: string, dto: EditIssueDto) {
    return seappApi.put<IssueDto>(`/issues/${id}`, dto);
  },
};

// ─── Files (upload + read only) ──────────────────────────────────────────────

export const filesApi = {
  list(params?: ListParams<FileFilter, FileSortField>) {
    return seappApi.getPaged<FileDto>("/files", params);
  },
  get(id: string) {
    return seappApi.get<FileDto>(`/files/${id}`);
  },
  upload(file: File, comments?: string) {
    const form = new FormData();
    form.append("file", file);
    if (comments) form.append("comments", comments);
    return seappApi.postForm<FileDto>("/files", form);
  },
};

// ─── Images (upload + read only) ─────────────────────────────────────────────

export const imagesApi = {
  list(params?: ListParams<ImageFilter, ImageSortField>) {
    return seappApi.getPaged<ImageDto>("/images", params);
  },
  get(id: string) {
    return seappApi.get<ImageDto>(`/images/${id}`);
  },
  upload(file: File, fields: UploadImageFields = {}) {
    const form = new FormData();
    form.append("file", file);
    for (const [key, value] of Object.entries(fields)) {
      if (value) form.append(key, value);
    }
    return seappApi.postForm<ImageDto>("/images", form);
  },
};

// Convenience re-export of the paged envelope for consumers of these clients.
export type { PagedResponse };
