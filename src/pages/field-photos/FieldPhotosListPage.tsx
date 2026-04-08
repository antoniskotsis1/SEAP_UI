import { useState } from "react";
import { FiCamera, FiPlus } from "react-icons/fi";
import toast from "react-hot-toast";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { useTableQuery } from "@/hooks/useTableQuery";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { FieldPhoto } from "@/types";

// ─── Column definitions ─────────────────────────────────────────────────────

const columns: Column<FieldPhoto>[] = [
  {
    key: "url",
    header: "Φωτογραφία",
    render: (row) => (
      <a
        href={row.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-brand-600 hover:underline"
      >
        Προβολή
      </a>
    ),
  },
  {
    key: "taken_at",
    header: "Λήψη",
    sortable: true,
    render: (row) => formatDate(row.taken_at),
  },
  {
    key: "notes",
    header: "Σημειώσεις",
    render: (row) => row.notes || "—",
  },
  {
    key: "created_at",
    header: "Ανέβηκε",
    sortable: true,
    render: (row) => formatDate(row.created_at),
  },
];

// ─── Initial form state ─────────────────────────────────────────────────────

const emptyForm = {
  field_id: "",
  url: "",
  taken_at: "",
  notes: "",
};

// ─── Page component ─────────────────────────────────────────────────────────

export function FieldPhotosListPage() {
  const table = useTableQuery<FieldPhoto>({
    endpoint: "/field-photos",
    defaultSortBy: "created_at",
    defaultSortDir: "desc",
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const isEmpty =
    !table.isLoading &&
    table.total === 0 &&
    !table.search &&
    Object.keys(table.filters).length === 0;

  const openModal = () => {
    setForm(emptyForm);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.field_id.trim()) {
      toast.error("Το χωράφι είναι υποχρεωτικό");
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
      setModalOpen(false);
      table.refetch();
    } catch {
      toast.error("Αποτυχία προσθήκης");
    } finally {
      setSaving(false);
    }
  };

  const set = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <>
      <PageHeader
        title="Φωτογραφίες Χωραφιών"
        description="Φωτογραφική τεκμηρίωση χωραφιών"
        actions={
          <button className="btn-primary" onClick={openModal}>
            <FiPlus className="h-4 w-4" />
            Ανέβασμα Φωτογραφίας
          </button>
        }
      />

      {isEmpty ? (
        <EmptyState
          icon={FiCamera}
          title="Δεν υπάρχουν φωτογραφίες"
          description="Ξεκινήστε ανεβάζοντας φωτογραφίες."
          action={
            <button className="btn-primary" onClick={openModal}>
              <FiPlus className="h-4 w-4" />
              Ανέβασμα Φωτογραφίας
            </button>
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={table.data}
          keyExtractor={(row) => row.id}
          isLoading={table.isLoading}
          error={table.error}
          search={table.search}
          onSearchChange={table.setSearch}
          searchPlaceholder="Αναζήτηση φωτογραφίας…"
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

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Ανέβασμα Φωτογραφίας"
        footer={
          <>
            <button
              className="btn-secondary"
              onClick={() => setModalOpen(false)}
            >
              Ακύρωση
            </button>
            <button
              className="btn-primary"
              onClick={handleSubmit}
              disabled={saving}
            >
              {saving ? "Αποθήκευση…" : "Προσθήκη"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">
              Χωράφι <span className="text-red-500">*</span>
            </label>
            <input
              className="input"
              value={form.field_id}
              onChange={(e) => set("field_id", e.target.value)}
              placeholder="ID χωραφιού"
            />
          </div>

          <div>
            <label className="label">
              URL Φωτογραφίας <span className="text-red-500">*</span>
            </label>
            <input
              className="input"
              value={form.url}
              onChange={(e) => set("url", e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="label">Ημερομηνία Λήψης</label>
            <input
              className="input"
              type="date"
              value={form.taken_at}
              onChange={(e) => set("taken_at", e.target.value)}
            />
          </div>

          <div>
            <label className="label">Σημειώσεις</label>
            <textarea
              className="input"
              rows={3}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </div>
        </div>
      </Modal>
    </>
  );
}
