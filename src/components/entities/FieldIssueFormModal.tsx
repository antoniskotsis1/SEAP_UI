import { useState, useEffect } from "react";
import { FiUpload, FiX } from "react-icons/fi";
import toast from "react-hot-toast";
import { FormModal } from "@/components/ui/FormModal";
import { TextField } from "@/components/ui/TextField";
import { TextAreaField } from "@/components/ui/TextAreaField";
import { SelectField } from "@/components/ui/SelectField";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { severityLabel, issueStatusLabel } from "@/lib/labels";
import type {
  Field,
  FieldIssue,
  FieldPhoto,
  IssueSeverity,
  IssueStatus,
} from "@/types";

/** An issue row may carry the joined URL of its originating photo, when it has one. */
type EditableIssue = FieldIssue & { photo_url?: string };

interface FieldIssueFormModalProps {
  open: boolean;
  /** When provided, the dialog edits this issue (PATCH); otherwise creates one (POST). */
  issue?: EditableIssue | null;
  onClose: () => void;
  onSaved: () => void;
}

type IssueForm = {
  field_id: string;
  title: string;
  description: string;
  severity: IssueSeverity;
  status: IssueStatus;
  reported_at: string;
};

const today = () => new Date().toISOString().slice(0, 10);

const emptyForm: IssueForm = {
  field_id: "",
  title: "",
  description: "",
  severity: "MEDIUM",
  status: "OPEN",
  reported_at: today(),
};

const SEVERITIES: IssueSeverity[] = ["LOW", "MEDIUM", "HIGH"];
const STATUSES: IssueStatus[] = ["OPEN", "RESOLVED"];

/**
 * Create/edit dialog for a field issue reported from the issues page. A photo is
 * **optional**: attach one and it is created and linked (`photo_id`); leave it
 * empty and the issue stands alone. Pass an `issue` to edit it (PATCH), or omit
 * it to create (POST).
 */
export function FieldIssueFormModal({
  open,
  issue,
  onClose,
  onSaved,
}: FieldIssueFormModalProps) {
  const isEdit = !!issue;
  const [form, setForm] = useState<IssueForm>(emptyForm);
  const [fields, setFields] = useState<Field[]>([]);
  const [saving, setSaving] = useState(false);

  // Optional photo. `photoUrl` is the current preview (existing URL or freshly
  // read data URL); `photoDirty` marks a newly-attached photo that needs a
  // FieldPhoto record created on save.
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoName, setPhotoName] = useState("");
  const [photoDirty, setPhotoDirty] = useState(false);

  // Fields for the field dropdown.
  useEffect(() => {
    api
      .list<Field>("/fields", { page_size: 1000, sort_by: "location_name" })
      .then((r) => setFields(r.data))
      .catch(() => setFields([]));
  }, []);

  // Populate (edit) or reset (create) the form each time the dialog opens.
  useEffect(() => {
    if (!open) return;
    setForm(
      issue
        ? {
            field_id: issue.field_id,
            title: issue.title,
            description: issue.description,
            severity: issue.severity,
            status: issue.status,
            reported_at: issue.reported_at?.slice(0, 10) || today(),
          }
        : emptyForm,
    );
    setPhotoUrl(issue?.photo_url ?? "");
    setPhotoName("");
    setPhotoDirty(false);
  }, [open, issue]);

  const set = <K extends keyof IssueForm>(key: K, value: IssueForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Επιλέξτε αρχείο εικόνας");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoUrl(reader.result as string);
      setPhotoName(file.name);
      setPhotoDirty(true);
    };
    reader.readAsDataURL(file);
  };

  const clearPhoto = () => {
    setPhotoUrl("");
    setPhotoName("");
    setPhotoDirty(false);
  };

  const handleSubmit = async () => {
    if (!form.field_id.trim()) {
      toast.error("Το χωράφι είναι υποχρεωτικό");
      return;
    }
    if (!form.title.trim()) {
      toast.error("Ο τίτλος είναι υποχρεωτικός");
      return;
    }

    setSaving(true);
    try {
      // Resolve the (optional) photo link:
      //  • new photo attached  → create a FieldPhoto, link its id
      //  • preview cleared      → null (unlink)
      //  • unchanged existing   → undefined (leave as-is)
      let photo_id: string | null | undefined;
      if (photoDirty && photoUrl) {
        const photo = await api.post<FieldPhoto>("/field-photos", {
          field_id: form.field_id,
          url: photoUrl,
          category: "OTHER",
          taken_at: form.reported_at,
        });
        photo_id = photo.id;
      } else if (!photoUrl) {
        photo_id = isEdit ? null : undefined;
      }

      const payload = {
        field_id: form.field_id,
        title: form.title,
        description: form.description,
        severity: form.severity,
        status: form.status,
        reported_at: form.reported_at,
        ...(photo_id !== undefined ? { photo_id } : {}),
      };

      if (isEdit) {
        await api.patch(`/field-issues/${issue.id}`, payload);
        toast.success("Το πρόβλημα ενημερώθηκε");
      } else {
        await api.post("/field-issues", payload);
        toast.success("Το πρόβλημα καταχωρήθηκε");
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
      title={isEdit ? "Επεξεργασία Προβλήματος" : "Νέα Αναφορά Προβλήματος"}
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
          label="Τίτλος"
          isRequired
          value={form.title}
          onChange={(v) => set("title", v)}
          placeholder="π.χ. Προσβολή από έντομα"
        />

        <TextAreaField
          label="Περιγραφή"
          value={form.description}
          onChange={(v) => set("description", v)}
          placeholder="Λεπτομερής περιγραφή του προβλήματος…"
        />

        <div className="grid grid-cols-2 gap-4">
          <SelectField
            label="Σοβαρότητα"
            value={form.severity}
            onChange={(e) => set("severity", e.target.value as IssueSeverity)}
          >
            {SEVERITIES.map((s) => (
              <option key={s} value={s}>
                {severityLabel[s]}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Κατάσταση"
            value={form.status}
            onChange={(e) => set("status", e.target.value as IssueStatus)}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {issueStatusLabel[s]}
              </option>
            ))}
          </SelectField>
        </div>

        <TextField
          label="Ημ. Αναφοράς"
          value={form.reported_at}
          onChange={(v) => set("reported_at", v)}
          inputProps={{ type: "date" }}
        />

        {/* Optional photo — attach one to document the problem, or leave empty. */}
        <div>
          <span className="label">Φωτογραφία (προαιρετικά)</span>
          {photoUrl ? (
            <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-2">
              <img
                src={photoUrl}
                alt=""
                className="h-16 w-16 shrink-0 rounded-md object-cover"
              />
              <span className="min-w-0 flex-1 truncate text-sm text-gray-600">
                {photoName || photoUrl}
              </span>
              <Button variant="ghost" onPress={clearPhoto} className="text-gray-500">
                <FiX className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 py-4 text-sm text-gray-500 hover:border-brand-400 hover:text-brand-600">
              <FiUpload className="h-4 w-4" />
              Επιλογή αρχείου από τον υπολογιστή
              <input
                type="file"
                accept="image/*"
                onChange={handleFile}
                className="sr-only"
              />
            </label>
          )}
        </div>
      </div>
    </FormModal>
  );
}
