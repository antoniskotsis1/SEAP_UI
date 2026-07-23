import { useCallback, useEffect, useMemo, useState } from "react";
import { FiCamera, FiPlus, FiAlertTriangle, FiUsers } from "react-icons/fi";
import toast from "react-hot-toast";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { FormModal } from "@/components/ui/FormModal";
import { Button } from "@/components/ui/Button";
import { TextAreaField } from "@/components/ui/TextAreaField";
import { TextField } from "@/components/ui/TextField";
import { SelectField } from "@/components/ui/SelectField";
import { ModalTitle } from "@/components/ui/ModalTitle";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { fieldsApi, imagesApi, issuesApi } from "@/lib/services";
import { toField } from "@/lib/adapters";
import { cn, formatDate } from "@/lib/utils";
import {
  PHOTO_CATEGORY_ORDER,
  photoCategoryLabel,
  photoCategoryBadge,
  photoIssueBorder,
  severityLabel,
  severityBadge,
  issueStateLabel,
  issueStateBadge,
  ISSUE_STATE_ORDER,
} from "@/lib/labels";
import type { ImageDto, IssueDto, IssueSeverity, IssueState } from "@/types/api";
import type { Field, PhotoCategory } from "@/types";

// ─── Field list columns ──────────────────────────────────────────────────────

function buildColumns(count: (fieldId: string) => number): Column<Field>[] {
  return [
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
      width: "minmax(120px, 0.6fr)",
      render: (row) => (
        <span className="inline-flex items-center gap-1.5 text-gray-700">
          <FiCamera className="h-3.5 w-3.5 text-gray-400" />
          {count(row.id)}
        </span>
      ),
    },
  ];
}

const PAGE_SIZE = 50;

// ─── Upload form state ──────────────────────────────────────────────────────

const emptyForm = {
  field_id: "",
  category: "" as PhotoCategory | "",
  notes: "",
  has_issue: false,
  issue_title: "",
  issue_description: "",
  issue_severity: "MEDIUM" as IssueSeverity,
  issue_state: "OPEN" as IssueState,
};

// ─── Page component ─────────────────────────────────────────────────────────

