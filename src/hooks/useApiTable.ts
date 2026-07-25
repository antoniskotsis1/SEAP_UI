import { useState, useEffect, useCallback, useRef } from "react";
import { seappApi } from "@/lib/api";
import type { SortDirection } from "@/types";

/**
 * Table-state hook for the SEAPP API. Exposes the shape `DataTable` expects,
 * and speaks the backend contract: zero-based `page`, `size`, `direction`
 * (ASC/DESC), enum `sortBy`, and the `PagedResponse` envelope. DTOs are mapped
 * to internal models via `adapt` at the boundary.
 *
 * The API has no free-text search endpoint, so the search box is wired to a
 * single string filter (`searchFilterKey`, e.g. `name` / `locationName`).
 */
interface UseApiTableOptions<TDto, TItem> {
  /** Resource path under the API base, e.g. "/producers". */
  endpoint: string;
  /** Map one API DTO to the internal model the table renders. */
  adapt: (dto: TDto) => TItem;
  /** Column key → API `sortBy` enum. Columns absent here aren't server-sortable. */
  sortColumnMap?: Record<string, string>;
  /** Filter param this table's search box maps to (server-side substring filter). */
  searchFilterKey?: string;
  defaultPageSize?: number;
  /** Initial sort column key (must exist in `sortColumnMap`). */
  defaultSortBy?: string;
  defaultSortDir?: SortDirection;
  debounceMs?: number;
  defaultFilters?: Record<string, string>;
  /** Params always sent and never cleared by `clearFilters`. */
  staticParams?: Record<string, string | number>;
}

interface UseApiTableReturn<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  isLoading: boolean;
  error: string | null;

  search: string;
  setSearch: (value: string) => void;

  sortBy: string | null;
  sortDir: SortDirection;
  toggleSort: (columnKey: string) => void;

  filters: Record<string, string>;
  setFilter: (key: string, value: string) => void;
  clearFilters: () => void;

  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  totalPages: number;

  refetch: () => void;
}

export function useApiTable<TDto, TItem>(
  options: UseApiTableOptions<TDto, TItem>
): UseApiTableReturn<TItem> {
  const {
    endpoint,
    adapt,
    sortColumnMap,
    searchFilterKey,
    defaultPageSize = 50,
    defaultSortBy,
    defaultSortDir = "asc",
    debounceMs = 300,
    defaultFilters,
    staticParams,
  } = options;

  // Stable keys so inline object literals don't re-trigger fetches.
  const staticParamsKey = JSON.stringify(staticParams ?? {});
  const sortMapKey = JSON.stringify(sortColumnMap ?? {});

  const [data, setData] = useState<TItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1); // 1-based for DataTable; sent 0-based
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearchRaw] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState<string | null>(defaultSortBy ?? null);
  const [sortDir, setSortDir] = useState<SortDirection>(defaultSortDir);
  const [filters, setFilters] = useState<Record<string, string>>(
    defaultFilters ?? {}
  );

  const abortRef = useRef<AbortController | null>(null);
  const adaptRef = useRef(adapt);
  adaptRef.current = adapt;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [search, debounceMs]);

  const setSearch = useCallback((value: string) => setSearchRaw(value), []);

  const toggleSort = useCallback(
    (columnKey: string) => {
      if (sortBy === columnKey) {
        setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
      } else {
        setSortBy(columnKey);
        setSortDir("asc");
      }
      setPage(1);
    },
    [sortBy]
  );

  const setFilter = useCallback((key: string, value: string) => {
    setFilters((prev) => {
      if (!value) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: value };
    });
    setPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
    setSearchRaw("");
    setPage(1);
  }, []);

  const fetchData = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setError(null);

    const sortMap = JSON.parse(sortMapKey) as Record<string, string>;
    const params: Record<string, string | number> = {
      page: page - 1, // API is zero-based
      size: pageSize,
      ...(JSON.parse(staticParamsKey) as Record<string, string | number>),
      ...filters,
    };
    if (searchFilterKey && debouncedSearch) {
      params[searchFilterKey] = debouncedSearch;
    }
    const apiSortField = sortBy ? sortMap[sortBy] : undefined;
    if (apiSortField) {
      params.sortBy = apiSortField;
      params.direction = sortDir === "asc" ? "ASC" : "DESC";
    }

    try {
      const result = await seappApi.getPaged<TDto>(endpoint, params);
      if (!controller.signal.aborted) {
        setData(result.content.map((dto) => adaptRef.current(dto)));
        setTotal(result.totalElements);
        setTotalPages(Math.max(1, result.totalPages));
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        const message =
          err && typeof err === "object" && "message" in err
            ? String((err as { message: unknown }).message)
            : "Fetch failed";
        setError(message);
      }
    } finally {
      if (!controller.signal.aborted) setIsLoading(false);
    }
  }, [
    endpoint,
    page,
    pageSize,
    debouncedSearch,
    searchFilterKey,
    sortBy,
    sortDir,
    filters,
    staticParamsKey,
    sortMapKey,
  ]);

  useEffect(() => {
    fetchData();
    return () => abortRef.current?.abort();
  }, [fetchData]);

  return {
    data,
    total,
    page,
    pageSize,
    isLoading,
    error,
    search,
    setSearch,
    sortBy,
    sortDir,
    toggleSort,
    filters,
    setFilter,
    clearFilters,
    setPage,
    setPageSize,
    totalPages,
    refetch: fetchData,
  };
}
