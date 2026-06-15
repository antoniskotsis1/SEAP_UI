import { useState } from "react";
import { FiCamera, FiPlus } from "react-icons/fi";
import toast from "react-hot-toast";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { TextAreaField } from "@/components/ui/TextAreaField";
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
          <Button onPress={openModal}>
            <FiPlus className="h-4 w-4" />
            Ανέβασμα Φωτογραφίας
          </Button>
        }
      />

      {isEmpty ? (
        <EmptyState
          icon={FiCamera}
          title="Δεν υπάρχουν φωτογραφίες"
          description="Ξεκινήστε ανεβάζοντας φωτογραφίες."
          action={
            <Button onPress={openModal}>
              <FiPlus className="h-4 w-4" />
              Ανέβασμα Φωτογραφίας
            </Button>
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
            <Button variant="secondary" onPress={() => setModalOpen(false)}>
              Ακύρωση
            </Button>
            <Button onPress={handleSubmit} isDisabled={saving}>
              {saving ? "Αποθήκευση…" : "Προσθήκη"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <TextField
            label="Χωράφι"
            isRequired
            value={form.field_id}
            onChange={(v) => set("field_id", v)}
            placeholder="ID χωραφιού"
          />

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
      </Modal>
    </>
  );
}
