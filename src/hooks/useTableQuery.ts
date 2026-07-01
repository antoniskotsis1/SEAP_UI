import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "@/lib/api";
import type { SortDirection, TableQueryParams } from "@/types";

interface UseTableQueryOptions {
  endpoint: string;
  defaultPageSize?: number;
  defaultSortBy?: string;
  defaultSortDir?: SortDirection;
  debounceMs?: number;
  defaultFilters?: Record<string, string>;
}

interface UseTableQueryReturn<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  isLoading: boolean;
  error: string | null;

  // Search
  search: string;
  setSearch: (value: string) => void;

  // Sort
  sortBy: string | null;
  sortDir: SortDirection;
  toggleSort: (columnKey: string) => void;

  // Filters
  filters: Record<string, string>;
  setFilter: (key: string, value: string) => void;
  clearFilters: () => void;

  // Pagination
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  totalPages: number;

  // Manual
  refetch: () => void;
}

export function useTableQuery<T>(
  options: UseTableQueryOptions
): UseTableQueryReturn<T> {
  const {
    endpoint,
    defaultPageSize = 50,
    defaultSortBy,
    defaultSortDir = "asc",
    debounceMs = 300,
    defaultFilters,
  } = options;

  const [data, setData] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearchRaw] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState<string | null>(defaultSortBy ?? null);
  const [sortDir, setSortDir] = useState<SortDirection>(defaultSortDir);
  const [filters, setFilters] = useState<Record<string, string>>(defaultFilters ?? {});

  const abortRef = useRef<AbortController | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [search, debounceMs]);

  const setSearch = useCallback((value: string) => {
    setSearchRaw(value);
  }, []);

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

    const params: TableQueryParams = {
      page,
      page_size: pageSize,
      ...filters,
    };
    if (debouncedSearch) params.search = debouncedSearch;
    if (sortBy) {
      params.sort_by = sortBy;
      params.sort_dir = sortDir;
    }

    // Build clean param record for api.list
    const cleanParams: Record<string, string | number> = {};
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== "") cleanParams[k] = v;
    }

    try {
      const result = await api.list<T>(endpoint, cleanParams);
      if (!controller.signal.aborted) {
        setData(result.data);
        setTotal(result.total);
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        setError(err instanceof Error ? err.message : "Fetch failed");
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [endpoint, page, pageSize, debouncedSearch, sortBy, sortDir, filters]);

  useEffect(() => {
    fetchData();
    return () => abortRef.current?.abort();
  }, [fetchData]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

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
