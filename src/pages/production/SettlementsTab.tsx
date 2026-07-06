import { useState } from "react";
import { FiFolder, FiPlus, FiMap, FiFile, FiFileText } from "react-icons/fi";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { ProducerDetailModal } from "@/components/entities/ProducerDetailModal";
import { FieldDetailModal } from "@/components/entities/FieldDetailModal";
import { SettlementFormModal } from "@/components/entities/SettlementFormModal";
import { useTableQuery } from "@/hooks/useTableQuery";
import { useLookupModal } from "@/hooks/useLookupModal";
import type { Settlement, Producer, Field, FilterOption } from "@/types";

// ─── Extended row type ───────────────────────────────────────────────────────

type SettlementRow = Settlement & {
  producer_id?: string;
  field_name?: string;
  owner_name?: string;
  file_count?: number;
};

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

// ─── Column definitions ─────────────────────────────────────────────────────

function buildColumns(
  onOwnerClick: (row: SettlementRow) => void,
  onFieldClick: (row: SettlementRow) => void,
): Column<SettlementRow>[] {
  return [
    {
      key: "owner_name",
      header: "Παραγωγός / Χωράφι",
      render: (row) => (
        <div className="min-w-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOwnerClick(row);
            }}
            className="block truncate text-left font-medium text-brand-600 hover:underline"
          >
            {row.owner_name || "—"}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onFieldClick(row);
            }}
            className="flex items-center gap-1 truncate text-left text-xs text-gray-400 hover:text-brand-500"
          >
            <FiMap className="h-3 w-3 shrink-0" />
            {row.field_name || "—"}
          </button>
        </div>
      ),
    },
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
        const excel = row.files.filter((f) => f.file_type === "EXCEL").length;
        const pdf = row.files.filter((f) => f.file_type === "PDF").length;
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
  ];
}

// ─── Tab component ────────────────────────────────────────────────────────────

export function SettlementsTab() {
  const table = useTableQuery<SettlementRow>({
    endpoint: "/settlements",
    defaultSortBy: "year",
    defaultSortDir: "desc",
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SettlementRow | null>(null);

  const owner = useLookupModal<Producer>("/producers");
  const field = useLookupModal<Field>("/fields");

  const columns = buildColumns(
    (row) => owner.openById(row.producer_id),
    (row) => field.openById(row.field_id),
  );

  const isEmpty =
    !table.isLoading &&
    table.total === 0 &&
    !table.search &&
    Object.keys(table.filters).length === 0;

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (row: SettlementRow) => {
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
          description="Ανεβάστε αρχεία εκκαθάρισης (Excel ή PDF) ανά χωράφι και έτος."
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
          data={table.data}
          keyExtractor={(row) => row.id}
          onRowClick={openEdit}
          isLoading={table.isLoading}
          error={table.error}
          search={table.search}
          onSearchChange={table.setSearch}
          searchPlaceholder="Αναζήτηση χωραφιού, παραγωγού…"
          filters={filterDefs}
          activeFilters={table.filters}
          onFilterChange={table.setFilter}
          onClearFilters={table.clearFilters}
          sortBy={table.sortBy}
          sortDir={table.sortDir}
          onSort={table.toggleSort}
          page={table.page}
          pageSize={table.pageSize}
          total={table.total}
          totalPages={table.totalPages}
          onPageChange={table.setPage}
          onPageSizeChange={table.setPageSize}
        />
      )}

      <ProducerDetailModal producer={owner.record} onClose={owner.close} />
      <FieldDetailModal field={field.record} onClose={field.close} />

      <SettlementFormModal
        open={formOpen}
        settlement={editing}
        onClose={() => setFormOpen(false)}
        onSaved={table.refetch}
      />
    </div>
  );
}
