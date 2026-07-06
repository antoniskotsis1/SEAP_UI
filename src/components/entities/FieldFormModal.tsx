import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { FormModal } from "@/components/ui/FormModal";
import { TextField } from "@/components/ui/TextField";
import { TextAreaField } from "@/components/ui/TextAreaField";
import { SelectField } from "@/components/ui/SelectField";
import { api } from "@/lib/api";
import type {
  Field,
  FieldAnalysisFile,
  PlantingMethod,
  Producer,
  TrainingShape,
} from "@/types";

interface FieldFormModalProps {
  open: boolean;
  /** When provided, the dialog edits this field (PATCH); otherwise it creates one (POST). */
  field?: Field | null;
  onClose: () => void;
  /** Called after a successful create/update so the caller can refetch. */
  onSaved: () => void;
}

type FieldForm = {
  producer_id: string;
  location_name: string;
  region: string;
  stremmata: string;
  gps_coordinates: string;
  planting_date: string;
  planting_method: PlantingMethod | "";
  training_shape: TrainingShape | "";
  rootstock: string;
  spacing: string;
  total_plants: string;
  comments: string;
};

const emptyForm: FieldForm = {
  producer_id: "",
  location_name: "",
  region: "",
  stremmata: "",
  gps_coordinates: "",
  planting_date: "",
  planting_method: "",
  training_shape: "",
  rootstock: "",
  spacing: "",
  total_plants: "",
  comments: "",
};

const toForm = (f: Field): FieldForm => ({
  producer_id: f.producer_id ?? "",
  location_name: f.location_name ?? "",
  region: f.region ?? "",
  stremmata: f.stremmata != null ? String(f.stremmata) : "",
  gps_coordinates: f.gps_coordinates ?? "",
  planting_date: f.planting_date ?? "",
  planting_method: f.planting_method ?? "",
  training_shape: f.training_shape ?? "",
  rootstock: f.rootstock ?? "",
  spacing: f.spacing ?? "",
  total_plants: f.total_plants != null ? String(f.total_plants) : "",
  comments: f.comments ?? "",
});

/**
 * Create/edit dialog for a field. Pass a `field` to edit it (PATCH), or omit
 * it to create a new one (POST). Shared by the list page and the detail
 * modal's edit action.
 */
