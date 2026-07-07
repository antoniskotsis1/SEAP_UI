import { useState, useEffect } from "react";
import {
  FiCamera,
  FiPlus,
  FiAlertTriangle,
  FiUpload,
  FiX,
  FiUsers,
} from "react-icons/fi";
import toast from "react-hot-toast";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { FormModal } from "@/components/ui/FormModal";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { TextAreaField } from "@/components/ui/TextAreaField";
import { SelectField } from "@/components/ui/SelectField";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { useTableQuery } from "@/hooks/useTableQuery";
import { api } from "@/lib/api";
import { cn, formatDate } from "@/lib/utils";
import {
  PHOTO_CATEGORY_ORDER,
  photoCategoryLabel,
  photoCategoryBadge,
  photoIssueBorder,
  severityLabel,
  severityBadge,
  issueStatusLabel,
  issueStatusBadge,
} from "@/lib/labels";
import type {
  Field,
  FieldPhoto,
  PhotoCategory,
  IssueSeverity,
  IssueStatus,
} from "@/types";

// ─── Field list columns ──────────────────────────────────────────────────────

const columns: Column<Field>[] = [
  {
    key: "producer_name",
    header: "Παραγωγός / Χωράφι",
    sortable: true,
    render: (row) => (
      <div className="min-w-0">
        <p className="flex items-center gap-1 truncate font-medium text-brand-600">
          <FiUsers className="h-3 w-3 shrink-0" />
          {row.producer_name || "—"}
        </p>
        <p className="truncate text-xs text-gray-400">
          {row.location_name || "—"}
        </p>
      </div>
    ),
  },
  {
    key: "region",
    header: "Περιοχή",
    sortable: true,
    render: (row) => row.region || "—",
  },
  {
    key: "photo_count",
    header: "Φωτογραφίες",
    sortable: true,
    width: "minmax(120px, 0.6fr)",
    render: (row) => (
      <span className="inline-flex items-center gap-1.5 text-gray-700">
        <FiCamera className="h-3.5 w-3.5 text-gray-400" />
        {row.photo_count ?? 0}
      </span>
    ),
  },
];

// ─── Initial form state ─────────────────────────────────────────────────────

const emptyForm = {
  field_id: "",
  category: "" as PhotoCategory | "",
  url: "",
  taken_at: "",
  notes: "",
  has_issue: false,
  issue_title: "",
  issue_description: "",
  issue_severity: "MEDIUM" as IssueSeverity,
  issue_status: "OPEN" as IssueStatus,
};

// ─── Page component ─────────────────────────────────────────────────────────

