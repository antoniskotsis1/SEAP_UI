import {
  useRef,
  useCallback,
  type ReactNode,
  type CSSProperties,
} from "react";
import { FixedSizeList, type ListChildComponentProps } from "react-window";
import {
  FiSearch,
  FiChevronUp,
  FiChevronDown,
  FiChevronsLeft,
  FiChevronsRight,
  FiChevronLeft,
  FiChevronRight,
  FiX,
  FiAlertCircle,
  FiInbox,
  FiLoader,
} from "react-icons/fi";
import { cn } from "@/lib/utils";
import type { FilterOption, SortDirection } from "@/types";

// ─── Column definition ──────────────────────────────────────────────────────

export interface Column<T> {
  /** Unique key — also used as sort_by param when sortable */
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  /** Allow sorting on this column. Default: false */
  sortable?: boolean;
  /** Tailwind width class, e.g. "w-48" or "min-w-[200px]" */
  className?: string;
}

// ─── Component props ─────────────────────────────────────────────────────────

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  onRowClick?: (row: T) => void;

  // State flags
  isLoading?: boolean;
  error?: string | null;

  // Search
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;

  // Filters
  filters?: FilterOption[];
  activeFilters?: Record<string, string>;
  onFilterChange?: (key: string, value: string) => void;
  onClearFilters?: () => void;

  // Sort
  sortBy?: string | null;
  sortDir?: SortDirection;
  onSort?: (columnKey: string) => void;

  // Pagination
  page?: number;
  pageSize?: number;
  total?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;

  /** Enable react-window virtualization (recommended for 100+ rows). Default: false */
  virtualized?: boolean;
  /** Row height in px when virtualized. Default: 44 */
  rowHeight?: number;
  /** Max visible height in px when virtualized. Default: 600 */
  maxHeight?: number;

  /** Extra element rendered at the right side of the toolbar */
  toolbarExtra?: ReactNode;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const PAGE_SIZE_OPTIONS = [25, 50, 100, 200];
const HEADER_HEIGHT = 40;

// ─── Sub-components ──────────────────────────────────────────────────────────

