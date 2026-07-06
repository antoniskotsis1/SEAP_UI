import { useState, useEffect } from "react";
import { FiUsers } from "react-icons/fi";
import toast from "react-hot-toast";
import { FormModal } from "@/components/ui/FormModal";
import { SelectField } from "@/components/ui/SelectField";
import { api } from "@/lib/api";
import { cn, formatNumber } from "@/lib/utils";
import { varietyLabel, varietyBadge, VARIETY_ORDER } from "@/lib/labels";
import type { Field, Planting, Variety, VarietyCount } from "@/types";

/** A planting enriched with the joined field/owner names shown by the list. */
export type PlantingWithContext = Planting & {
  field_name?: string;
  owner_name?: string;
};

interface PlantingFormModalProps {
  open: boolean;
  /** When provided, the dialog edits this planting (PUT); otherwise it creates one (POST). */
  planting?: PlantingWithContext | null;
  onClose: () => void;
  /** Called after a successful create/update so the caller can refetch. */
  onSaved: () => void;
}

type CountMap = Record<Variety, string>;

const emptyCounts: CountMap = { AC22: "", AC76: "", MALE: "" };

const toCounts = (varieties: VarietyCount[]): CountMap => {
  const counts = { ...emptyCounts };
  varieties.forEach((v) => {
    counts[v.variety] = String(v.tree_count);
  });
  return counts;
};

/**
 * Create/edit dialog for a planting. Pass a `planting` to edit it (PUT), or omit
 * it to create a new one (POST). Trees are entered per variety; the total is
 * derived. Shared by the list page's "new" action and its row-click edit.
 */
export function PlantingFormModal({
  open,
  planting,
  onClose,
  onSaved,
}: PlantingFormModalProps) {
  const isEdit = !!planting;
  const [fieldId, setFieldId] = useState("");
  const [counts, setCounts] = useState<CountMap>(emptyCounts);
  const [fields, setFields] = useState<Field[]>([]);
  const [saving, setSaving] = useState(false);

  // Fields for the location dropdown.
  useEffect(() => {
    api
      .list<Field>("/fields", { page_size: 1000, sort_by: "location_name" })
      .then((r) => setFields(r.data))
      .catch(() => setFields([]));
  }, []);

  // Populate (edit) or reset (create) each time the dialog opens.
  useEffect(() => {
    if (open) {
      setFieldId(planting?.field_id ?? "");
      setCounts(planting ? toCounts(planting.varieties) : emptyCounts);
    }
  }, [open, planting]);

  const setCount = (v: Variety, value: string) =>
    setCounts((prev) => ({ ...prev, [v]: value.replace(/[^\d]/g, "") }));

  const total = VARIETY_ORDER.reduce((s, v) => s + (Number(counts[v]) || 0), 0);

  const handleSubmit = async () => {
    if (!fieldId) {
      toast.error("Το χωράφι είναι υποχρεωτικό");
      return;
    }
    const varieties: VarietyCount[] = VARIETY_ORDER.filter(
      (v) => Number(counts[v]) > 0,
    ).map((v) => ({ variety: v, tree_count: Number(counts[v]) }));
    if (varieties.length === 0) {
      toast.error("Εισάγετε δέντρα για τουλάχιστον μία ποικιλία");
      return;
    }
    setSaving(true);
    try {
      const payload = { field_id: fieldId, varieties };
      if (isEdit) {
        await api.put(`/plantings/${planting.id}`, payload);
        toast.success("Η φύτευση ενημερώθηκε");
      } else {
        await api.post("/plantings", payload);
        toast.success("Η φύτευση δημιουργήθηκε");
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
      title={isEdit ? "Επεξεργασία Φύτευσης" : "Νέα Φύτευση"}
      onSubmit={handleSubmit}
      saving={saving}
      submitLabel={isEdit ? "Αποθήκευση" : "Δημιουργία"}
    >
      <div className="space-y-5">
        {isEdit && planting?.owner_name && (
          <p className="flex items-center gap-1.5 text-xs text-gray-400">
            <FiUsers className="h-3 w-3 shrink-0" />
            {planting.owner_name}
          </p>
        )}

        <SelectField
          label="Χωράφι"
          required
          value={fieldId}
          onChange={(e) => setFieldId(e.target.value)}
          disabled={isEdit}
        >
          <option value="">— Επιλέξτε χωράφι —</option>
          {fields.map((f) => (
            <option key={f.id} value={f.id}>
              {f.location_name}
              {f.producer_name ? ` — ${f.producer_name}` : ""}
            </option>
          ))}
        </SelectField>

        <div>
          <span className="label">
            Δέντρα ανά ποικιλία<span className="ml-1 text-red-500">*</span>
          </span>
          <div className="space-y-2">
            {VARIETY_ORDER.map((v) => {
              const active = Number(counts[v]) > 0;
              return (
                <div key={v} className="flex items-center gap-3">
                  <span
                    className={cn(
                      "w-24 shrink-0 text-center",
                      active ? varietyBadge[v] : "badge-gray opacity-50",
                    )}
                  >
                    {varietyLabel[v]}
                  </span>
                  <input
                    type="number"
                    min="0"
                    inputMode="numeric"
                    className="input flex-1"
                    placeholder="0"
                    value={counts[v]}
                    onChange={(e) => setCount(v, e.target.value)}
                  />
                  <span className="w-12 shrink-0 text-sm text-gray-400">
                    δέντρα
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-2 text-sm">
            <span className="text-gray-500">Σύνολο δέντρων</span>
            <span className="font-semibold text-gray-900">
              {formatNumber(total)}
            </span>
          </div>
        </div>
      </div>
    </FormModal>
  );
}