export function FieldFormModal({
  open,
  field,
  onClose,
  onSaved,
}: FieldFormModalProps) {
  const isEdit = !!field;
  const [form, setForm] = useState<FieldForm>(emptyForm);
  const [analysisFiles, setAnalysisFiles] = useState<File[]>([]);
  const [producers, setProducers] = useState<Producer[]>([]);
  const [saving, setSaving] = useState(false);

  // Producers for the owner dropdown.
  useEffect(() => {
    api
      .list<Producer>("/producers", {
        page_size: 1000,
        sort_by: "display_name",
      })
      .then((r) => setProducers(r.data))
      .catch(() => setProducers([]));
  }, []);

  // Populate (edit) or reset (create) the form each time the dialog opens.
  useEffect(() => {
    if (open) {
      setForm(field ? toForm(field) : emptyForm);
      setAnalysisFiles([]);
    }
  }, [open, field]);

  const set = (key: keyof FieldForm, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    if (!form.location_name.trim()) {
      toast.error("Η τοποθεσία είναι υποχρεωτική");
      return;
    }
    if (!form.producer_id.trim()) {
      toast.error("Ο παραγωγός είναι υποχρεωτικός");
      return;
    }
    const newAnalyses: Partial<FieldAnalysisFile>[] = analysisFiles.map((f) => ({
      file_name: f.name,
      size_bytes: f.size,
    }));
    const analyses = [...(field?.analyses ?? []), ...newAnalyses];
    const payload = {
      producer_id: form.producer_id,
      producer_name:
        producers.find((p) => p.id === form.producer_id)?.display_name,
      location_name: form.location_name,
      region: form.region || undefined,
      stremmata: form.stremmata ? Number(form.stremmata) : undefined,
      gps_coordinates: form.gps_coordinates || undefined,
      analyses: analyses.length ? analyses : undefined,
      planting_date: form.planting_date || undefined,
      planting_method: form.planting_method || undefined,
      training_shape: form.training_shape || undefined,
      rootstock: form.rootstock || undefined,
      spacing: form.spacing || undefined,
      total_plants: form.total_plants ? Number(form.total_plants) : undefined,
      comments: form.comments || undefined,
    };
    setSaving(true);
    try {
      if (isEdit) {
        await api.patch(`/fields/${field.id}`, payload);
        toast.success("Το χωράφι ενημερώθηκε");
      } else {
        await api.post("/fields", payload);
        toast.success("Το χωράφι δημιουργήθηκε");
      }
      onSaved();
      onClose();
    } catch {
      toast.error(isEdit ? "Αποτυχία ενημέρωσης" : "Αποτυχία δημιουργίας");
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={isEdit ? "Επεξεργασία Χωραφιού" : "Νέο Χωράφι"}
      onSubmit={handleSubmit}
      saving={saving}
      submitLabel={isEdit ? "Αποθήκευση" : "Δημιουργία"}
    >
      <div className="space-y-4">
        <SelectField
          label="Παραγωγός"
          required
          value={form.producer_id}
          onChange={(e) => set("producer_id", e.target.value)}
        >
          <option value="">— Επιλέξτε παραγωγό —</option>
          {producers.map((p) => (
            <option key={p.id} value={p.id}>
              {p.display_name}
            </option>
          ))}
        </SelectField>

        <div className="grid grid-cols-2 gap-4">
          <TextField
            label="Τοποθεσία"
            isRequired
            value={form.location_name}
            onChange={(v) => set("location_name", v)}
            placeholder="π.χ. Χωράφι Αμαλιάδας"
          />
          <TextField
            label="Περιοχή"
            value={form.region}
            onChange={(v) => set("region", v)}
            placeholder="π.χ. Άρτα"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <TextField
            label="Στρέμματα"
            value={form.stremmata}
            onChange={(v) => set("stremmata", v)}
            placeholder="π.χ. 12.5"
            inputProps={{ type: "number", step: "0.1" }}
          />
          <TextField
            label="Αρ. Δέντρων"
            value={form.total_plants}
            onChange={(v) => set("total_plants", v)}
            placeholder="π.χ. 320"
            inputProps={{ type: "number", step: "1", min: "0" }}
          />
        </div>

        <TextField
          label="GPS Συντεταγμένες"
          value={form.gps_coordinates}
          onChange={(v) => set("gps_coordinates", v)}
          placeholder={`"π.χ. 39°07'25.4N 20°55'11.1E"`}
        />

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Αναλύσεις (Excel)
          </label>
          {isEdit && field?.analyses && field.analyses.length > 0 && (
            <ul className="mb-2 space-y-1 text-sm text-gray-600">
              {field.analyses.map((a) => (
                <li key={a.id}>{a.file_name}</li>
              ))}
            </ul>
          )}
          <input
            type="file"
            multiple
            accept=".xls,.xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            onChange={(e) => setAnalysisFiles(Array.from(e.target.files ?? []))}
            className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100"
          />
          {analysisFiles.length > 0 && (
            <ul className="mt-2 space-y-1 text-sm text-gray-600">
              {analysisFiles.map((f, i) => (
                <li key={`${f.name}-${i}`}>{f.name}</li>
              ))}
            </ul>
          )}
        </div>

        <hr className="border-gray-200" />
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          Στοιχεία Φύτευσης
        </p>

        <div className="grid grid-cols-2 gap-4">
          <TextField
            label="Ημερομηνία Φύτευσης"
            value={form.planting_date}
            onChange={(v) => set("planting_date", v)}
            inputProps={{ type: "date" }}
          />
          <SelectField
            label="Μέθοδος"
            value={form.planting_method}
            onChange={(e) => set("planting_method", e.target.value)}
          >
            <option value="">—</option>
            <option value="PLANTING">Φύτευση</option>
            <option value="GRAFTING">Εμβολιασμός</option>
            <option value="MIX">Μεικτό</option>
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
            <option value="MIX">Μεικτό</option>
            <option value="OTHER">Άλλο</option>
          </SelectField>
          <TextField
            label="Υποκείμενο"
            value={form.rootstock}
            onChange={(v) => set("rootstock", v)}
            placeholder="π.χ. HAYWARD, BOUNTY"
          />
        </div>

        <TextField
          label="Αποστάσεις Φύτευσης"
          value={form.spacing}
          onChange={(v) => set("spacing", v)}
          placeholder="π.χ. 4x3"
        />

        <hr className="border-gray-200" />

        <TextAreaField
          label="Σχόλια"
          value={form.comments}
          onChange={(v) => set("comments", v)}
          placeholder="Πρόσθετες σημειώσεις για το χωράφι…"
        />
      </div>
    </FormModal>
  );
}
