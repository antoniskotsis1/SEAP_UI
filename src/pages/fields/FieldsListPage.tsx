import { useState } from "react";
import { FiMap, FiPlus } from "react-icons/fi";
import toast from "react-hot-toast";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { useTableQuery } from "@/hooks/useTableQuery";
import { api } from "@/lib/api";
import { formatNumber, formatDate } from "@/lib/utils";
import type { Field, PlantingMethod, TrainingShape } from "@/types";

// ─── Column definitions ─────────────────────────────────────────────────────

const methodLabel: Record<PlantingMethod, string> = {
  PLANTING: "Φύτευση",
  GRAFTING: "Εμβολιασμός",
};
const shapeLabel: Record<TrainingShape, string> = {
  FISHBONE: "Ψαροκόκαλο",
  UMBRELLA: "Ομπρέλα",
  OTHER: "Άλλο",
};

const columns: Column<Field>[] = [
  {
    key: "location_name",
    header: "Τοποθεσία",
    sortable: true,
    render: (row) => (
      <span className="font-medium text-gray-900">{row.location_name}</span>
    ),
  },
  {
    key: "stremmata",
    header: "Στρέμματα",
    sortable: true,
    render: (row) => formatNumber(row.stremmata),
  },
  {
    key: "planting_year",
    header: "Έτος Φύτ.",
    sortable: true,
    render: (row) => (row.planting_year ? String(row.planting_year) : "—"),
  },
  {
    key: "planting_method",
    header: "Μέθοδος",
    render: (row) =>
      row.planting_method ? methodLabel[row.planting_method] : "—",
  },
  {
    key: "training_shape",
    header: "Σχήμα",
    render: (row) =>
      row.training_shape ? shapeLabel[row.training_shape] : "—",
  },
  {
    key: "rootstock",
    header: "Υποκείμενο",
    render: (row) => row.rootstock || "—",
  },
  {
    key: "spacing",
    header: "Αποστάσεις",
    render: (row) => row.spacing || "—",
  },
  {
    key: "created_at",
    header: "Δημιουργία",
    sortable: true,
    render: (row) => formatDate(row.created_at),
  },
];

// ─── Initial form state ─────────────────────────────────────────────────────

const emptyForm = {
  business_entity_id: "",
  location_name: "",
  stremmata: "",
  gps_coordinates: "",
  analysis_number: "",
  planting_year: "",
  planting_method: "" as PlantingMethod | "",
  training_shape: "" as TrainingShape | "",
  rootstock: "",
  spacing: "",
  length_m: "",
  width_m: "",
};

// ─── Page component ─────────────────────────────────────────────────────────

export function FieldsListPage() {
  const table = useTableQuery<Field>({
    endpoint: "/fields",
    defaultSortBy: "location_name",
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
    if (!form.location_name.trim()) {
      toast.error("Η τοποθεσία είναι υποχρεωτική");
      return;
    }
    if (!form.business_entity_id.trim()) {
      toast.error("Ο παραγωγός είναι υποχρεωτικός");
      return;
    }
    setSaving(true);
    try {
      await api.post("/fields", {
        business_entity_id: form.business_entity_id,
        location_name: form.location_name,
        stremmata: form.stremmata ? Number(form.stremmata) : undefined,
        gps_coordinates: form.gps_coordinates || undefined,
        analysis_number: form.analysis_number || undefined,
        planting_year: form.planting_year ? Number(form.planting_year) : undefined,
        planting_method: form.planting_method || undefined,
        training_shape: form.training_shape || undefined,
        rootstock: form.rootstock || undefined,
        spacing: form.spacing || undefined,
        length_m: form.length_m ? Number(form.length_m) : undefined,
        width_m: form.width_m ? Number(form.width_m) : undefined,
      });
      toast.success("Το χωράφι δημιουργήθηκε");
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
        title="Χωράφια"
        description="Διαχείριση χωραφιών και τοποθεσιών"
        actions={
          <button className="btn-primary" onClick={openModal}>
            <FiPlus className="h-4 w-4" />
            Νέο Χωράφι
          </button>
        }
      />

      {isEmpty ? (
        <EmptyState
          icon={FiMap}
          title="Δεν υπάρχουν χωράφια"
          description="Ξεκινήστε προσθέτοντας το πρώτο χωράφι."
          action={
            <button className="btn-primary" onClick={openModal}>
              <FiPlus className="h-4 w-4" />
              Προσθήκη Χωραφιού
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
          searchPlaceholder="Αναζήτηση τοποθεσίας…"
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
        title="Νέο Χωράφι"
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
              Παραγωγός <span className="text-red-500">*</span>
            </label>
            <input
              className="input"
              value={form.business_entity_id}
              onChange={(e) => set("business_entity_id", e.target.value)}
              placeholder="ID παραγωγού"
            />
          </div>

          <div>
            <label className="label">
              Τοποθεσία <span className="text-red-500">*</span>
            </label>
            <input
              className="input"
              value={form.location_name}
              onChange={(e) => set("location_name", e.target.value)}
              placeholder="π.χ. Χωράφι Αμαλιάδας"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Στρέμματα</label>
              <input
                className="input"
                type="number"
                step="0.1"
                value={form.stremmata}
                onChange={(e) => set("stremmata", e.target.value)}
                placeholder="π.χ. 12.5"
              />
            </div>
            <div>
              <label className="label">Αρ. Ανάλυσης</label>
              <input
                className="input"
                value={form.analysis_number}
                onChange={(e) => set("analysis_number", e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="label">GPS Συντεταγμένες</label>
            <input
              className="input"
              value={form.gps_coordinates}
              onChange={(e) => set("gps_coordinates", e.target.value)}
              placeholder="π.χ. 37.7950, 21.3700"
            />
          </div>

          <hr className="border-gray-200" />
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Στοιχεία Φύτευσης
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Έτος Φύτευσης</label>
              <input
                className="input"
                type="number"
                value={form.planting_year}
                onChange={(e) => set("planting_year", e.target.value)}
              />
            </div>
            <div>
              <label className="label">Μέθοδος</label>
              <select
                className="input"
                value={form.planting_method}
                onChange={(e) => set("planting_method", e.target.value)}
              >
                <option value="">—</option>
                <option value="PLANTING">Φύτευση</option>
                <option value="GRAFTING">Εμβολιασμός</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Σχήμα Διαμόρφωσης</label>
              <select
                className="input"
                value={form.training_shape}
                onChange={(e) => set("training_shape", e.target.value)}
              >
                <option value="">—</option>
                <option value="FISHBONE">Ψαροκόκαλο</option>
                <option value="UMBRELLA">Ομπρέλα</option>
                <option value="OTHER">Άλλο</option>
              </select>
            </div>
            <div>
              <label className="label">Υποκείμενο</label>
              <input
                className="input"
                value={form.rootstock}
                onChange={(e) => set("rootstock", e.target.value)}
                placeholder="π.χ. HAYWARD, BOUNTY"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Αποστάσεις</label>
              <input
                className="input"
                value={form.spacing}
                onChange={(e) => set("spacing", e.target.value)}
                placeholder="π.χ. 5Χ3"
              />
            </div>
            <div>
              <label className="label">Μήκος (m)</label>
              <input
                className="input"
                type="number"
                step="0.01"
                value={form.length_m}
                onChange={(e) => set("length_m", e.target.value)}
              />
            </div>
            <div>
              <label className="label">Πλάτος (m)</label>
              <input
                className="input"
                type="number"
                step="0.01"
                value={form.width_m}
                onChange={(e) => set("width_m", e.target.value)}
              />
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
