import { useState } from "react";
import { FiMap, FiPlus } from "react-icons/fi";
import toast from "react-hot-toast";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { SelectField } from "@/components/ui/SelectField";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { useTableQuery } from "@/hooks/useTableQuery";
import { api } from "@/lib/api";
import { formatNumber, formatDate } from "@/lib/utils";
import type { Field, PlantingMethod, TrainingShape } from "@/types";

// ─── Labels ─────────────────────────────────────────────────────────────────

const methodLabel: Record<PlantingMethod, string> = {
  PLANTING: "Φύτευση",
  GRAFTING: "Εμβολιασμός",
};
const shapeLabel: Record<TrainingShape, string> = {
  FISHBONE: "Ψαροκόκαλο",
  UMBRELLA: "Ομπρέλα",
  OTHER: "Άλλο",
};

// ─── Column definitions ─────────────────────────────────────────────────────

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
          <Button onPress={openModal}>
            <FiPlus className="h-4 w-4" />
            Νέο Χωράφι
          </Button>
        }
      />

      {isEmpty ? (
        <EmptyState
          icon={FiMap}
          title="Δεν υπάρχουν χωράφια"
          description="Ξεκινήστε προσθέτοντας το πρώτο χωράφι."
          action={
            <Button onPress={openModal}>
              <FiPlus className="h-4 w-4" />
              Προσθήκη Χωραφιού
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
            <Button variant="secondary" onPress={() => setModalOpen(false)}>
              Ακύρωση
            </Button>
            <Button onPress={handleSubmit} isDisabled={saving}>
              {saving ? "Αποθήκευση…" : "Δημιουργία"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <TextField
            label="Παραγωγός"
            isRequired
            value={form.business_entity_id}
            onChange={(v) => set("business_entity_id", v)}
            placeholder="ID παραγωγού"
          />

          <TextField
            label="Τοποθεσία"
            isRequired
            value={form.location_name}
            onChange={(v) => set("location_name", v)}
            placeholder="π.χ. Χωράφι Αμαλιάδας"
          />

          <div className="grid grid-cols-2 gap-4">
            <TextField
              label="Στρέμματα"
              value={form.stremmata}
              onChange={(v) => set("stremmata", v)}
              placeholder="π.χ. 12.5"
              inputProps={{ type: "number", step: "0.1" }}
            />
            <TextField
              label="Αρ. Ανάλυσης"
              value={form.analysis_number}
              onChange={(v) => set("analysis_number", v)}
            />
          </div>

          <TextField
            label="GPS Συντεταγμένες"
            value={form.gps_coordinates}
            onChange={(v) => set("gps_coordinates", v)}
            placeholder="π.χ. 37.7950, 21.3700"
          />

          <hr className="border-gray-200" />
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Στοιχεία Φύτευσης
          </p>

          <div className="grid grid-cols-2 gap-4">
            <TextField
              label="Έτος Φύτευσης"
              value={form.planting_year}
              onChange={(v) => set("planting_year", v)}
              inputProps={{ type: "number" }}
            />
            <SelectField
              label="Μέθοδος"
              value={form.planting_method}
              onChange={(e) => set("planting_method", e.target.value)}
            >
              <option value="">—</option>
              <option value="PLANTING">Φύτευση</option>
              <option value="GRAFTING">Εμβολιασμός</option>
            </SelectField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <SelectField
              label="Σχήμα Διαμόρφωσης"
              value={form.training_shape}
              onChange={(e) => set("training_shape", e.target.value)}
            >
              <option value="">—</option>
              <option value="FISHBONE">Ψαροκόκαλο</option>
              <option value="UMBRELLA">Ομπρέλα</option>
              <option value="OTHER">Άλλο</option>
            </SelectField>
            <TextField
              label="Υποκείμενο"
              value={form.rootstock}
              onChange={(v) => set("rootstock", v)}
              placeholder="π.χ. HAYWARD, BOUNTY"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <TextField
              label="Αποστάσεις"
              value={form.spacing}
              onChange={(v) => set("spacing", v)}
              placeholder="π.χ. 5Χ3"
            />
            <TextField
              label="Μήκος (m)"
              value={form.length_m}
              onChange={(v) => set("length_m", v)}
              inputProps={{ type: "number", step: "0.01" }}
            />
            <TextField
              label="Πλάτος (m)"
              value={form.width_m}
              onChange={(v) => set("width_m", v)}
              inputProps={{ type: "number", step: "0.01" }}
            />
          </div>
        </div>
      </Modal>
    </>
  );
}
