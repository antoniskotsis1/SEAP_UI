import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { FormModal } from "@/components/ui/FormModal";
import { TextField } from "@/components/ui/TextField";
import { TextAreaField } from "@/components/ui/TextAreaField";
import { SelectField } from "@/components/ui/SelectField";
import { ModalTitle } from "@/components/ui/ModalTitle";
import { FiMap } from "react-icons/fi";
import { fieldsApi, producersApi } from "@/lib/services";
import { toProducer } from "@/lib/adapters";
import type { CreateFieldDto } from "@/types/api";
import type {
  Field,
  PlantingMethod,
  Producer,
  TrainingShape,
  Variety,
} from "@/types";

interface FieldFormModalProps {
  open: boolean;
  /** When provided, the dialog edits this field (PUT); otherwise it creates one (POST). */
  field?: Field | null;
  onClose: () => void;
  /** Called after a successful create/update so the caller can refetch. */
  onSaved: () => void;
}

type FieldForm = {
  producer_id: string;
  location_name: string;
  region: string;
  area: string;
  gps_coordinates: string;
  planting_date: string;
  planting_method: PlantingMethod | "";
  training_shape: TrainingShape | "";
  rootstock: string;
  spacing: string;
  male_count: string;
  ac22_count: string;
  ac76_count: string;
  comments: string;
};

const emptyForm: FieldForm = {
  producer_id: "",
  location_name: "",
  region: "",
  area: "",
  gps_coordinates: "",
  planting_date: "",
  planting_method: "",
  training_shape: "",
  rootstock: "",
  spacing: "",
  male_count: "",
  ac22_count: "",
  ac76_count: "",
  comments: "",
};

/** Per-variety tree count from the field's `planting_varieties` (0 when absent). */
const countOf = (f: Field, variety: Variety): string => {
  const n = f.planting_varieties?.find((v) => v.variety === variety)?.tree_count;
  return n ? String(n) : "";
};

const toForm = (f: Field): FieldForm => ({
  producer_id: f.producer_id ?? "",
  location_name: f.location_name ?? "",
  region: f.region ?? "",
  area: f.stremmata != null ? String(f.stremmata) : "",
  gps_coordinates: f.gps_coordinates ?? "",
  planting_date: f.planting_date ?? "",
  planting_method: f.planting_method ?? "",
  training_shape: f.training_shape ?? "",
  rootstock: f.rootstock ?? "",
  spacing: f.spacing ?? "",
  male_count: countOf(f, "MALE"),
  ac22_count: countOf(f, "AC22"),
  ac76_count: countOf(f, "AC76"),
  comments: f.comments ?? "",
});

/** Parse a non-negative integer count field; empty → 0. */
const toCount = (value: string): number => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : 0;
};

/**
 * Create/edit dialog for a field. Pass a `field` to edit it (PUT), or omit it
 * to create a new one (POST). Shared by the list page and the detail modal's
 * edit action.
 */
export function FieldFormModal({
  open,
  field,
  onClose,
  onSaved,
}: FieldFormModalProps) {
  const isEdit = !!field;
  const [form, setForm] = useState<FieldForm>(emptyForm);
  const [producers, setProducers] = useState<Producer[]>([]);
  const [saving, setSaving] = useState(false);

  // Producers for the owner dropdown.
  useEffect(() => {
    producersApi
      .list({ size: 1000, sortBy: "SURNAME" })
      .then((r) => setProducers(r.content.map(toProducer)))
      .catch(() => setProducers([]));
  }, []);

  // Populate (edit) or reset (create) the form each time the dialog opens.
  useEffect(() => {
    if (open) setForm(field ? toForm(field) : emptyForm);
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
    const payload: CreateFieldDto = {
      producerId: form.producer_id,
      locationName: form.location_name.trim(),
      region: form.region.trim() || null,
      area: form.area ? Number(form.area) : null,
      gpsCoordinates: form.gps_coordinates.trim() || null,
      plantingDate: form.planting_date || null,
      plantingMethod: form.planting_method || null,
      trainingShape: form.training_shape || null,
      rootstock: form.rootstock.trim() || null,
      spacing: form.spacing.trim() || null,
      maleCount: toCount(form.male_count),
      ac22Count: toCount(form.ac22_count),
      ac76Count: toCount(form.ac76_count),
      comments: form.comments.trim() || null,
    };
    setSaving(true);
    try {
      if (isEdit) {
        await fieldsApi.update(field.id, payload);
        toast.success("Το χωράφι ενημερώθηκε");
      } else {
        await fieldsApi.create(payload);
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
      title={
        <ModalTitle
          icon={<FiMap className="h-5 w-5" />}
          title={isEdit ? "Επεξεργασία Χωραφιού" : "Νέο Χωράφι"}
        />
      }
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
            value={form.area}
            onChange={(v) => set("area", v)}
            placeholder="π.χ. 12.5"
            inputProps={{ type: "number", step: "0.1" }}
          />
          <TextField
            label="GPS Συντεταγμένες"
            value={form.gps_coordinates}
            onChange={(v) => set("gps_coordinates", v)}
            placeholder={`"π.χ. 39°07'25.4N 20°55'11.1E"`}
          />
        </div>

        <hr className="border-gray-200" />
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          Αριθμός Δέντρων ανά Ποικιλία
        </p>

        <div className="grid grid-cols-3 gap-4">
          <TextField
            label="Αρσενικά"
            value={form.male_count}
            onChange={(v) => set("male_count", v)}
            placeholder="0"
            inputProps={{ type: "number", step: "1", min: "0" }}
          />
          <TextField
            label="AC22"
            value={form.ac22_count}
            onChange={(v) => set("ac22_count", v)}
            placeholder="0"
            inputProps={{ type: "number", step: "1", min: "0" }}
          />
          <TextField
            label="AC76"
            value={form.ac76_count}
            onChange={(v) => set("ac76_count", v)}
            placeholder="0"
            inputProps={{ type: "number", step: "1", min: "0" }}
          />
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
