import { useState } from "react";
import { FiGrid, FiPlus, FiUsers } from "react-icons/fi";
import toast from "react-hot-toast";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { FormModal } from "@/components/ui/FormModal";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { SelectField } from "@/components/ui/SelectField";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { ProducerDetailModal } from "@/components/entities/ProducerDetailModal";
import { FieldDetailModal } from "@/components/entities/FieldDetailModal";
import { useTableQuery } from "@/hooks/useTableQuery";
import { useLookupModal } from "@/hooks/useLookupModal";
import { api } from "@/lib/api";
import { formatNumber } from "@/lib/utils";
import { varietyLabel, sexLabel } from "@/lib/labels";
import type {
  Planting,
  Variety,
  Sex,
  FilterOption,
  Producer,
  Field,
} from "@/types";

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
            onClick={(e) => { e.stopPropagation(); onFieldClick(row); }}
            className="block truncate text-left font-medium text-brand-600 hover:underline"
          >
            {row.field_name || "—"}
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onOwnerClick(row); }}
            className="flex items-center gap-1 truncate text-left text-xs text-gray-400 hover:text-brand-500"
          >
            <FiUsers className="h-3 w-3 shrink-0" />
            {row.owner_name || "—"}
          </button>
        </div>
      ),
    },
    {
      key: "sex",
      header: "Φύλο",
      sortable: true,
      render: (row) => (
        <span className={row.sex === "FEMALE" ? "badge-blue" : "badge-gray"}>
          {sexLabel[row.sex]}
        </span>
      ),
    },
    {
      key: "variety",
      header: "Ποικιλία",
      sortable: true,
      render: (row) =>
        row.variety ? (
          <span className="badge-blue">{varietyLabel[row.variety]}</span>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
    {
      key: "tree_count",
      header: "Δέντρα",
      sortable: true,
      render: (row) => formatNumber(row.tree_count),
    },
  ];
}

// ─── Filter definitions ─────────────────────────────────────────────────────

const filterDefs: FilterOption[] = [
  {
    key: "sex",
    label: "Φύλο",
    options: [
      { value: "FEMALE", label: "Θηλυκό" },
      { value: "MALE", label: "Αρσενικό" },
    ],
  },
  {
    key: "variety",
    label: "Ποικιλία",
    options: [
      { value: "AC22", label: "AC22" },
      { value: "AC76", label: "AC76" },
    ],
  },
];

// ─── Initial form state ─────────────────────────────────────────────────────

const emptyForm = {
  field_id: "",
  sex: "FEMALE" as Sex,
  variety: "AC22" as Variety | "",
  tree_count: "",
};

// ─── Page component ─────────────────────────────────────────────────────────

export function PlantingsListPage() {
  const table = useTableQuery<PlantingRow>({
    endpoint: "/plantings",
    defaultSortBy: "tree_count",
    defaultSortDir: "desc",
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

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
    setForm(emptyForm);
    setCreateOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.field_id.trim()) {
      toast.error("Το χωράφι είναι υποχρεωτικό");
      return;
    }
    if (!form.tree_count) {
      toast.error("Ο αριθμός δέντρων είναι υποχρεωτικός");
      return;
    }
    if (form.sex === "FEMALE" && !form.variety) {
      toast.error("Η ποικιλία είναι υποχρεωτική για θηλυκά δέντρα");
      return;
    }
    setSaving(true);
    try {
      await api.post("/plantings", {
        field_id: form.field_id,
        sex: form.sex,
        variety: form.sex === "FEMALE" ? form.variety : undefined,
        tree_count: Number(form.tree_count),
      });
      toast.success("Η φύτευση δημιουργήθηκε");
      setCreateOpen(false);
      table.refetch();
    } catch {
      toast.error("Αποτυχία δημιουργίας");
    } finally {
      setSaving(false);
    }
  };

  const set = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

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

      {/* ── Create planting modal ────────────────────────────────────────── */}
      <FormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Νέα Φύτευση"
        onSubmit={handleSubmit}
        saving={saving}
      >
        <div className="space-y-4">
          <TextField
            label="Χωράφι"
            isRequired
            value={form.field_id}
            onChange={(v) => set("field_id", v)}
            placeholder="ID χωραφιού"
          />
          <div className="grid grid-cols-2 gap-4">
            <SelectField
              label="Φύλο"
              value={form.sex}
              onChange={(e) => {
                set("sex", e.target.value);
                if (e.target.value === "MALE") set("variety", "");
              }}
            >
              <option value="FEMALE">Θηλυκό</option>
              <option value="MALE">Αρσενικό (επικονιαστής)</option>
            </SelectField>
            {form.sex === "FEMALE" && (
              <SelectField
                label="Ποικιλία"
                required
                value={form.variety}
                onChange={(e) => set("variety", e.target.value)}
              >
                <option value="">—</option>
                <option value="AC22">AC22</option>
                <option value="AC76">AC76</option>
              </SelectField>
            )}
          </div>
          <TextField
            label="Αριθμός Δέντρων"
            isRequired
            value={form.tree_count}
            onChange={(v) => set("tree_count", v)}
            placeholder="π.χ. 500"
            inputProps={{ type: "number" }}
          />
        </div>
      </FormModal>
    </>
  );
}
