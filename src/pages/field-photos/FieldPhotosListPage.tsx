import { useState, useEffect } from "react";
import { FiCamera, FiPlus } from "react-icons/fi";
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
import { formatDate, formatNumber } from "@/lib/utils";
import {
  PHOTO_CATEGORY_ORDER,
  photoCategoryLabel,
  photoCategoryBadge,
} from "@/lib/labels";
import type {
  FieldListItem,
  FieldPhoto,
  PhotoCategory,
} from "@/types";

// ─── Field list columns ──────────────────────────────────────────────────────

const columns: Column<FieldListItem>[] = [
  {
    key: "location_name",
    header: "Χωράφι",
    sortable: true,
    render: (row) => (
      <span className="font-medium text-gray-900 transition-colors group-hover:text-brand-600">
        {row.location_name}
      </span>
    ),
  },
  {
    key: "owner_name",
    header: "Παραγωγός",
    sortable: true,
    render: (row) => row.owner_name || "—",
  },
  {
    key: "region",
    header: "Περιοχή",
    sortable: true,
    render: (row) => row.region || "—",
  },
  {
    key: "stremmata",
    header: "Στρέμματα",
    sortable: true,
    render: (row) =>
      row.stremmata != null ? formatNumber(row.stremmata) : "—",
  },
];

// ─── Initial form state ─────────────────────────────────────────────────────

const emptyForm = {
  field_id: "",
  category: "" as PhotoCategory | "",
  url: "",
  taken_at: "",
  notes: "",
};

// ─── Page component ─────────────────────────────────────────────────────────

export function FieldPhotosListPage() {
  const table = useTableQuery<FieldListItem>({
    endpoint: "/fields",
    defaultSortBy: "location_name",
  });

  // ── Gallery modal ─────────────────────────────────────────────────────────
  const [selectedField, setSelectedField] = useState<FieldListItem | null>(null);
  const [fieldPhotos, setFieldPhotos] = useState<FieldPhoto[]>([]);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [photosKey, setPhotosKey] = useState(0);

  useEffect(() => {
    if (!selectedField) { setFieldPhotos([]); return; }
    setPhotosLoading(true);
    api
      .list<FieldPhoto>("/field-photos", { field_id: selectedField.id, page_size: 200 })
      .then((r) => setFieldPhotos(r.data))
      .catch(() => setFieldPhotos([]))
      .finally(() => setPhotosLoading(false));
  }, [selectedField, photosKey]);

  const photosByCategory = PHOTO_CATEGORY_ORDER.reduce<Record<PhotoCategory, FieldPhoto[]>>(
    (acc, cat) => {
      acc[cat] = fieldPhotos.filter((p) => p.category === cat);
      return acc;
    },
    {} as Record<PhotoCategory, FieldPhoto[]>,
  );

  // ── Upload modal ──────────────────────────────────────────────────────────
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setForm(emptyForm);
    setCreateOpen(true);
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
    setSaving(true);
    try {
      await api.post("/field-photos", {
        ...form,
        taken_at: form.taken_at || undefined,
      });
      toast.success("Η φωτογραφία προστέθηκε");
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

  const set = (key: string, value: string) =>
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
        title={selectedField ? `${selectedField.location_name} — Φωτογραφίες` : ""}
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
                      <span className={photoCategoryBadge[cat]}>{photoCategoryLabel[cat]}</span>
                      <span className="text-xs text-gray-400">({photos.length})</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {photos.map((photo) => (
                        <div
                          key={photo.id}
                          className="overflow-hidden rounded-lg border border-gray-200"
                        >
                          <img
                            src={photo.url}
                            alt={photo.notes ?? ""}
                            className="h-36 w-full object-cover"
                            loading="lazy"
                          />
                          <div className="px-2 py-1.5">
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
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
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
            <TextField
              label="Χωράφι"
              isRequired
              value={form.field_id}
              onChange={(v) => set("field_id", v)}
              placeholder="ID χωραφιού"
            />
            <SelectField
              label="Κατηγορία"
              required
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
            >
              <option value="">—</option>
              <option value="KLADEMA">Κλάδεμα</option>
              <option value="ARAIWMA_BLASTOU">Αραίωμα Βλαστού</option>
              <option value="ARAIWMA_KARPOU">Αραίωμα Καρπού</option>
              <option value="KALOKAIRI_NERA">Καλοκαίρι-Νερά</option>
              <option value="PERIODOS_SUGKOMIDIS">Περίοδος Συγκομιδής</option>
              <option value="OTHER">Άλλο</option>
            </SelectField>
          </div>

          <TextField
            label="URL Φωτογραφίας"
            isRequired
            value={form.url}
            onChange={(v) => set("url", v)}
            placeholder="https://..."
            inputProps={{ type: "url" }}
          />

          <TextField
            label="Ημερομηνία Λήψης"
            value={form.taken_at}
            onChange={(v) => set("taken_at", v)}
            inputProps={{ type: "date" }}
          />

          <TextAreaField
            label="Σημειώσεις"
            value={form.notes}
            onChange={(v) => set("notes", v)}
          />
        </div>
      </FormModal>
    </>
  );
}
