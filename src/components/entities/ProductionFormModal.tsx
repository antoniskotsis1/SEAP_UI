import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { FormModal } from "@/components/ui/FormModal";
import { TextField } from "@/components/ui/TextField";
import { SelectField } from "@/components/ui/SelectField";
import { api } from "@/lib/api";
import type { Field, ProductionRecord } from "@/types";

interface ProductionFormModalProps {
  open: boolean;
  /** When provided, the dialog edits this record (PATCH); otherwise it creates one (POST). */
  record?: ProductionRecord | null;
  /** Bakes the record's `is_estimate` flag — the estimation tab passes `true`. */
  isEstimate: boolean;
  onClose: () => void;
  /** Called after a successful create/update so the caller can refetch. */
  onSaved: () => void;
}

type ProductionForm = {
  field_id: string;
  harvest_year: string;
  ac22_kg: string;
  ac76_kg: string;
};

const emptyForm: ProductionForm = {
  field_id: "",
  harvest_year: String(new Date().getFullYear()),
  ac22_kg: "",
  ac76_kg: "",
};

const toForm = (r: ProductionRecord): ProductionForm => ({
  field_id: r.field_id ?? "",
  harvest_year: String(r.harvest_year ?? new Date().getFullYear()),
  ac22_kg: r.ac22_kg ? String(r.ac22_kg) : "",
  ac76_kg: r.ac76_kg ? String(r.ac76_kg) : "",
});

/**
 * Create/edit dialog for a production or estimate record (one per field per
 * year). Pass a `record` to edit it (PATCH), or omit it to create (POST).
 */
export function ProductionFormModal({
  open,
  record,
  isEstimate,
  onClose,
  onSaved,
}: ProductionFormModalProps) {
  const isEdit = !!record;
  const [form, setForm] = useState<ProductionForm>(emptyForm);
  const [fields, setFields] = useState<Field[]>([]);
  const [saving, setSaving] = useState(false);

  // Fields for the field dropdown.
  useEffect(() => {
    api
      .list<Field>("/fields", { page_size: 1000, sort_by: "location_name" })
      .then((r) => setFields(r.data))
      .catch(() => setFields([]));
  }, []);

  // Populate (edit) or reset (create) the form each time the dialog opens.
  useEffect(() => {
    if (open) setForm(record ? toForm(record) : emptyForm);
  }, [open, record]);

  const set = (key: keyof ProductionForm, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    if (!form.field_id.trim()) {
      toast.error("Το χωράφι είναι υποχρεωτικό");
      return;
    }
    if (!form.harvest_year.trim()) {
      toast.error("Το έτος είναι υποχρεωτικό");
      return;
    }
    const payload = {
      field_id: form.field_id,
      harvest_year: Number(form.harvest_year),
      ac22_kg: form.ac22_kg ? Number(form.ac22_kg) : 0,
      ac76_kg: form.ac76_kg ? Number(form.ac76_kg) : 0,
      is_estimate: isEstimate,
    };
    setSaving(true);
    try {
      if (isEdit) {
        await api.patch(`/production/${record.id}`, payload);
        toast.success("Η καταγραφή ενημερώθηκε");
      } else {
        await api.post("/production", payload);
        toast.success("Η καταγραφή δημιουργήθηκε");
      }
      onSaved();
      onClose();
    } catch {
      toast.error(isEdit ? "Αποτυχία ενημέρωσης" : "Αποτυχία δημιουργίας");
    } finally {
      setSaving(false);
    }
  };

  const noun = isEstimate ? "Εκτίμηση" : "Καταγραφή";

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={
        isEdit
          ? `Επεξεργασία ${noun === "Εκτίμηση" ? "Εκτίμησης" : "Καταγραφής"}`
          : `Νέα ${noun}`
      }
      onSubmit={handleSubmit}
      saving={saving}
      submitLabel={isEdit ? "Αποθήκευση" : "Δημιουργία"}
    >
      <div className="space-y-4">
        <SelectField
          label="Χωράφι"
          required
          value={form.field_id}
          onChange={(e) => set("field_id", e.target.value)}
        >
          <option value="">— Επιλέξτε χωράφι —</option>
          {fields.map((f) => (
            <option key={f.id} value={f.id}>
              {f.location_name} — {f.producer_name}
            </option>
          ))}
        </SelectField>

        <TextField
          label="Έτος"
          isRequired
          value={form.harvest_year}
          onChange={(v) => set("harvest_year", v)}
          inputProps={{ type: "number", step: "1" }}
        />

        <div className="grid grid-cols-2 gap-4">
          <TextField
            label="AC22 (kg)"
            value={form.ac22_kg}
            onChange={(v) => set("ac22_kg", v)}
            placeholder="0"
            inputProps={{ type: "number", step: "0.1", min: "0" }}
          />
          <TextField
            label="AC76 (kg)"
            value={form.ac76_kg}
            onChange={(v) => set("ac76_kg", v)}
            placeholder="0"
            inputProps={{ type: "number", step: "0.1", min: "0" }}
          />
        </div>
      </div>
    </FormModal>
  );
}
