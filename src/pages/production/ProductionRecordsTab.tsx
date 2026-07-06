import { useState } from "react";
import { FiBarChart2, FiPlus, FiMap } from "react-icons/fi";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { ProducerDetailModal } from "@/components/entities/ProducerDetailModal";
import { FieldDetailModal } from "@/components/entities/FieldDetailModal";
import { ProductionFormModal } from "@/components/entities/ProductionFormModal";
import { useTableQuery } from "@/hooks/useTableQuery";
import { useLookupModal } from "@/hooks/useLookupModal";
import { formatNumber } from "@/lib/utils";
import type { ProductionRecord, Producer, Field, FilterOption } from "@/types";

// ─── Extended row type ───────────────────────────────────────────────────────

type ProductionRow = ProductionRecord & {
  producer_id?: string;
  field_name?: string;
  owner_name?: string;
};

// ─── Year filter ─────────────────────────────────────────────────────────────

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => String(CURRENT_YEAR - i));

const filterDefs: FilterOption[] = [
  {
    key: "harvest_year",
    label: "Έτος",
    options: YEAR_OPTIONS.map((y) => ({ value: y, label: y })),
  },
];

// ─── Column definitions ─────────────────────────────────────────────────────

function buildColumns(
  onOwnerClick: (row: ProductionRow) => void,
  onFieldClick: (row: ProductionRow) => void,
): Column<ProductionRow>[] {
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
      key: "harvest_year",
      header: "Έτος",
      sortable: true,
      width: "minmax(80px, 0.5fr)",
      render: (row) => (
        <span className="font-medium text-gray-900">{String(row.harvest_year)}</span>
      ),
    },
    {
      key: "ac22_kg",
      header: "AC22 (kg)",
      sortable: true,
      width: "minmax(90px, 0.6fr)",
      render: (row) => (
        <span className="tabular-nums text-gray-900">{formatNumber(row.ac22_kg)}</span>
      ),
    },
    {
      key: "ac76_kg",
      header: "AC76 (kg)",
      sortable: true,
      width: "minmax(90px, 0.6fr)",
      render: (row) => (
        <span className="tabular-nums text-gray-900">{formatNumber(row.ac76_kg)}</span>
      ),
    },
    {
      key: "quantity_kg",
      header: "Σύνολο (kg)",
      sortable: true,
      width: "minmax(90px, 0.6fr)",
      render: (row) => (
        <span className="tabular-nums font-semibold text-gray-900">
          {formatNumber(row.quantity_kg)}
        </span>
      ),
    },
  ];
}

// ─── Tab component ────────────────────────────────────────────────────────────

interface ProductionRecordsTabProps {
  /** `true` renders the estimates list, `false` the actual-production list. */
  isEstimate: boolean;
}

export function ProductionRecordsTab({ isEstimate }: ProductionRecordsTabProps) {
  const table = useTableQuery<ProductionRow>({
    endpoint: "/production",
    staticParams: { is_estimate: String(isEstimate) },
    defaultSortBy: "harvest_year",
    defaultSortDir: "desc",
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ProductionRow | null>(null);

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
  const openEdit = (row: ProductionRow) => {
    setEditing(row);
    setFormOpen(true);
  };

  const noun = isEstimate ? "Εκτίμηση" : "Καταγραφή";

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onPress={openCreate}>
          <FiPlus className="h-4 w-4" />
          Νέα {noun}
        </Button>
      </div>

      {isEmpty ? (
        <EmptyState
          icon={FiBarChart2}
          title={isEstimate ? "Δεν υπάρχουν εκτιμήσεις" : "Δεν υπάρχουν καταγραφές"}
          description={
            isEstimate
              ? "Ξεκινήστε προσθέτοντας μια εκτίμηση παραγωγής."
              : "Ξεκινήστε καταγράφοντας παραγωγή ανά χωράφι."
          }
          action={
            <Button onPress={openCreate}>
              <FiPlus className="h-4 w-4" />
              Νέα {noun}
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

      <ProductionFormModal
        open={formOpen}
        record={editing}
        isEstimate={isEstimate}
        onClose={() => setFormOpen(false)}
        onSaved={table.refetch}
      />
    </div>
  );
}
