import { useState } from "react";
import { FiDollarSign, FiPlus } from "react-icons/fi";
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
import { formatCurrency, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type {
  FinancialTransaction,
  TransactionType,
  InvoiceStatus,
  FilterOption,
} from "@/types";

// ─── Labels ─────────────────────────────────────────────────────────────────

const typeLabel: Record<TransactionType, string> = {
  PAYMENT: "Πληρωμή",
  DEBT: "Οφειλή",
  OFFSET: "Συμψηφισμός",
};
const invoiceLabel: Record<InvoiceStatus, string> = {
  ISSUED: "Εκδόθηκε",
  NOT_ISSUED: "Δεν εκδόθηκε",
  PARTIAL: "Μερική",
};

// ─── Extended row type ───────────────────────────────────────────────────────

type FinancialRow = FinancialTransaction & { owner_name?: string };

// ─── Column definitions ─────────────────────────────────────────────────────

const columns: Column<FinancialRow>[] = [
  {
    key: "owner_name",
    header: "Παραγωγός",
    sortable: true,
    render: (row) => (
      <span className="font-medium text-gray-900">{row.owner_name || "—"}</span>
    ),
  },
  {
    key: "type",
    header: "Τύπος",
    sortable: true,
    render: (row) => (
      <span
        className={cn(
          row.type === "PAYMENT" && "badge-green",
          row.type === "DEBT" && "badge-red",
          row.type === "OFFSET" && "badge-blue"
        )}
      >
        {typeLabel[row.type]}
      </span>
    ),
  },
  {
    key: "year",
    header: "Έτος",
    sortable: true,
    render: (row) => String(row.year),
  },
  {
    key: "amount",
    header: "Ποσό",
    sortable: true,
    render: (row) => (
      <span className="font-medium text-gray-900">
        {formatCurrency(row.amount)}
        {row.raw_amount && (
          <span className="ml-1 text-xs text-gray-400">({row.raw_amount})</span>
        )}
      </span>
    ),
  },
  {
    key: "invoice_status",
    header: "Τιμολόγιο",
    render: (row) => (
      <span
        className={cn(
          row.invoice_status === "ISSUED" && "badge-green",
          row.invoice_status === "NOT_ISSUED" && "badge-gray",
          row.invoice_status === "PARTIAL" && "badge-yellow"
        )}
      >
        {invoiceLabel[row.invoice_status]}
      </span>
    ),
  },
  {
    key: "invoice_reference",
    header: "Αρ. Τιμολογίου",
    render: (row) => row.invoice_reference || "—",
  },
  {
    key: "transaction_date",
    header: "Ημερομηνία",
    sortable: true,
    render: (row) => formatDate(row.transaction_date),
  },
];

// ─── Filter definitions ─────────────────────────────────────────────────────

const filterDefs: FilterOption[] = [
  {
    key: "type",
    label: "Τύπος",
    options: [
      { value: "PAYMENT", label: "Πληρωμή" },
      { value: "DEBT", label: "Οφειλή" },
      { value: "OFFSET", label: "Συμψηφισμός" },
    ],
  },
  {
    key: "invoice_status",
    label: "Τιμολόγιο",
    options: [
      { value: "ISSUED", label: "Εκδόθηκε" },
      { value: "NOT_ISSUED", label: "Δεν εκδόθηκε" },
      { value: "PARTIAL", label: "Μερική" },
    ],
  },
];

// ─── Initial form state ─────────────────────────────────────────────────────

const emptyForm = {
  business_entity_id: "",
  field_id: "",
  type: "PAYMENT" as TransactionType,
  year: String(new Date().getFullYear()),
  stremmata_covered: "",
  amount: "",
  raw_amount: "",
  invoice_status: "NOT_ISSUED" as InvoiceStatus,
  invoice_reference: "",
  vat_note: "",
  notes: "",
  transaction_date: "",
};

// ─── Page component ─────────────────────────────────────────────────────────

export function FinancialsListPage() {
  const table = useTableQuery<FinancialRow>({
    endpoint: "/financials",
    defaultSortBy: "transaction_date",
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
    if (!form.business_entity_id.trim()) {
      toast.error("Ο παραγωγός είναι υποχρεωτικός");
      return;
    }
    if (!form.amount) {
      toast.error("Το ποσό είναι υποχρεωτικό");
      return;
    }
    setSaving(true);
    try {
      await api.post("/financials", {
        business_entity_id: form.business_entity_id,
        field_id: form.field_id || undefined,
        type: form.type,
        year: Number(form.year),
        stremmata_covered: form.stremmata_covered
          ? Number(form.stremmata_covered)
          : undefined,
        amount: Number(form.amount),
        raw_amount: form.raw_amount || undefined,
        invoice_status: form.invoice_status,
        invoice_reference: form.invoice_reference || undefined,
        vat_note: form.vat_note || undefined,
        notes: form.notes || undefined,
        transaction_date: form.transaction_date || undefined,
      });
      toast.success("Η συναλλαγή δημιουργήθηκε");
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
        title="Οικονομικά"
        description="Πληρωμές, οφειλές και τιμολόγια"
        actions={
          <Button onPress={openModal}>
            <FiPlus className="h-4 w-4" />
            Νέα Συναλλαγή
          </Button>
        }
      />

      {isEmpty ? (
        <EmptyState
          icon={FiDollarSign}
          title="Δεν υπάρχουν συναλλαγές"
          description="Ξεκινήστε καταχωρώντας μια συναλλαγή."
          action={
            <Button onPress={openModal}>
              <FiPlus className="h-4 w-4" />
              Προσθήκη Συναλλαγής
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
          searchPlaceholder="Αναζήτηση συναλλαγής…"
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
        title="Νέα Συναλλαγή"
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
            label="Παραγωγός"
            isRequired
            value={form.business_entity_id}
            onChange={(v) => set("business_entity_id", v)}
            placeholder="ID παραγωγού"
          />

          <TextField
            label="Χωράφι (προαιρετικό)"
            value={form.field_id}
            onChange={(v) => set("field_id", v)}
            placeholder="ID χωραφιού"
          />

          <div className="grid grid-cols-2 gap-4">
            <SelectField
              label="Τύπος"
              value={form.type}
              onChange={(e) => set("type", e.target.value)}
            >
              <option value="PAYMENT">Πληρωμή</option>
              <option value="DEBT">Οφειλή</option>
              <option value="OFFSET">Συμψηφισμός</option>
            </SelectField>

            <TextField
              label="Έτος"
              value={form.year}
              onChange={(v) => set("year", v)}
              inputProps={{ type: "number" }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <TextField
              label="Ποσό (€)"
              isRequired
              value={form.amount}
              onChange={(v) => set("amount", v)}
              placeholder="π.χ. 1500.00"
              inputProps={{ type: "number", step: "0.01" }}
            />
            <TextField
              label="Ακατέργαστο ποσό"
              value={form.raw_amount}
              onChange={(v) => set("raw_amount", v)}
              placeholder="π.χ. 1200+288"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <TextField
              label="Στρέμματα"
              value={form.stremmata_covered}
              onChange={(v) => set("stremmata_covered", v)}
              inputProps={{ type: "number", step: "0.1" }}
            />
            <TextField
              label="Ημερομηνία"
              value={form.transaction_date}
              onChange={(v) => set("transaction_date", v)}
              inputProps={{ type: "date" }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <SelectField
              label="Κατάσταση Τιμολογίου"
              value={form.invoice_status}
              onChange={(e) => set("invoice_status", e.target.value)}
            >
              <option value="NOT_ISSUED">Δεν εκδόθηκε</option>
              <option value="ISSUED">Εκδόθηκε</option>
              <option value="PARTIAL">Μερική</option>
            </SelectField>

            <TextField
              label="Αρ. / Αναφορά Τιμολογίου"
              value={form.invoice_reference}
              onChange={(v) => set("invoice_reference", v)}
              placeholder="π.χ. ΤΙΜ 1.488"
            />
          </div>

          <TextField
            label="Σημείωση ΦΠΑ"
            value={form.vat_note}
            onChange={(v) => set("vat_note", v)}
            placeholder="π.χ. δεν έβαλε ΦΠΑ"
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
