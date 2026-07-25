import { useCallback, useEffect, useMemo, useState } from "react";
import { FiGrid, FiPlus, FiUsers } from "react-icons/fi";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { SelectField } from "@/components/ui/SelectField";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { ProducerDetailModal } from "@/components/entities/ProducerDetailModal";
import { FieldDetailModal } from "@/components/entities/FieldDetailModal";
import { FieldFormModal } from "@/components/entities/FieldFormModal";
import { PlantingDetailModal } from "@/components/entities/PlantingDetailModal";
import { useApiLookup } from "@/hooks/useApiLookup";
import { fieldsApi, producersApi } from "@/lib/services";
import { toField, toProducer } from "@/lib/adapters";
import { formatNumber } from "@/lib/utils";
import { varietyLabel, VARIETY_ORDER } from "@/lib/labels";
import type { Field, FilterOption, Variety, VarietyCount } from "@/types";

// ─── Row type ────────────────────────────────────────────────────────────────
// A "planting" is now just the planting-related facet of a Field.

type PlantingRow = {
  id: string;
  field_id: string;
  producer_id: string;
  field_name: string;
  owner_name: string;
  varieties: VarietyCount[];
  tree_count: number;
  comments?: string;
};

/**
 * A field "has planting data" when any planting-related attribute is set: trees
 * of any variety, or planting metadata (date / method / shape / rootstock /
 * spacing). Only such fields appear on this page.
 */
function fieldHasPlantingData(f: Field): boolean {
  return (
    (f.total_plants ?? 0) > 0 ||
    !!f.planting_method ||
    !!f.training_shape ||
    !!f.rootstock ||
    !!f.spacing ||
    !!f.planting_date
  );
}

const toPlantingRow = (f: Field): PlantingRow => ({
  id: f.id,
  field_id: f.id,
  producer_id: f.producer_id,
  field_name: f.location_name,
  owner_name: f.producer_name,
  varieties: f.planting_varieties ?? [],
  tree_count: f.total_plants ?? 0,
  comments: f.comments,
});

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
    ...VARIETY_ORDER.map<Column<PlantingRow>>((v) => ({
      key: `variety_${v}`,
      header: varietyLabel[v],
      width: "minmax(80px, 0.5fr)",
      render: (row) => {
        const count = row.varieties.find((x) => x.variety === v)?.tree_count;
        return count ? (
          <span className="font-medium tabular-nums">{formatNumber(count)}</span>
        ) : (
          <span className="text-gray-400">—</span>
        );
      },
    })),
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
    {
      key: "comments",
      header: "Σχόλια",
      width: "minmax(160px, 1.2fr)",
      render: (row) =>
        row.comments ? (
          <span className="block truncate text-sm text-gray-600">
            {row.comments}
          </span>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
  ];
}

// ─── Filter definitions ─────────────────────────────────────────────────────

const filterDefs: FilterOption[] = [
  {
    key: "variety",
    label: "Ποικιλία",
    options: VARIETY_ORDER.map((v) => ({ value: v, label: varietyLabel[v] })),
  },
];

const PAGE_SIZE = 50;

// ─── Page component ─────────────────────────────────────────────────────────

