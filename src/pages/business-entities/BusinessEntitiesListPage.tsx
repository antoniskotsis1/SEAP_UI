import { useState } from "react";
import { FiUsers, FiPlus } from "react-icons/fi";
import toast from "react-hot-toast";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { TextAreaField } from "@/components/ui/TextAreaField";
import { SelectField } from "@/components/ui/SelectField";
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
          <Button onPress={openModal}>
            <FiPlus className="h-4 w-4" />
            Νέος Παραγωγός
          </Button>
        }
      />

      {isEmpty ? (
        <EmptyState
          icon={FiUsers}
          title="Δεν υπάρχουν παραγωγοί"
          description="Ξεκινήστε προσθέτοντας τον πρώτο παραγωγό."
          action={
            <Button onPress={openModal}>
              <FiPlus className="h-4 w-4" />
              Προσθήκη Παραγωγού
            </Button>
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

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Νέος Παραγωγός"
        footer={
          <>
            <Button variant="secondary" onPress={() => setModalOpen(false)}>
              Ακύρωση
            </Button>
            <Button onPress={handleSubmit} isDisabled={saving}>
              {saving ? "Αποθήκευση…" : "Δημιουργία"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <TextField
            label="Όνομα"
            isRequired
            value={form.display_name}
            onChange={(v) => set("display_name", v)}
            placeholder="π.χ. Γιώργος Παπαδόπουλος"
          />

          <div className="grid grid-cols-2 gap-4">
            <SelectField
              label="Τύπος"
              value={form.type}
              onChange={(e) => set("type", e.target.value)}
            >
              <option value="INDIVIDUAL">Ιδιώτης</option>
              <option value="BUSINESS">Επιχείρηση</option>
            </SelectField>

            <SelectField
              label="Κατάσταση"
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
            >
              <option value="LEAD">Lead</option>
              <option value="ACTIVE">Ενεργός</option>
              <option value="INACTIVE">Ανενεργός</option>
            </SelectField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <TextField
              label="ΑΦΜ"
              value={form.afm}
              onChange={(v) => set("afm", v)}
              placeholder="123456789"
            />
            <TextField
              label="Τηλέφωνο"
              value={form.phone}
              onChange={(v) => set("phone", v)}
              placeholder="69xxxxxxxx"
              inputProps={{ type: "tel" }}
            />
          </div>

          <TextField
            label="Email"
            value={form.email}
            onChange={(v) => set("email", v)}
            placeholder="email@example.com"
            inputProps={{ type: "email" }}
          />

          <TextField
            label="Εκπρόσωπος"
            value={form.representative_name}
            onChange={(v) => set("representative_name", v)}
          />

          <TextField
            label="Περιοχή"
            value={form.region}
            onChange={(v) => set("region", v)}
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
