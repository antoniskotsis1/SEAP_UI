import { useState } from "react";
import { FiGrid, FiPlus } from "react-icons/fi";
import toast from "react-hot-toast";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { useTableQuery } from "@/hooks/useTableQuery";
import { api } from "@/lib/api";
import { formatNumber } from "@/lib/utils";
import type {
  Planting,
  Variety,
  Sex,
  PlantingMethod,
  TrainingShape,
  FilterOption,
} from "@/types";

// ─── Column definitions ─────────────────────────────────────────────────────

const varietyLabel: Record<Variety, string> = { V22: "V22", V76: "V76" };
const sexLabel: Record<Sex, string> = { FEMALE: "Θηλυκό", MALE: "Αρσενικό" };
const methodLabel: Record<PlantingMethod, string> = {
  PLANTING: "Φύτευση",
  GRAFTING: "Εμβολιασμός",
};
const shapeLabel: Record<TrainingShape, string> = {
  FISHBONE: "Ψαροκόκαλο",
  UMBRELLA: "Ομπρέλα",
  OTHER: "Άλλο",
};

const columns: Column<Planting>[] = [
  {
    key: "variety",
    header: "Ποικιλία",
    sortable: true,
    render: (row) => (
      <span className="badge-blue">{varietyLabel[row.variety]}</span>
    ),
  },
  {
    key: "sex",
    header: "Φύλο",
    render: (row) => sexLabel[row.sex],
  },
  {
    key: "tree_count",
    header: "Δέντρα",
    sortable: true,
    render: (row) => formatNumber(row.tree_count),
  },
  {
    key: "planting_year",
    header: "Έτος Φύτ.",
    sortable: true,
    render: (row) => String(row.planting_year),
  },
  {
    key: "planting_method",
    header: "Μέθοδος",
    render: (row) => methodLabel[row.planting_method],
  },
  {
    key: "training_shape",
    header: "Σχήμα",
    render: (row) => shapeLabel[row.training_shape],
  },
];

// ─── Filter definitions ─────────────────────────────────────────────────────

const filterDefs: FilterOption[] = [
  {
    key: "variety",
    label: "Ποικιλία",
    options: [
      { value: "V22", label: "V22" },
      { value: "V76", label: "V76" },
    ],
  },
  {
    key: "sex",
    label: "Φύλο",
    options: [
      { value: "FEMALE", label: "Θηλυκό" },
      { value: "MALE", label: "Αρσενικό" },
    ],
  },
];

// ─── Initial form state ─────────────────────────────────────────────────────

const emptyForm = {
  field_id: "",
  variety: "V22" as Variety,
  sex: "FEMALE" as Sex,
  tree_count: "",
  planting_year: String(new Date().getFullYear()),
  planting_method: "PLANTING" as PlantingMethod,
  training_shape: "FISHBONE" as TrainingShape,
  rootstock: "",
  spacing: "",
};

// ─── Page component ─────────────────────────────────────────────────────────

export function PlantingsListPage() {
  const table = useTableQuery<Planting>({
    endpoint: "/plantings",
    defaultSortBy: "planting_year",
    defaultSortDir: "desc",
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const isEmpty =
    !table.isLoading &&
    table.total === 0 &&
    !table.search &&
    Object.keys(table.filters).length === 0;

  const openModal = () => {
    setForm(emptyForm);
    setModalOpen(true);
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
    setSaving(true);
    try {
      await api.post("/plantings", {
        ...form,
        tree_count: Number(form.tree_count),
        planting_year: Number(form.planting_year),
      });
      toast.success("Η φύτευση δημιουργήθηκε");
      setModalOpen(false);
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
          <button className="btn-primary" onClick={openModal}>
            <FiPlus className="h-4 w-4" />
            Νέα Φύτευση
          </button>
        }
      />

      {isEmpty ? (
        <EmptyState
          icon={FiGrid}
          title="Δεν υπάρχουν φυτεύσεις"
          description="Ξεκινήστε καταχωρώντας μια φύτευση."
          action={
            <button className="btn-primary" onClick={openModal}>
              <FiPlus className="h-4 w-4" />
              Προσθήκη Φύτευσης
            </button>
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

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Νέα Φύτευση"
        footer={
          <>
            <button
              className="btn-secondary"
              onClick={() => setModalOpen(false)}
            >
              Ακύρωση
            </button>
            <button
              className="btn-primary"
              onClick={handleSubmit}
              disabled={saving}
            >
              {saving ? "Αποθήκευση…" : "Δημιουργία"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">
              Χωράφι <span className="text-red-500">*</span>
            </label>
            <input
              className="input"
              value={form.field_id}
              onChange={(e) => set("field_id", e.target.value)}
              placeholder="ID χωραφιού"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Ποικιλία</label>
              <select
                className="input"
                value={form.variety}
                onChange={(e) => set("variety", e.target.value)}
              >
                <option value="V22">V22</option>
                <option value="V76">V76</option>
              </select>
            </div>
            <div>
              <label className="label">Φύλο</label>
              <select
                className="input"
                value={form.sex}
                onChange={(e) => set("sex", e.target.value)}
              >
                <option value="FEMALE">Θηλυκό</option>
                <option value="MALE">Αρσενικό</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">
                Αριθμός Δέντρων <span className="text-red-500">*</span>
              </label>
              <input
                className="input"
                type="number"
                value={form.tree_count}
                onChange={(e) => set("tree_count", e.target.value)}
                placeholder="π.χ. 500"
              />
            </div>
            <div>
              <label className="label">Έτος Φύτευσης</label>
              <input
                className="input"
                type="number"
                value={form.planting_year}
                onChange={(e) => set("planting_year", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Μέθοδος</label>
              <select
                className="input"
                value={form.planting_method}
                onChange={(e) => set("planting_method", e.target.value)}
              >
                <option value="PLANTING">Φύτευση</option>
                <option value="GRAFTING">Εμβολιασμός</option>
              </select>
            </div>
            <div>
              <label className="label">Σχήμα Διαμόρφωσης</label>
              <select
                className="input"
                value={form.training_shape}
                onChange={(e) => set("training_shape", e.target.value)}
              >
                <option value="FISHBONE">Ψαροκόκαλο</option>
                <option value="UMBRELLA">Ομπρέλα</option>
                <option value="OTHER">Άλλο</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Υποκείμενο</label>
              <input
                className="input"
                value={form.rootstock}
                onChange={(e) => set("rootstock", e.target.value)}
              />
            </div>
            <div>
              <label className="label">Αποστάσεις</label>
              <input
                className="input"
                value={form.spacing}
                onChange={(e) => set("spacing", e.target.value)}
                placeholder="π.χ. 6x6"
              />
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