function SortIndicator({
  active,
  direction,
}: {
  active: boolean;
  direction: SortDirection;
}) {
  return (
    <span className="ml-1 inline-flex flex-col leading-none">
      <FiChevronUp
        className={cn(
          "h-3 w-3 -mb-0.5",
          active && direction === "asc" ? "text-brand-600" : "text-gray-300"
        )}
      />
      <FiChevronDown
        className={cn(
          "h-3 w-3 -mt-0.5",
          active && direction === "desc" ? "text-brand-600" : "text-gray-300"
        )}
      />
    </span>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  isLoading = false,
  error,
  search,
  onSearchChange,
  searchPlaceholder = "Αναζήτηση…",
  filters,
  activeFilters = {},
  onFilterChange,
  onClearFilters,
  sortBy,
  sortDir = "asc",
  onSort,
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
  virtualized = false,
  rowHeight = 44,
  maxHeight = 600,
  toolbarExtra,
}: DataTableProps<T>) {
  const listRef = useRef<FixedSizeList>(null);

  const hasToolbar =
    onSearchChange !== undefined ||
    (filters && filters.length > 0) ||
    toolbarExtra;

  const hasActiveFilters = Object.values(activeFilters).some(Boolean);
  const hasPagination = page !== undefined && totalPages !== undefined;

  // Compute column grid template
  const gridTemplateColumns = columns
    .map(() => "minmax(120px, 1fr)")
    .join(" ");

  // ── Render a single row (shared between virtualized & plain) ─────────

  const renderRowContent = useCallback(
    (row: T, style?: CSSProperties) => {
      const key = keyExtractor(row);
      return (
        <div
          key={key}
          role="row"
          style={{ ...style, display: "grid", gridTemplateColumns }}
          onClick={() => onRowClick?.(row)}
          className={cn(
            "items-center border-b border-gray-100 text-sm min-h-[48px]",
            onRowClick && "cursor-pointer hover:bg-gray-50 active:bg-gray-100",
            "transition-colors"
          )}
        >
          {columns.map((col) => (
            <div
              key={col.key}
              role="cell"
              className={cn("truncate px-4 py-3 text-gray-700", col.className)}
              style={{
                height: virtualized ? rowHeight : undefined,
                display: "flex",
                alignItems: "center",
              }}
            >
              {col.render(row)}
            </div>
          ))}
        </div>
      );
    },
    [
      columns,
      gridTemplateColumns,
      keyExtractor,
      onRowClick,
      rowHeight,
      virtualized,
    ]
  );

  // ── Virtualized row renderer for react-window ────────────────────────

  const VirtualRow = useCallback(
    ({ index, style }: ListChildComponentProps) => {
      const row = data[index];
      if (!row) return null;
      return renderRowContent(row, style);
    },
    [data, renderRowContent]
  );

  // ── Computed list height ──────────────────────────────────────────────

  const listHeight = virtualized
    ? Math.min(data.length * rowHeight, maxHeight)
    : undefined;

  // ── Scroll to top when data changes ──────────────────────────────────

  const prevDataRef = useRef(data);
  if (prevDataRef.current !== data && listRef.current) {
    listRef.current.scrollTo(0);
    prevDataRef.current = data;
  }

  // ─────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────

  return (
    <div className="card overflow-hidden">
      {/* ── Toolbar ────────────────────────────────────────────────── */}
      {hasToolbar && (
        <div className="flex flex-wrap items-center gap-3 border-b border-gray-200 px-4 py-3">
          {/* Search */}
          {onSearchChange && (
            <div className="relative min-w-[220px] flex-1 max-w-sm">
              <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search ?? ""}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="input pl-9 pr-8"
              />
              {search && (
                <button
                  onClick={() => onSearchChange("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-400 hover:text-gray-600"
                >
                  <FiX className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Filter dropdowns */}
          {filters?.map((f) => (
            <select
              key={f.key}
              value={activeFilters[f.key] ?? ""}
              onChange={(e) => onFilterChange?.(f.key, e.target.value)}
              className="input w-auto min-w-[140px]"
            >
              <option value="">{f.label}</option>
              {f.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ))}

          {/* Clear filters */}
          {hasActiveFilters && onClearFilters && (
            <button
              onClick={onClearFilters}
              className="btn-ghost text-xs text-gray-500"
            >
              <FiX className="h-3.5 w-3.5" />
              Καθαρισμός
            </button>
          )}

          {/* Extra actions slot */}
          {toolbarExtra && <div className="ml-auto">{toolbarExtra}</div>}
        </div>
      )}

      {/* ── Error state ────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 px-4 py-3 text-sm text-red-700">
          <FiAlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* ── Table ──────────────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        {/* Header */}
        <div
          role="row"
          className="grid border-b border-gray-200 bg-gray-50"
          style={{ gridTemplateColumns, height: HEADER_HEIGHT }}
        >
          {columns.map((col) => {
            const isSortable = col.sortable && onSort;
            const isActive = sortBy === col.key;
            return (
              <div
                key={col.key}
                role="columnheader"
                onClick={() => isSortable && onSort(col.key)}
                className={cn(
                  "flex items-center gap-1 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500 select-none",
                  isSortable && "cursor-pointer hover:text-gray-700",
                  col.className
                )}
              >
                <span className="truncate">{col.header}</span>
                {isSortable && (
                  <SortIndicator
                    active={isActive}
                    direction={isActive ? sortDir : "asc"}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Body */}
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-sm text-gray-400">
            <FiLoader className="h-4 w-4 animate-spin" />
            Φόρτωση…
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <FiInbox className="mb-2 h-8 w-8" />
            <p className="text-sm">Δεν βρέθηκαν αποτελέσματα</p>
          </div>
        ) : virtualized ? (
          <FixedSizeList
            ref={listRef}
            height={listHeight!}
            itemCount={data.length}
            itemSize={rowHeight}
            width="100%"
            overscanCount={10}
          >
            {VirtualRow}
          </FixedSizeList>
        ) : (
          <div role="rowgroup">
            {data.map((row) => renderRowContent(row))}
          </div>
        )}
      </div>

      {/* ── Pagination footer ──────────────────────────────────────── */}
      {hasPagination && (
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-gray-200 px-4 py-3 text-sm text-gray-600">
          {/* Left: total + page size */}
          <div className="flex items-center gap-3">
            <span>
              {total !== undefined
                ? `${total.toLocaleString("el-GR")} εγγραφές`
                : "—"}
            </span>
            {onPageSizeChange && (
              <select
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                className="input w-auto py-1 text-xs"
              >
                {PAGE_SIZE_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s} / σελ.
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Right: page nav */}
          <div className="flex items-center gap-1">
            <button
              disabled={page <= 1}
              onClick={() => onPageChange?.(1)}
              className="btn-ghost p-1.5 disabled:opacity-30"
              title="Πρώτη σελίδα"
            >
              <FiChevronsLeft className="h-4 w-4" />
            </button>
            <button
              disabled={page <= 1}
              onClick={() => onPageChange?.(page - 1)}
              className="btn-ghost p-1.5 disabled:opacity-30"
              title="Προηγούμενη"
            >
              <FiChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2 text-xs tabular-nums">
              {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages!}
              onClick={() => onPageChange?.(page + 1)}
              className="btn-ghost p-1.5 disabled:opacity-30"
              title="Επόμενη"
            >
              <FiChevronRight className="h-4 w-4" />
            </button>
            <button
              disabled={page >= totalPages!}
              onClick={() => onPageChange?.(totalPages!)}
              className="btn-ghost p-1.5 disabled:opacity-30"
              title="Τελευταία σελίδα"
            >
              <FiChevronsRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
