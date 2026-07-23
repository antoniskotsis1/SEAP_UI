import { useCallback, useEffect, useMemo, useState } from "react";
import { FiFolder, FiPlus, FiFile, FiFileText } from "react-icons/fi";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { SettlementFormModal } from "@/components/entities/SettlementFormModal";
import { filesApi } from "@/lib/services";
import {
  groupSettlements,
  settlementFileKind,
  settlementFileComment,
} from "@/lib/settlements";
import type { SettlementGroup } from "@/lib/settlements";
import type { FileDto } from "@/types/api";
import type { FilterOption } from "@/types";

// ─── Year filter ─────────────────────────────────────────────────────────────

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => String(CURRENT_YEAR - i));

const filterDefs: FilterOption[] = [
  {
    key: "year",
    label: "Έτος",
    options: YEAR_OPTIONS.map((y) => ({ value: y, label: y })),
  },
];

const PAGE_SIZE = 50;

// ─── Column definitions ─────────────────────────────────────────────────────

const columns: Column<SettlementGroup>[] = [
  {
    key: "year",
    header: "Έτος",
    sortable: true,
    width: "minmax(80px, 0.5fr)",
    render: (row) => (
      <span className="font-medium text-gray-900">{String(row.year)}</span>
    ),
  },
  {
    key: "files",
    header: "Αρχεία",
    width: "minmax(160px, 1fr)",
    render: (row) => {
      const excel = row.files.filter(
        (f) => settlementFileKind(f) === "EXCEL",
      ).length;
      const pdf = row.files.filter(
        (f) => settlementFileKind(f) === "PDF",
      ).length;
      return (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-medium text-gray-900">
            {row.files.length} {row.files.length === 1 ? "αρχείο" : "αρχεία"}
          </span>
          {excel > 0 && (
            <span className="inline-flex items-center gap-1 text-xs text-green-700">
              <FiFileText className="h-3.5 w-3.5" />
              {excel} Excel
            </span>
          )}
          {pdf > 0 && (
            <span className="inline-flex items-center gap-1 text-xs text-red-600">
              <FiFile className="h-3.5 w-3.5" />
              {pdf} PDF
            </span>
          )}
        </div>
      );
    },
  },
  {
    key: "comments",
    header: "Σχόλια αρχείων",
    width: "minmax(200px, 1.5fr)",
    render: (row) => {
      const notes = row.files.map(settlementFileComment).filter(Boolean);
      return notes.length > 0 ? (
        <span className="block truncate text-sm text-gray-600">
          {notes.join(" · ")}
        </span>
      ) : (
        <span className="text-gray-400">—</span>
      );
    },
  },
];

// ─── Tab component ────────────────────────────────────────────────────────────

export function SettlementsTab() {
  // Settlements are files grouped by year (client-side), since the Files API has
  // no grouping entity.
  const [files, setFiles] = useState<FileDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(() => {
    setIsLoading(true);
    filesApi
      .list({ size: 1000, sortBy: "CREATED_AT", direction: "DESC" })
      .then((r) => setFiles(r.content))
      .catch(() => setFiles([]))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ── Client-side table state ────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);

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
    setSearch("");
    setPage(1);
  }, []);

  const toggleSort = useCallback((col: string) => {
    if (col !== "year") return;
    setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    setPage(1);
  }, []);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    let result = groupSettlements(files);
    if (filters.year) result = result.filter((g) => String(g.year) === filters.year);
    if (q)
      result = result.filter((g) =>
        g.files.some((f) =>
          settlementFileComment(f).toLowerCase().includes(q),
        ),
      );
    result.sort((a, b) =>
      sortDir === "asc" ? a.year - b.year : b.year - a.year,
    );
    return result;
  }, [files, filters, search, sortDir]);

  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageRows = useMemo(
    () => rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [rows, page],
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SettlementGroup | null>(null);

  const isEmpty =
    !isLoading && total === 0 && !search && Object.keys(filters).length === 0;

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (row: SettlementGroup) => {
    setEditing(row);
    setFormOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onPress={openCreate}>
          <FiPlus className="h-4 w-4" />
          Νέα Εκκαθάριση
        </Button>
      </div>

      {isEmpty ? (
        <EmptyState
          icon={FiFolder}
          title="Δεν υπάρχουν εκκαθαρίσεις"
          description="Ανεβάστε τα αρχεία εκκαθάρισης (Excel ή PDF) που καλύπτουν όλα τα χωράφια, ανά έτος."
          action={
            <Button onPress={openCreate}>
              <FiPlus className="h-4 w-4" />
              Νέα Εκκαθάριση
            </Button>
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={pageRows}
          keyExtractor={(row) => String(row.year)}
          onRowClick={openEdit}
          isLoading={isLoading}
          search={search}
          onSearchChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          searchPlaceholder="Αναζήτηση σχολίων…"
          filters={filterDefs}
          activeFilters={filters}
          onFilterChange={setFilter}
          onClearFilters={clearFilters}
          sortBy="year"
          sortDir={sortDir}
          onSort={toggleSort}
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}

      <SettlementFormModal
        open={formOpen}
        settlement={editing}
        onClose={() => setFormOpen(false)}
        onSaved={load}
      />
    </div>
  );
}
