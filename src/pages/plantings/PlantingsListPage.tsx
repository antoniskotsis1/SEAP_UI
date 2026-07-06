import { useState } from "react";
import { FiGrid, FiPlus, FiUsers } from "react-icons/fi";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { ProducerDetailModal } from "@/components/entities/ProducerDetailModal";
import { FieldDetailModal } from "@/components/entities/FieldDetailModal";
import { PlantingFormModal } from "@/components/entities/PlantingFormModal";
import { useTableQuery } from "@/hooks/useTableQuery";
import { useLookupModal } from "@/hooks/useLookupModal";
import { formatNumber } from "@/lib/utils";
import { varietyLabel, varietyBadge, VARIETY_ORDER } from "@/lib/labels";
import type { Planting, FilterOption, Producer, Field } from "@/types";

// ─── Extended row type ───────────────────────────────────────────────────────

type PlantingRow = Planting & {
  field_name?: string;
  owner_name?: string;
  producer_id?: string;
};

// ─── Column definitions ─────────────────────────────────────────────────────

function buildColumns(
  onOwnerClick: (row: PlantingRow) => void,
  onFieldClick: (row: PlantingRow) => void,
): Column<PlantingRow>[] {
  return [
    {
      key: "field_name",
      header: "Χωράφι / Παραγωγός",
      render: (row) => (
        <div className="min-w-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOwnerClick(row);
            }}
            className="flex gap-1 items-center truncate text-left font-medium text-brand-600 hover:underline"
          >
            <FiUsers className="h-3 w-3 shrink-0" />
            {row.owner_name || "—"}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onFieldClick(row);
            }}
            className="block items-center gap-1 truncate text-left text-xs text-gray-400 hover:text-brand-500"
          >
            {row.field_name || "—"}
          </button>
        </div>
      ),
    },
    {
      key: "varieties",
      header: "Ποικιλίες (δέντρα)",
      width: "minmax(200px, 1.4fr)",
      render: (row) =>
        row.varieties.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {VARIETY_ORDER.filter((v) =>
              row.varieties.some((x) => x.variety === v),
            ).map((v) => {
              const count = row.varieties.find(
                (x) => x.variety === v,
              )!.tree_count;
              return (
                <span
                  key={v}
                  className={`${varietyBadge[v]} inline-flex items-center gap-1`}
                >
                  {varietyLabel[v]}
                  <span className="font-semibold tabular-nums">
                    {formatNumber(count)}
                  </span>
                </span>
              );
            })}
          </div>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
    {
      key: "tree_count",
      header: "Σύνολο",
      sortable: true,
      width: "minmax(80px, 0.5fr)",
      render: (row) => (
        <span className="font-medium tabular-nums">
          {formatNumber(row.tree_count)}
        </span>
      ),
    },
  ];
}

// ─── Filter definitions ─────────────────────────────────────────────────────

const filterDefs: FilterOption[] = [
  {
    key: "variety_keys",
    label: "Ποικιλία",
    options: VARIETY_ORDER.map((v) => ({ value: v, label: varietyLabel[v] })),
  },
];

// ─── Page component ─────────────────────────────────────────────────────────

export function PlantingsListPage() {
  const table = useTableQuery<PlantingRow>({
    endpoint: "/plantings",
    defaultSortBy: "tree_count",
    defaultSortDir: "desc",
  });

  // A `null` editing target means "create"; a row means "edit that planting".
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PlantingRow | null>(null);

  // ── Detail modals (owner / field lookups) ──────────────────────────────────
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

  const openEdit = (row: PlantingRow) => {
    setEditing(row);
    setFormOpen(true);
  };

  return (
    <>
      <PageHeader
        title="Φυτεύσεις"
        description="Διαχείριση φυτεύσεων ανά χωράφι"
        actions={
          <Button onPress={openCreate}>
            <FiPlus className="h-4 w-4" />
            Νέα Φύτευση
          </Button>
        }
      />

      {isEmpty ? (
        <EmptyState
          icon={FiGrid}
          title="Δεν υπάρχουν φυτεύσεις"
          description="Ξεκινήστε καταχωρώντας μια φύτευση."
          action={
            <Button onPress={openCreate}>
              <FiPlus className="h-4 w-4" />
              Προσθήκη Φύτευσης
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
          searchPlaceholder="Αναζήτηση φύτευσης…"
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

      {/* ── Producer detail modal ────────────────────────────────────────── */}
      <ProducerDetailModal producer={owner.record} onClose={owner.close} />

      {/* ── Field detail modal ───────────────────────────────────────────── */}
      <FieldDetailModal field={field.record} onClose={field.close} />

      {/* ── Create / edit planting modal ─────────────────────────────────── */}
      <PlantingFormModal
        open={formOpen}
        planting={editing}
        onClose={() => setFormOpen(false)}
        onSaved={table.refetch}
      />
    </>
  );
}
