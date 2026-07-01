import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { FiUsers, FiPlus } from "react-icons/fi";
import toast from "react-hot-toast";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { FormModal } from "@/components/ui/FormModal";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { TextAreaField } from "@/components/ui/TextAreaField";
import { SelectField } from "@/components/ui/SelectField";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { ProducerDetailModal } from "@/components/entities/ProducerDetailModal";
import { useTableQuery } from "@/hooks/useTableQuery";
import { api } from "@/lib/api";
import { entityTypeLabel, entityTypeBadge } from "@/lib/labels";
import type {
  BusinessEntity,
  BusinessEntityType,
  BusinessEntityStatus,
  FilterOption,
} from "@/types";

// ─── Column definitions ─────────────────────────────────────────────────────

const columns: Column<BusinessEntity>[] = [
  {
    key: "display_name",
    header: "Όνομα",
    sortable: true,
    render: (row) => (
      <span className="font-medium text-gray-900 group-hover:text-brand-600 transition-colors">
        {row.display_name}
      </span>
    ),
  },

  {
    key: "type",
    header: "Τύπος",
    sortable: true,
    render: (row) => (
      <span className={entityTypeBadge(row.type)}>
        {entityTypeLabel[row.type]}
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
  const [searchParams] = useSearchParams();
  const urlStatus = searchParams.get("status") ?? "";

  const table = useTableQuery<BusinessEntity>({
    endpoint: "/business-entities",
    defaultSortBy: "display_name",
    defaultFilters: urlStatus ? { status: urlStatus } : {},
  });

  const { setFilter } = table;
  useEffect(() => {
    setFilter("status", urlStatus);
  }, [urlStatus, setFilter]);

  // ── Creation modal ──────────────────────────────────────────────────────
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  // ── Detail modal ────────────────────────────────────────────────────────
  const [detailEntity, setDetailEntity] = useState<BusinessEntity | null>(null);

  const isEmpty =
    !table.isLoading &&
    table.total === 0 &&
    !table.search &&
    Object.keys(table.filters).length === 0;

  const openCreate = () => {
    setForm(emptyForm);
    setCreateOpen(true);
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
      setCreateOpen(false);
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
          <Button onPress={openCreate}>
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
            <Button onPress={openCreate}>
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
          onRowClick={setDetailEntity}
          isLoading={table.isLoading}
          error={table.error}
          search={table.search}
          onSearchChange={table.setSearch}
          searchPlaceholder="Αναζήτηση ονόματος, ΑΦΜ, τηλεφώνου…"
          filters={filterDefs}
          activeFilters={{ type: table.filters.type ?? "" }}
          onFilterChange={table.setFilter}
          onClearFilters={() => {
            table.setFilter("type", "");
            table.setSearch("");
          }}
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

      {/* ── Producer detail modal ────────────────────────────────────────── */}
      <ProducerDetailModal
        entity={detailEntity}
        onClose={() => setDetailEntity(null)}
      />

      {/* ── Create producer modal ────────────────────────────────────────── */}
      <FormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Νέος Παραγωγός"
        onSubmit={handleSubmit}
        saving={saving}
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
      </FormModal>
    </>
  );
}
