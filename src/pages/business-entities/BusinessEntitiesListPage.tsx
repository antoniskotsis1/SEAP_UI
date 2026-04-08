import { useState } from "react";
import { FiUsers, FiPlus } from "react-icons/fi";
import toast from "react-hot-toast";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { useTableQuery } from "@/hooks/useTableQuery";
import { api } from "@/lib/api";
import type {
  BusinessEntity,
  BusinessEntityType,
  BusinessEntityStatus,
  FilterOption,
} from "@/types";
import { cn } from "@/lib/utils";

// ─── Column definitions ─────────────────────────────────────────────────────

const columns: Column<BusinessEntity>[] = [
  {
    key: "display_name",
    header: "Όνομα",
    sortable: true,
    render: (row) => (
      <span className="font-medium text-gray-900">{row.display_name}</span>
    ),
  },
  {
    key: "type",
    header: "Τύπος",
    sortable: true,
    render: (row) => (
      <span className={row.type === "BUSINESS" ? "badge-blue" : "badge-gray"}>
        {row.type === "BUSINESS" ? "Επιχείρηση" : "Ιδιώτης"}
      </span>
    ),
  },
  {
    key: "status",
    header: "Κατάσταση",
    sortable: true,
    render: (row) => (
      <span
        className={cn(
          row.status === "ACTIVE" && "badge-green",
          row.status === "LEAD" && "badge-yellow",
          row.status === "INACTIVE" && "badge-gray"
        )}
      >
        {row.status === "ACTIVE"
          ? "Ενεργός"
          : row.status === "LEAD"
            ? "Lead"
            : "Ανενεργός"}
      </span>
    ),
  },
  {
    key: "phone",
    header: "Τηλέφωνο",
    render: (row) => row.phone || "—",
  },
  {
    key: "region",
    header: "Περιοχή",
    sortable: true,
    render: (row) => row.region || "—",
  },
];

// ─── Filter definitions ─────────────────────────────────────────────────────

const filterDefs: FilterOption[] = [
  {
    key: "type",
    label: "Τύπος",
    options: [
      { value: "INDIVIDUAL", label: "Ιδιώτης" },
      { value: "BUSINESS", label: "Επιχείρηση" },
    ],
  },
  {
    key: "status",
    label: "Κατάσταση",
    options: [
      { value: "LEAD", label: "Lead" },
      { value: "ACTIVE", label: "Ενεργός" },
      { value: "INACTIVE", label: "Ανενεργός" },
    ],
  },
];

// ─── Initial form state ─────────────────────────────────────────────────────

const emptyForm = {
  display_name: "",
  type: "INDIVIDUAL" as BusinessEntityType,
  status: "LEAD" as BusinessEntityStatus,
  afm: "",
  phone: "",
  email: "",
  representative_name: "",
  region: "",
  notes: "",
};

// ─── Page component ─────────────────────────────────────────────────────────

export function BusinessEntitiesListPage() {
  const table = useTableQuery<BusinessEntity>({
    endpoint: "/business-entities",
    defaultSortBy: "display_name",
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
    if (!form.display_name.trim()) {
      toast.error("Το όνομα είναι υποχρεωτικό");
      return;
    }
    setSaving(true);
    try {
      await api.post("/business-entities", form);
      toast.success("Ο παραγωγός δημιουργήθηκε");
      setModalOpen(false);
      table.refetch();
    } catch {
      toast.error("Αποτυχία δημιουργίας");
    } finally {
      setSaving(false);
    }
  };

  const set = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <>
      <PageHeader
        title="Παραγωγοί"
        description="Διαχείριση παραγωγών και επιχειρήσεων"
        actions={
          <button className="btn-primary" onClick={openModal}>
            <FiPlus className="h-4 w-4" />
            Νέος Παραγωγός
          </button>
        }
      />

      {isEmpty ? (
        <EmptyState
          icon={FiUsers}
          title="Δεν υπάρχουν παραγωγοί"
          description="Ξεκινήστε προσθέτοντας τον πρώτο παραγωγό."
          action={
            <button className="btn-primary" onClick={openModal}>
              <FiPlus className="h-4 w-4" />
              Προσθήκη Παραγωγού
            </button>
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={table.data}
          keyExtractor={(row) => row.id}
          onRowClick={(row) => console.log("Navigate to", row.id)}
          isLoading={table.isLoading}
          error={table.error}
          search={table.search}
          onSearchChange={table.setSearch}
          searchPlaceholder="Αναζήτηση ονόματος, ΑΦΜ, τηλεφώνου…"
          filters={filterDefs}
          activeFilters={table.filters}
          onFilterChange={table.setFilter}
          onClearFilters={table.clearFilters}
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

      {/* ── Create modal ──────────────────────────────────────────── */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Νέος Παραγωγός"
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
              {saving ? "Αποθήκευση…" : "Δημιουργία"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">
              Όνομα <span className="text-red-500">*</span>
            </label>
            <input
              className="input"
              value={form.display_name}
              onChange={(e) => set("display_name", e.target.value)}
              placeholder="π.χ. Γιώργος Παπαδόπουλος"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Τύπος</label>
              <select
                className="input"
                value={form.type}
                onChange={(e) => set("type", e.target.value)}
              >
                <option value="INDIVIDUAL">Ιδιώτης</option>
                <option value="BUSINESS">Επιχείρηση</option>
              </select>
            </div>
            <div>
              <label className="label">Κατάσταση</label>
              <select
                className="input"
                value={form.status}
                onChange={(e) => set("status", e.target.value)}
              >
                <option value="LEAD">Lead</option>
                <option value="ACTIVE">Ενεργός</option>
                <option value="INACTIVE">Ανενεργός</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">ΑΦΜ</label>
              <input
                className="input"
                value={form.afm}
                onChange={(e) => set("afm", e.target.value)}
                placeholder="123456789"
              />
            </div>
            <div>
              <label className="label">Τηλέφωνο</label>
              <input
                className="input"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="69xxxxxxxx"
              />
            </div>
          </div>

          <div>
            <label className="label">Email</label>
            <input
              className="input"
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="email@example.com"
            />
          </div>

          <div>
            <label className="label">Εκπρόσωπος</label>
            <input
              className="input"
              value={form.representative_name}
              onChange={(e) => set("representative_name", e.target.value)}
            />
          </div>

          <div>
            <label className="label">Περιοχή</label>
            <input
              className="input"
              value={form.region}
              onChange={(e) => set("region", e.target.value)}
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
