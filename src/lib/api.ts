import type { ApiError } from "@/types";
import type { PagedResponse } from "@/types/api";

/**
 * Base path for the SEAPP backend. The server exposes everything under its
 * context path (`server.servlet.context-path: /seappi`). Override per-env with
 * `VITE_API_BASE_URL`.
 */
const SEAPP_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/seappi";

/** Build a query string, skipping `undefined`, `null` and empty-string values. */
function buildQuery(params?: object): string {
  if (!params) return "";
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  }
  return search.toString();
}

class ApiClient {
  constructor(private readonly baseUrl: string) {}

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    // Let the browser set the multipart boundary for FormData bodies; only
    // force JSON content-type for the (default) JSON requests.
    const isFormData =
      typeof FormData !== "undefined" && options.body instanceof FormData;
    const config: RequestInit = {
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        message: `Request failed with status ${response.status}`,
      }));
      throw error;
    }

    if (response.status === 204) return undefined as T;
    return response.json();
  }

  get<T>(endpoint: string) {
    return this.request<T>(endpoint);
  }

  post<T>(endpoint: string, data: unknown) {
    return this.request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /** POST a `multipart/form-data` body (file uploads). */
  postForm<T>(endpoint: string, form: FormData) {
    return this.request<T>(endpoint, { method: "POST", body: form });
  }

  put<T>(endpoint: string, data: unknown) {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  patch<T>(endpoint: string, data: unknown) {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  delete<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: "DELETE" });
  }

  /**
   * Spec-accurate paginated GET — returns the `PagedResponse<T>` envelope
   * (`{ content, page, size, totalElements, totalPages }`). Pass pagination
   * (`page`, `size`, `direction`, `sortBy`) and any filter params together;
   * empty values are dropped.
   */
  getPaged<T>(endpoint: string, params?: object) {
    const query = buildQuery(params);
    return this.request<PagedResponse<T>>(
      query ? `${endpoint}?${query}` : endpoint
    );
  }
}

/** Client for the SEAPP backend (`/seappi`). */
export const seappApi = new ApiClient(SEAPP_BASE_URL);
