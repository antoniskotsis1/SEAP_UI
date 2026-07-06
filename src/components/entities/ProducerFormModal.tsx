import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { FormModal } from "@/components/ui/FormModal";
import { TextField } from "@/components/ui/TextField";
import { TextAreaField } from "@/components/ui/TextAreaField";
import { SelectField } from "@/components/ui/SelectField";
import { api } from "@/lib/api";
import type { Producer, ProducerStatus } from "@/types";

interface ProducerFormModalProps {
  open: boolean;
  /** When provided, the dialog edits this producer; otherwise it creates a new one. */
  producer?: Producer | null;
  onClose: () => void;
  /** Called after a successful create/update so the caller can refetch. */
  onSaved: () => void;
}

type ProducerForm = {
  display_name: string;
  status: ProducerStatus;
  afm: string;
  phone: string;
  email: string;
  representative_name: string;
  region: string;
  notes: string;
};

const emptyForm: ProducerForm = {
  display_name: "",
  status: "LEAD",
  afm: "",
  phone: "",
  email: "",
  representative_name: "",
  region: "",
  notes: "",
};

const toForm = (p: Producer): ProducerForm => ({
  display_name: p.display_name ?? "",
  status: p.status,
  afm: p.afm ?? "",
  phone: p.phone ?? "",
  email: p.email ?? "",
  representative_name: p.representative_name ?? "",
  region: p.region ?? "",
  notes: p.notes ?? "",
});

/**
 * Create/edit dialog for a producer. Pass a `producer` to edit it (PATCH),
 * or omit it to create a new one (POST). Shared by the list page and the
 * detail modal's edit action.
 */
export function ProducerFormModal({
  open,
  producer,
  onClose,
  onSaved,
}: ProducerFormModalProps) {
  const isEdit = !!producer;
  const [form, setForm] = useState<ProducerForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  // Populate (edit) or reset (create) the form each time the dialog opens.
  useEffect(() => {
    if (open) setForm(producer ? toForm(producer) : emptyForm);
  }, [open, producer]);

  const set = (key: keyof ProducerForm, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    if (!form.display_name.trim()) {
      toast.error("Το όνομα είναι υποχρεωτικό");
      return;
    }
    setSaving(true);
    try {
      if (isEdit) {
        await api.patch(`/producers/${producer.id}`, form);
        toast.success("Ο παραγωγός ενημερώθηκε");
      } else {
        await api.post("/producers", form);
        toast.success("Ο παραγωγός δημιουργήθηκε");
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
      title={isEdit ? "Επεξεργασία Παραγωγού" : "Νέος Παραγωγός"}
      onSubmit={handleSubmit}
      saving={saving}
      submitLabel={isEdit ? "Αποθήκευση" : "Δημιουργία"}
    >
      <div className="space-y-4">
        <TextField
          label="Όνομα"
          isRequired
          value={form.display_name}
          onChange={(v) => set("display_name", v)}
          placeholder="π.χ. Γιώργος Παπαδόπουλος"
        />

        <SelectField
          label="Κατάσταση"
          value={form.status}
          onChange={(e) => set("status", e.target.value)}
        >
          <option value="LEAD">Lead</option>
          <option value="ACTIVE">Ενεργός</option>
          <option value="INACTIVE">Ανενεργός</option>
        </SelectField>

        <div className="grid grid-cols-2 gap-4">
          <TextField
            label="ΑΦΜ"
            value={form.afm}
            onChange={(v) => set("afm", v)}
            placeholder="123456789"
          />
          <TextField
            label="Τηλέφωνο"
            value={form.phone}
            onChange={(v) => set("phone", v)}
            placeholder="69xxxxxxxx"
            inputProps={{ type: "tel" }}
          />
        </div>

        <TextField
          label="Email"
          value={form.email}
          onChange={(v) => set("email", v)}
          placeholder="email@example.com"
          inputProps={{ type: "email" }}
        />

        <TextField
          label="Εκπρόσωπος"
          value={form.representative_name}
          onChange={(v) => set("representative_name", v)}
        />

        <TextField
          label="Περιοχή"
          value={form.region}
          onChange={(v) => set("region", v)}
        />

        <TextAreaField
          label="Σημειώσεις"
          value={form.notes}
          onChange={(v) => set("notes", v)}
        />
      </div>
    </FormModal>
  );
}