export function FieldPhotosListPage() {
  // All images + issues + fields are loaded once (client-side): images back the
  // per-field counts and galleries; issues resolve each image's severity border;
  // the field list is then narrowed to only those that actually have photos.
  const [images, setImages] = useState<ImageDto[]>([]);
  const [issuesById, setIssuesById] = useState<Map<string, IssueDto>>(new Map());
  const [fields, setFields] = useState<Field[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadImages = useCallback(
    () =>
      imagesApi
        .list({ size: 1000, sortBy: "CREATED_AT", direction: "DESC" })
        .then((r) => setImages(r.content))
        .catch(() => setImages([])),
    [],
  );
  const loadIssues = useCallback(
    () =>
      issuesApi
        .list({ size: 1000 })
        .then((r) => setIssuesById(new Map(r.content.map((i) => [i.id, i]))))
        .catch(() => setIssuesById(new Map())),
    [],
  );

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      loadImages(),
      loadIssues(),
      fieldsApi
        .list({ size: 1000, sortBy: "LOCATION_NAME" })
        .then((r) => setFields(r.content.map(toField)))
        .catch(() => setFields([])),
    ]).finally(() => setIsLoading(false));
  }, [loadImages, loadIssues]);

  // ── Client-side table state (search / sort / pagination) ──────────────────
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<string | null>("producer_name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);

  const toggleSort = useCallback(
    (col: string) => {
      if (sortBy === col) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortBy(col);
        setSortDir("asc");
      }
      setPage(1);
    },
    [sortBy],
  );

  const imageIssue = useCallback(
    (img: ImageDto): IssueDto | undefined =>
      img.issueId ? issuesById.get(img.issueId) : undefined,
    [issuesById],
  );

  // An image links to exactly one owner. Field photos carry `fieldId`; problem
  // photos carry `issueId` only, so fall back to the issue's field.
  const imageFieldId = useCallback(
    (img: ImageDto): string | null =>
      img.fieldId ?? imageIssue(img)?.fieldId ?? null,
    [imageIssue],
  );

  const countByField = useMemo(() => {
    const map = new Map<string, number>();
    for (const img of images) {
      const fid = imageFieldId(img);
      if (fid) map.set(fid, (map.get(fid) ?? 0) + 1);
    }
    return map;
  }, [images, imageFieldId]);

  // Only fields that already have photos are listed; then search / sort / page.
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    let result = fields.filter((f) => (countByField.get(f.id) ?? 0) > 0);
    if (q) {
      result = result.filter(
        (f) =>
          (f.producer_name ?? "").toLowerCase().includes(q) ||
          (f.location_name ?? "").toLowerCase().includes(q),
      );
    }
    const dir = sortDir === "asc" ? 1 : -1;
    result = [...result].sort((a, b) => {
      const key = (f: Field) =>
        sortBy === "region"
          ? f.region ?? ""
          : `${f.producer_name ?? ""} ${f.location_name ?? ""}`;
      return dir * key(a).localeCompare(key(b), "el");
    });
    return result;
  }, [fields, countByField, search, sortBy, sortDir]);

  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageRows = useMemo(
    () => rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [rows, page],
  );

  // ── Gallery modal ─────────────────────────────────────────────────────────
  const [selectedField, setSelectedField] = useState<Field | null>(null);

  const fieldImages = useMemo(
    () =>
      selectedField
        ? images.filter((img) => imageFieldId(img) === selectedField.id)
        : [],
    [images, selectedField, imageFieldId],
  );

  const imagesByCategory = useMemo(
    () =>
      PHOTO_CATEGORY_ORDER.reduce<Record<PhotoCategory, ImageDto[]>>(
        (acc, cat) => {
          acc[cat] = fieldImages.filter((p) => p.category === cat);
          return acc;
        },
        {} as Record<PhotoCategory, ImageDto[]>,
      ),
    [fieldImages],
  );

  // ── Lightbox (single photo, full-res) ────────────────────────────────────
  const [lightbox, setLightbox] = useState<ImageDto | null>(null);

  // ── Upload modal ──────────────────────────────────────────────────────────
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const set = (key: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const openCreate = () => {
    setForm(emptyForm);
    setFile(null);
    setCreateOpen(true);
  };

  const openCreateForField = (fieldId: string) => {
    setForm({ ...emptyForm, field_id: fieldId });
    setFile(null);
    setCreateOpen(true);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      toast.error("Επιλέξτε αρχείο εικόνας");
      return;
    }
    setFile(f);
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
    if (!file) {
      toast.error("Επιλέξτε αρχείο εικόνας");
      return;
    }
    if (form.has_issue && !form.issue_title.trim()) {
      toast.error("Ο τίτλος του προβλήματος είναι υποχρεωτικός");
      return;
    }
    setSaving(true);
    try {
      // The API accepts exactly one owner link (field XOR issue). A reported
      // problem creates the issue first and the image links to that issue (the
      // issue carries the field); otherwise the image links to the field.
      if (form.has_issue) {
        const issue = await issuesApi.create({
          fieldId: form.field_id,
          title: form.issue_title.trim(),
          description: form.issue_description.trim() || null,
          severity: form.issue_severity,
          state: form.issue_state,
        });
        await imagesApi.upload(file, {
          issueId: issue.id,
          category: form.category,
          notes: form.notes || undefined,
        });
      } else {
        await imagesApi.upload(file, {
          fieldId: form.field_id,
          category: form.category,
          notes: form.notes || undefined,
        });
      }
      toast.success(
        form.has_issue
          ? "Η φωτογραφία και το πρόβλημα καταχωρήθηκαν"
          : "Η φωτογραφία προστέθηκε",
      );
      setCreateOpen(false);
      loadImages();
      if (form.has_issue) loadIssues();
    } catch {
      toast.error("Αποτυχία προσθήκης");
    } finally {
      setSaving(false);
    }
  };

  const columns = buildColumns((fieldId) => countByField.get(fieldId) ?? 0);

  const isEmpty = !isLoading && total === 0 && !search;

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
          title="Δεν υπάρχουν φωτογραφίες"
          description="Ξεκινήστε ανεβάζοντας φωτογραφίες σε χωράφια."
          action={
            <Button onPress={openCreate}>
              <FiPlus className="h-4 w-4" />
              Ανέβασμα Φωτογραφίας
            </Button>
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={pageRows}
          keyExtractor={(row) => row.id}
          onRowClick={setSelectedField}
          isLoading={isLoading}
          search={search}
          onSearchChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          searchPlaceholder="Αναζήτηση χωραφιού, παραγωγού…"
          sortBy={sortBy}
          sortDir={sortDir}
          onSort={toggleSort}
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}

      {/* ── Photo gallery modal ──────────────────────────────────────────── */}
      <Modal
        open={!!selectedField}
        onClose={() => setSelectedField(null)}
        title={
          selectedField ? (
            <span className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                <FiCamera className="h-5 w-5" />
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="truncate leading-tight">
                  {selectedField.location_name}
                </span>
                <span className="truncate text-xs font-normal text-gray-500">
                  {selectedField.producer_name || "Φωτογραφίες"}
                  {" · "}
                  {fieldImages.length}{" "}
                  {fieldImages.length === 1 ? "φωτογραφία" : "φωτογραφίες"}
                </span>
              </span>
            </span>
          ) : (
            ""
          )
        }
        wide
        footer={
          <>
            <Button variant="secondary" onPress={() => setSelectedField(null)}>
              Κλείσιμο
            </Button>
            {selectedField && (
              <Button onPress={() => openCreateForField(selectedField.id)}>
                <FiPlus className="h-4 w-4" />
                Ανέβασμα
              </Button>
            )}
          </>
        }
      >
        {selectedField && (
          <div className="space-y-6">
            {fieldImages.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-gray-200 py-12 text-center">
                <FiCamera className="h-8 w-8 text-gray-300" />
                <p className="text-sm text-gray-400">
                  Δεν υπάρχουν φωτογραφίες για αυτό το χωράφι.
                </p>
                <Button onPress={() => openCreateForField(selectedField.id)}>
                  <FiPlus className="h-4 w-4" />
                  Ανέβασμα
                </Button>
              </div>
            ) : (
              PHOTO_CATEGORY_ORDER.map((cat) => {
                const photos = imagesByCategory[cat];
                if (photos.length === 0) return null;
                return (
                  <div key={cat}>
                    <div className="mb-3 flex items-center gap-2 border-b border-gray-100 pb-2">
                      <span className={photoCategoryBadge[cat]}>
                        {photoCategoryLabel[cat]}
                      </span>
                      <span className="text-xs font-medium text-gray-400">
                        {photos.length}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {photos.map((photo) => {
                        const issue = imageIssue(photo);
                        return (
                          <button
                            key={photo.id}
                            type="button"
                            onClick={() => setLightbox(photo)}
                            className={cn(
                              "group overflow-hidden rounded-xl border-2 bg-white text-left shadow-sm transition hover:shadow-md",
                              photoIssueBorder(issue),
                            )}
                          >
                            <div className="relative">
                              <img
                                src={photo.url}
                                alt={photo.notes ?? ""}
                                className="h-36 w-full object-cover"
                                loading="lazy"
                              />
                              {issue && (
                                <span className="absolute right-1.5 top-1.5 inline-flex items-center gap-1 rounded-full bg-white/95 px-1.5 py-0.5 text-[10px] font-medium text-gray-700 shadow-sm">
                                  <FiAlertTriangle
                                    className={cn(
                                      "h-3 w-3",
                                      issue.severity === "HIGH"
                                        ? "text-red-500"
                                        : "text-amber-500",
                                    )}
                                  />
                                  {severityLabel[issue.severity]}
                                </span>
                              )}
                            </div>
                            <div className="px-2 py-1.5">
                              {photo.notes && (
                                <p className="truncate text-xs font-medium text-gray-700">
                                  {photo.notes}
                                </p>
                              )}
                              <p className="text-xs text-gray-400">
                                {formatDate(photo.createdAt)}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </Modal>

      {/* ── Lightbox (single photo, full-res) ────────────────────────────── */}
      <Modal
        open={!!lightbox}
        onClose={() => setLightbox(null)}
        title={
          lightbox
            ? photoCategoryLabel[lightbox.category as PhotoCategory] ?? "Φωτογραφία"
            : ""
        }
        wide
        footer={
          <Button variant="secondary" onPress={() => setLightbox(null)}>
            Κλείσιμο
          </Button>
        }
      >
        {lightbox &&
          (() => {
            const issue = imageIssue(lightbox);
            return (
              <div className="space-y-4">
                <div
                  className={cn(
                    "overflow-hidden rounded-xl border-2",
                    photoIssueBorder(issue),
                  )}
                >
                  <img
                    src={lightbox.url}
                    alt={lightbox.notes ?? ""}
                    className="max-h-[60vh] w-full bg-gray-900 object-contain"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                  {lightbox.category && (
                    <span
                      className={
                        photoCategoryBadge[lightbox.category as PhotoCategory] ??
                        "badge-gray"
                      }
                    >
                      {photoCategoryLabel[lightbox.category as PhotoCategory] ??
                        lightbox.category}
                    </span>
                  )}
                  <span>{formatDate(lightbox.createdAt)}</span>
                </div>

                {issue && (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <FiAlertTriangle className="h-4 w-4 text-red-500" />
                      <span className="font-medium text-gray-900">
                        {issue.title}
                      </span>
                      <span className={severityBadge[issue.severity]}>
                        {severityLabel[issue.severity]}
                      </span>
                      <span className={issueStateBadge[issue.state]}>
                        {issueStateLabel[issue.state]}
                      </span>
                    </div>
                    {issue.description && (
                      <p className="text-sm text-gray-600">{issue.description}</p>
                    )}
                  </div>
                )}

                {lightbox.notes && (
                  <div>
                    <span className="label">Σχόλια</span>
                    <p className="text-sm text-gray-700">{lightbox.notes}</p>
                  </div>
                )}
              </div>
            );
          })()}
      </Modal>

      {/* ── Upload modal ─────────────────────────────────────────────────── */}
      <FormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title={
          <ModalTitle
            icon={<FiCamera className="h-5 w-5" />}
            title="Ανέβασμα Φωτογραφίας"
          />
        }
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

          {/* Photo file (uploaded as multipart to /images). */}
          <div>
            <span className="label">
              Φωτογραφία<span className="ml-1 text-red-500">*</span>
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFile}
              className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100"
            />
            {file && (
              <p className="mt-1 truncate text-xs text-gray-500">{file.name}</p>
            )}
          </div>

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
                  value={form.issue_state}
                  onChange={(e) => set("issue_state", e.target.value)}
                >
                  {ISSUE_STATE_ORDER.map((s) => (
                    <option key={s} value={s}>
                      {issueStateLabel[s]}
                    </option>
                  ))}
                </SelectField>
              </div>
            </div>
          )}
        </div>
      </FormModal>
    </>
  );
}
