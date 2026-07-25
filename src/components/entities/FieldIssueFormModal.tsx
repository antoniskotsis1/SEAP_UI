import { useState, useEffect } from "react";
import { FiUpload, FiX, FiAlertTriangle } from "react-icons/fi";
import toast from "react-hot-toast";
import { FormModal } from "@/components/ui/FormModal";
import { ModalTitle } from "@/components/ui/ModalTitle";
import { TextField } from "@/components/ui/TextField";
import { TextAreaField } from "@/components/ui/TextAreaField";
import { SelectField } from "@/components/ui/SelectField";
import { Button } from "@/components/ui/Button";
import { fieldsApi, issuesApi, imagesApi } from "@/lib/services";
import { toField } from "@/lib/adapters";
import { severityLabel, issueStateLabel, ISSUE_STATE_ORDER } from "@/lib/labels";
import type {
  CreateIssueDto,
  IssueDto,
  IssueSeverity,
  IssueState,
} from "@/types/api";
import type { Field } from "@/types";

interface FieldIssueFormModalProps {
  open: boolean;
  /** When provided, the dialog edits this issue (PUT); otherwise creates one (POST). */
  issue?: IssueDto | null;
  onClose: () => void;
  onSaved: () => void;
}

type IssueForm = {
  field_id: string;
  title: string;
  description: string;
  severity: IssueSeverity;
  state: IssueState;
};

const emptyForm: IssueForm = {
  field_id: "",
  title: "",
  description: "",
  severity: "MEDIUM",
  state: "OPEN",
};

const SEVERITIES: IssueSeverity[] = ["LOW", "MEDIUM", "HIGH"];

/**
 * Create/edit dialog for a field issue reported from the issues page. A photo is
 * **optional**: attach one and it is uploaded and linked to the issue
 * (`issueId`); leave it empty and the issue stands alone. Pass an `issue` to
 * edit it (PUT), or omit it to create (POST).
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

  // Optional photo. `photoUrl` is the preview (existing linked image URL or a
  // freshly read data URL); `photoFile` is a newly attached file to upload.
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoName, setPhotoName] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  // Fields for the field dropdown.
  useEffect(() => {
    fieldsApi
      .list({ size: 1000, sortBy: "LOCATION_NAME" })
      .then((r) => setFields(r.content.map(toField)))
      .catch(() => setFields([]));
  }, []);

  // Populate (edit) or reset (create) the form each time the dialog opens.
  useEffect(() => {
    if (!open) return;
    setForm(
      issue
        ? {
            field_id: issue.fieldId ?? "",
            title: issue.title,
            description: issue.description ?? "",
            severity: issue.severity,
            state: issue.state,
          }
        : emptyForm,
    );
    setPhotoUrl("");
    setPhotoName("");
    setPhotoFile(null);
    // Preview the first image already linked to this issue (read-only).
    if (issue) {
      imagesApi
        .list({ issueId: issue.id, size: 1 })
        .then((r) => {
          if (r.content[0]) setPhotoUrl(r.content[0].url);
        })
        .catch(() => {});
    }
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
      setPhotoFile(file);
    };
    reader.readAsDataURL(file);
  };

  const clearPhoto = () => {
    setPhotoUrl("");
    setPhotoName("");
    setPhotoFile(null);
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
      const payload: CreateIssueDto = {
        fieldId: form.field_id,
        title: form.title.trim(),
        description: form.description.trim() || null,
        severity: form.severity,
        state: form.state,
      };

      const saved = isEdit
        ? await issuesApi.update(issue.id, payload)
        : await issuesApi.create(payload);

      // A newly attached photo is uploaded and linked to the (saved) issue.
      // The API accepts exactly one owner link, so send only `issueId` (the
      // issue already carries the field).
      if (photoFile) {
        await imagesApi.upload(photoFile, {
          issueId: saved.id,
          category: "OTHER",
        });
      }

      toast.success(isEdit ? "Το πρόβλημα ενημερώθηκε" : "Το πρόβλημα καταχωρήθηκε");
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
          icon={<FiAlertTriangle className="h-5 w-5" />}
          title={isEdit ? "Επεξεργασία Προβλήματος" : "Νέα Αναφορά Προβλήματος"}
        />
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
              {f.location_name}
              {f.producer_name ? ` — ${f.producer_name}` : ""}
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
            value={form.state}
            onChange={(e) => set("state", e.target.value as IssueState)}
          >
            {ISSUE_STATE_ORDER.map((s) => (
              <option key={s} value={s}>
                {issueStateLabel[s]}
              </option>
            ))}
          </SelectField>
        </div>

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
              {photoFile && (
                <Button
                  variant="ghost"
                  onPress={clearPhoto}
                  className="text-gray-500"
                >
                  <FiX className="h-4 w-4" />
                </Button>
              )}
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