export function PlantingsListPage() {
  // Plantings are derived from fields, so we load the fields once and filter /
  // sort / paginate client-side (the API has no planting endpoint).
  const [fields, setFields] = useState<Field[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setIsLoading(true);
    setError(null);
    fieldsApi
      .list({ size: 1000, sortBy: "LOCATION_NAME" })
      .then((r) => setFields(r.content.map(toField)))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Fetch failed"),
      )
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ── Table state (client-side) ─────────────────────────────────────────────
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

  const toggleSort = useCallback((columnKey: string) => {
    if (columnKey !== "tree_count") return;
    setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    setPage(1);
  }, []);

  // Fields with planting data → rows, then search / filter / sort.
  const withPlanting = useMemo(
    () => fields.filter(fieldHasPlantingData),
    [fields],
  );

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const variety = filters.variety as Variety | undefined;
    let result = withPlanting.map(toPlantingRow);
    if (q) {
      result = result.filter(
        (r) =>
          r.field_name.toLowerCase().includes(q) ||
          r.owner_name.toLowerCase().includes(q),
      );
    }
    if (variety) {
      result = result.filter((r) =>
        r.varieties.some((x) => x.variety === variety && x.tree_count > 0),
      );
    }
    result.sort((a, b) =>
      sortDir === "asc"
        ? a.tree_count - b.tree_count
        : b.tree_count - a.tree_count,
    );
    return result;
  }, [withPlanting, search, filters, sortDir]);

  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageRows = useMemo(
    () => rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [rows, page],
  );

  // ── Detail modals (owner / field lookups) ─────────────────────────────────
  const owner = useApiLookup(producersApi.get, toProducer);
  const field = useApiLookup(fieldsApi.get, toField);

  // ── Field edit form (adding/adjusting planting data = editing the field) ───
  const [formOpen, setFormOpen] = useState(false);
  const [editingField, setEditingField] = useState<Field | null>(null);

  // ── Read-only planting view ────────────────────────────────────────────────
  const [viewingField, setViewingField] = useState<Field | null>(null);

  // ── "New planting" picker: choose a field that has no planting data yet ────
  const withoutPlanting = useMemo(
    () => fields.filter((f) => !fieldHasPlantingData(f)),
    [fields],
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickFieldId, setPickFieldId] = useState("");

  const openEditForField = (f: Field) => {
    setEditingField(f);
    setFormOpen(true);
  };

  const openViewRow = (row: PlantingRow) => {
    const f = fields.find((x) => x.id === row.field_id);
    if (f) setViewingField(f);
  };

  const openPicker = () => {
    setPickFieldId("");
    setPickerOpen(true);
  };

  const confirmPick = () => {
    const f = fields.find((x) => x.id === pickFieldId);
    if (!f) return;
    setPickerOpen(false);
    openEditForField(f);
  };

  const columns = buildColumns(
    (row) => owner.openById(row.producer_id),
    (row) => field.openById(row.field_id),
  );

  const isEmpty = !isLoading && total === 0 && !search &&
    Object.keys(filters).length === 0;

  return (
    <>
      <PageHeader
        title="Φυτεύσεις"
        description="Στοιχεία φύτευσης ανά χωράφι"
        actions={
          <Button onPress={openPicker}>
            <FiPlus className="h-4 w-4" />
            Νέα Φύτευση
          </Button>
        }
      />

      {isEmpty ? (
        <EmptyState
          icon={FiGrid}
          title="Δεν υπάρχουν φυτεύσεις"
          description="Προσθέστε στοιχεία φύτευσης σε ένα χωράφι για να εμφανιστεί εδώ."
          action={
            <Button onPress={openPicker}>
              <FiPlus className="h-4 w-4" />
              Προσθήκη Φύτευσης
            </Button>
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={pageRows}
          keyExtractor={(row) => row.id}
          onRowClick={openViewRow}
          isLoading={isLoading}
          error={error}
          search={search}
          onSearchChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          searchPlaceholder="Αναζήτηση χωραφιού, παραγωγού…"
          filters={filterDefs}
          activeFilters={filters}
          onFilterChange={setFilter}
          onClearFilters={clearFilters}
          sortBy="tree_count"
          sortDir={sortDir}
          onSort={toggleSort}
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}

      {/* ── Planting view (read-only) → edit routes through the field form ── */}
      <PlantingDetailModal
        field={viewingField}
        onClose={() => setViewingField(null)}
        onEdit={(f) => {
          setViewingField(null);
          openEditForField(f);
        }}
      />

      {/* ── Producer / field detail modals ───────────────────────────────── */}
      <ProducerDetailModal producer={owner.record} onClose={owner.close} />
      <FieldDetailModal field={field.record} onClose={field.close} />

      {/* ── "New planting" → pick a field to edit ────────────────────────── */}
      <Modal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title="Νέα Φύτευση"
        footer={
          <>
            <Button variant="secondary" onPress={() => setPickerOpen(false)}>
              Άκυρο
            </Button>
            <Button onPress={confirmPick} isDisabled={!pickFieldId}>
              Συνέχεια
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-500">
            Τα στοιχεία φύτευσης καταχωρούνται στο ίδιο το χωράφι. Επιλέξτε ένα
            χωράφι χωρίς στοιχεία φύτευσης για να τα συμπληρώσετε.
          </p>
          {withoutPlanting.length === 0 ? (
            <p className="rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-500">
              Όλα τα χωράφια έχουν ήδη στοιχεία φύτευσης. Επιλέξτε ένα από τη
              λίστα για να τα επεξεργαστείτε.
            </p>
          ) : (
            <SelectField
              label="Χωράφι"
              required
              value={pickFieldId}
              onChange={(e) => setPickFieldId(e.target.value)}
            >
              <option value="">— Επιλέξτε χωράφι —</option>
              {withoutPlanting.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.location_name}
                  {f.producer_name ? ` — ${f.producer_name}` : ""}
                </option>
              ))}
            </SelectField>
          )}
        </div>
      </Modal>

      {/* ── Field edit form ──────────────────────────────────────────────── */}
      <FieldFormModal
        open={formOpen}
        field={editingField}
        onClose={() => setFormOpen(false)}
        onSaved={load}
      />
    </>
  );
}