export function FieldPhotosListPage() {
  const table = useTableQuery<Field>({
    endpoint: "/fields",
    defaultSortBy: "location_name",
  });

  // ── Gallery modal ─────────────────────────────────────────────────────────
  const [selectedField, setSelectedField] = useState<Field | null>(null);
  const [fieldPhotos, setFieldPhotos] = useState<FieldPhoto[]>([]);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [photosKey, setPhotosKey] = useState(0);

  useEffect(() => {
    if (!selectedField) {
      setFieldPhotos([]);
      return;
    }
    setPhotosLoading(true);
    api
      .list<FieldPhoto>("/field-photos", {
        field_id: selectedField.id,
        page_size: 200,
      })
      .then((r) => setFieldPhotos(r.data))
      .catch(() => setFieldPhotos([]))
      .finally(() => setPhotosLoading(false));
  }, [selectedField, photosKey]);

  const photosByCategory = PHOTO_CATEGORY_ORDER.reduce<
    Record<PhotoCategory, FieldPhoto[]>
  >(
    (acc, cat) => {
      acc[cat] = fieldPhotos.filter((p) => p.category === cat);
      return acc;
    },
    {} as Record<PhotoCategory, FieldPhoto[]>,
  );

  // ── Lightbox (single photo, full-res + editable comments) ─────────────────
  const [lightbox, setLightbox] = useState<FieldPhoto | null>(null);
  const [comment, setComment] = useState("");
  const [savingComment, setSavingComment] = useState(false);

  const openLightbox = (photo: FieldPhoto) => {
    setLightbox(photo);
    setComment(photo.notes ?? "");
  };

  const saveComment = async () => {
    if (!lightbox) return;
    setSavingComment(true);
    try {
      await api.patch(`/field-photos/${lightbox.id}`, { notes: comment });
      toast.success("Τα σχόλια αποθηκεύτηκαν");
      setFieldPhotos((prev) =>
        prev.map((p) => (p.id === lightbox.id ? { ...p, notes: comment } : p)),
      );
      setLightbox((prev) => (prev ? { ...prev, notes: comment } : prev));
    } catch {
      toast.error("Αποτυχία αποθήκευσης");
    } finally {
      setSavingComment(false);
    }
  };

  // ── Upload modal ──────────────────────────────────────────────────────────
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [fileName, setFileName] = useState("");
  const [saving, setSaving] = useState(false);
  const [fields, setFields] = useState<Field[]>([]);

  // Fields for the location dropdown.
  useEffect(() => {
    api
      .list<Field>("/fields", { page_size: 1000, sort_by: "location_name" })
      .then((r) => setFields(r.data))
      .catch(() => setFields([]));
  }, []);

  const openCreate = () => {
    setForm(emptyForm);
    setFileName("");
    setCreateOpen(true);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Επιλέξτε αρχείο εικόνας");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      set("url", reader.result as string);
      setFileName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const clearFile = () => {
    set("url", "");
    setFileName("");
  };

  const handleSubmit = async () => {
    if (!form.field_id.trim()) {
      toast.error("Το χωράφι είναι υποχρεωτικό");
      return;
    }
    if (!form.category) {
      toast.error("Η κατηγορία είναι υποχρεωτική");
      return;
    }
    if (!form.url.trim()) {
      toast.error("Το URL είναι υποχρεωτικό");
      return;
    }
    if (form.has_issue && !form.issue_title.trim()) {
      toast.error("Ο τίτλος του προβλήματος είναι υποχρεωτικός");
      return;
    }
    if (form.has_issue && !form.issue_description.trim()) {
      toast.error("Η περιγραφή του προβλήματος είναι υποχρεωτική");
      return;
    }
    setSaving(true);
    try {
      await api.post("/field-photos", {
        field_id: form.field_id,
        category: form.category,
        url: form.url,
        taken_at: form.taken_at || undefined,
        notes: form.notes || undefined,
        has_issue: form.has_issue,
        issue: form.has_issue
          ? {
              title: form.issue_title,
              description: form.issue_description,
              severity: form.issue_severity,
              status: form.issue_status,
              reported_at: form.taken_at || undefined,
            }
          : undefined,
      });
      toast.success(
        form.has_issue
          ? "Η φωτογραφία και το πρόβλημα καταχωρήθηκαν"
          : "Η φωτογραφία προστέθηκε",
      );
      setCreateOpen(false);
      table.refetch();
      if (selectedField && form.field_id === selectedField.id) {
        setPhotosKey((k) => k + 1);
      }
    } catch {
      toast.error("Αποτυχία προσθήκης");
    } finally {
      setSaving(false);
    }
  };

  const set = (key: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const isEmpty =
    !table.isLoading &&
    table.total === 0 &&
    !table.search &&
    Object.keys(table.filters).length === 0;

  return (
    <>
      <PageHeader
        title="Φωτογραφίες Χωραφιών"
        description="Φωτογραφική τεκμηρίωση χωραφιών ανά κατηγορία"
        actions={
          <Button onPress={openCreate}>
            <FiPlus className="h-4 w-4" />
            Ανέβασμα Φωτογραφίας
          </Button>
        }
      />

      {isEmpty ? (
        <EmptyState
          icon={FiCamera}
          title="Δεν υπάρχουν χωράφια"
          description="Προσθέστε χωράφια για να ξεκινήσετε τη φωτογράφηση."
        />
      ) : (
        <DataTable
          columns={columns}
          data={table.data}
          keyExtractor={(row) => row.id}
          onRowClick={setSelectedField}
          isLoading={table.isLoading}
          error={table.error}
          search={table.search}
          onSearchChange={table.setSearch}
          searchPlaceholder="Αναζήτηση χωραφιού, παραγωγού…"
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

      {/* ── Photo gallery modal ──────────────────────────────────────────── */}
      <Modal
        open={!!selectedField}
        onClose={() => setSelectedField(null)}
        title={
          selectedField ? `${selectedField.location_name} — Φωτογραφίες` : ""
        }
        wide
        footer={
          <Button variant="secondary" onPress={() => setSelectedField(null)}>
            Κλείσιμο
          </Button>
        }
      >
        {selectedField && (
          <div className="space-y-6">
            {photosLoading ? (
              <p className="py-8 text-center text-sm text-gray-400">Φόρτωση…</p>
            ) : fieldPhotos.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">
                Δεν υπάρχουν φωτογραφίες για αυτό το χωράφι.
              </p>
            ) : (
              PHOTO_CATEGORY_ORDER.map((cat) => {
                const photos = photosByCategory[cat];
                if (photos.length === 0) return null;
                return (
                  <div key={cat}>
                    <div className="mb-3 flex items-center gap-2">
                      <span className={photoCategoryBadge[cat]}>
                        {photoCategoryLabel[cat]}
                      </span>
                      <span className="text-xs text-gray-400">
                        ({photos.length})
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {photos.map((photo) => (
                        <button
                          key={photo.id}
                          type="button"
                          onClick={() => openLightbox(photo)}
                          className={cn(
                            "group overflow-hidden rounded-lg border-4 text-left transition hover:opacity-95",
                            photoIssueBorder(photo.issue),
                          )}
                        >
                          <div className="relative">
                            <img
                              src={photo.url}
                              alt={photo.notes ?? ""}
                              className="h-36 w-full object-cover"
                              loading="lazy"
                            />
                            {photo.issue && (
                              <span className="absolute right-1.5 top-1.5 inline-flex items-center gap-1 rounded-full bg-white/90 px-1.5 py-0.5 text-[10px] font-medium text-gray-700 shadow-sm">
                                <FiAlertTriangle className="h-3 w-3 text-red-500" />
                                {severityLabel[photo.issue.severity]}
                              </span>
                            )}
                          </div>
                          <div className="bg-white px-2 py-1.5">
                            {photo.notes && (
                              <p className="truncate text-xs font-medium text-gray-700">
                                {photo.notes}
                              </p>
                            )}
                            {photo.taken_at && (
                              <p className="text-xs text-gray-400">
                                {formatDate(photo.taken_at)}
                              </p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </Modal>

      {/* ── Lightbox (single photo, full-res + comments) ─────────────────── */}
      <Modal
        open={!!lightbox}
        onClose={() => setLightbox(null)}
        title={lightbox ? photoCategoryLabel[lightbox.category] : ""}
        wide
        footer={
          <Button variant="secondary" onPress={() => setLightbox(null)}>
            Κλείσιμο
          </Button>
        }
      >
        {lightbox && (
          <div className="space-y-4">
            <div
              className={cn(
                "overflow-hidden rounded-lg border-4",
                photoIssueBorder(lightbox.issue),
              )}
            >
              <img
                src={lightbox.url}
                alt={lightbox.notes ?? ""}
                className="max-h-[60vh] w-full object-contain bg-gray-900"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
              <span className={photoCategoryBadge[lightbox.category]}>
                {photoCategoryLabel[lightbox.category]}
              </span>
              {lightbox.taken_at && (
                <span>{formatDate(lightbox.taken_at)}</span>
              )}
            </div>

            {lightbox.issue && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <div className="mb-1 flex items-center gap-2">
                  <FiAlertTriangle className="h-4 w-4 text-red-500" />
                  <span className="font-medium text-gray-900">
                    {lightbox.issue.title}
                  </span>
                  <span className={severityBadge[lightbox.issue.severity]}>
                    {severityLabel[lightbox.issue.severity]}
                  </span>
                  <span className={issueStatusBadge[lightbox.issue.status]}>
                    {issueStatusLabel[lightbox.issue.status]}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {lightbox.issue.description}
                </p>
              </div>
            )}

            {/* Comments — view & edit */}
            <div>
              <TextAreaField
                label="Σχόλια"
                value={comment}
                onChange={(v) => setComment(v)}
                placeholder="Προσθέστε σχόλια για αυτή τη φωτογραφία…"
              />
              <div className="mt-2 flex justify-end">
                <Button
                  onPress={saveComment}
                  isDisabled={
                    savingComment || comment === (lightbox.notes ?? "")
                  }
                >
                  {savingComment ? "Αποθήκευση…" : "Αποθήκευση σχολίων"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Upload modal ─────────────────────────────────────────────────── */}
      <FormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Ανέβασμα Φωτογραφίας"
        onSubmit={handleSubmit}
        saving={saving}
        submitLabel="Προσθήκη"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
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
            <SelectField
              label="Κατηγορία"
              required
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
            >
              <option value="">—</option>
              {PHOTO_CATEGORY_ORDER.map((cat) => (
                <option key={cat} value={cat}>
                  {photoCategoryLabel[cat]}
                </option>
              ))}
            </SelectField>
          </div>

          {/* Photo source — upload a file or paste a URL */}
          <div>
            <span className="label">
              Φωτογραφία<span className="ml-1 text-red-500">*</span>
            </span>
            {form.url ? (
              <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-2">
                <img
                  src={form.url}
                  alt=""
                  className="h-16 w-16 shrink-0 rounded-md object-cover"
                />
                <span className="min-w-0 flex-1 truncate text-sm text-gray-600">
                  {fileName || form.url}
                </span>
                <Button
                  variant="ghost"
                  onPress={clearFile}
                  className="text-gray-500"
                >
                  <FiX className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
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
                <TextField
                  label=""
                  value={form.url}
                  onChange={(v) => set("url", v)}
                  placeholder="ή επικολλήστε URL (https://...)"
                  inputProps={{ type: "url" }}
                />
              </div>
            )}
          </div>

          <TextField
            label="Ημερομηνία Λήψης"
            value={form.taken_at}
            onChange={(v) => set("taken_at", v)}
            inputProps={{ type: "date" }}
          />

          <TextAreaField
            label="Σχόλια"
            value={form.notes}
            onChange={(v) => set("notes", v)}
          />

          {/* Problem toggle — reveals the issue fields when checked */}
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5">
            <input
              type="checkbox"
              checked={form.has_issue}
              onChange={(e) => set("has_issue", e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            <span className="flex items-center gap-1.5 text-sm font-medium text-gray-800">
              <FiAlertTriangle className="h-4 w-4 text-yellow-500" />
              Υπάρχει πρόβλημα;
            </span>
          </label>

          {form.has_issue && (
            <div className="space-y-4 rounded-lg border border-yellow-200 bg-yellow-50/60 p-4">
              <TextField
                label="Τίτλος Προβλήματος"
                isRequired
                value={form.issue_title}
                onChange={(v) => set("issue_title", v)}
                placeholder="π.χ. Προσβολή από έντομα"
              />
              <TextAreaField
                label="Περιγραφή Προβλήματος"
                isRequired
                value={form.issue_description}
                onChange={(v) => set("issue_description", v)}
                placeholder="Λεπτομερής περιγραφή του προβλήματος…"
              />
              <div className="grid grid-cols-2 gap-4">
                <SelectField
                  label="Σοβαρότητα"
                  value={form.issue_severity}
                  onChange={(e) => set("issue_severity", e.target.value)}
                >
                  <option value="LOW">Χαμηλή</option>
                  <option value="MEDIUM">Μέτρια</option>
                  <option value="HIGH">Υψηλή</option>
                </SelectField>
                <SelectField
                  label="Κατάσταση"
                  value={form.issue_status}
                  onChange={(e) => set("issue_status", e.target.value)}
                >
                  <option value="OPEN">Ανοιχτό</option>
                  <option value="RESOLVED">Επιλύθηκε</option>
                </SelectField>
              </div>
            </div>
          )}
        </div>
      </FormModal>
    </>
  );
}
