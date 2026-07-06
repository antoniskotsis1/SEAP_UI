import { useState, useEffect } from "react";
import { FiFileText, FiFile, FiDownload } from "react-icons/fi";
import toast from "react-hot-toast";
import { FormModal } from "@/components/ui/FormModal";
import { TextField } from "@/components/ui/TextField";
import { SelectField } from "@/components/ui/SelectField";
import { api } from "@/lib/api";
import type { Field, Settlement, SettlementFile } from "@/types";

interface SettlementFormModalProps {
  open: boolean;
  /** When provided, the dialog edits this settlement (PATCH); otherwise creates one (POST). */
  settlement?: Settlement | null;
  onClose: () => void;
  onSaved: () => void;
}

type SettlementForm = {
  field_id: string;
  year: string;
};

const emptyForm: SettlementForm = {
  field_id: "",
  year: String(new Date().getFullYear()),
};

const fileTypeOf = (name: string): "PDF" | "EXCEL" =>
  name.toLowerCase().endsWith(".pdf") ? "PDF" : "EXCEL";

/**
 * Create/edit dialog for a settlement (Εκκαθάριση) — one per field per year,
 * holding one or more Excel/PDF files.
 */
export function SettlementFormModal({
  open,
  settlement,
  onClose,
  onSaved,
}: SettlementFormModalProps) {
  const isEdit = !!settlement;
  const [form, setForm] = useState<SettlementForm>(emptyForm);
  const [fields, setFields] = useState<Field[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .list<Field>("/fields", { page_size: 1000, sort_by: "location_name" })
      .then((r) => setFields(r.data))
      .catch(() => setFields([]));
  }, []);

  useEffect(() => {
    if (open) {
      setForm(
        settlement
          ? { field_id: settlement.field_id, year: String(settlement.year) }
          : emptyForm,
      );
      setNewFiles([]);
    }
  }, [open, settlement]);

  const set = (key: keyof SettlementForm, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    if (!form.field_id.trim()) {
      toast.error("Το χωράφι είναι υποχρεωτικό");
      return;
    }
    if (!form.year.trim()) {
      toast.error("Το έτος είναι υποχρεωτικό");
      return;
    }
    const uploaded: Partial<SettlementFile>[] = newFiles.map((f) => ({
      file_name: f.name,
      file_type: fileTypeOf(f.name),
      size_bytes: f.size,
    }));
    const files = [...(settlement?.files ?? []), ...uploaded];
    if (files.length === 0) {
      toast.error("Απαιτείται τουλάχιστον ένα αρχείο");
      return;
    }
    const payload = {
      field_id: form.field_id,
      year: Number(form.year),
      files,
    };
    setSaving(true);
    try {
      if (isEdit) {
        await api.patch(`/settlements/${settlement.id}`, payload);
        toast.success("Η εκκαθάριση ενημερώθηκε");
      } else {
        await api.post("/settlements", payload);
        toast.success("Η εκκαθάριση δημιουργήθηκε");
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
      title={isEdit ? "Επεξεργασία Εκκαθάρισης" : "Νέα Εκκαθάριση"}
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
          value={form.year}
          onChange={(v) => set("year", v)}
          inputProps={{ type: "number", step: "1" }}
        />

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Αρχεία (Excel / PDF)
          </label>

          {isEdit && settlement.files.length > 0 && (
            <ul className="mb-2 space-y-1">
              {settlement.files.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center gap-2 text-sm text-gray-600"
                >
                  {a.file_type === "PDF" ? (
                    <FiFile className="h-4 w-4 shrink-0 text-red-500" />
                  ) : (
                    <FiFileText className="h-4 w-4 shrink-0 text-green-600" />
                  )}
                  <a
                    href={a.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 truncate hover:text-brand-600 hover:underline"
                  >
                    {a.file_name}
                    <FiDownload className="h-3 w-3 shrink-0" />
                  </a>
                </li>
              ))}
            </ul>
          )}

          <input
            type="file"
            multiple
            accept=".xls,.xlsx,.csv,.pdf,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            onChange={(e) => setNewFiles(Array.from(e.target.files ?? []))}
            className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100"
          />
          {newFiles.length > 0 && (
            <ul className="mt-2 space-y-1 text-sm text-gray-600">
              {newFiles.map((f, i) => (
                <li key={`${f.name}-${i}`}>{f.name}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </FormModal>
  );
}
