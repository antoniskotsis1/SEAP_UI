import { useState } from "react";
import { FiDollarSign, FiPlus } from "react-icons/fi";
import toast from "react-hot-toast";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
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

// ─── Column definitions ─────────────────────────────────────────────────────

const columns: Column<FinancialTransaction>[] = [
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
  const table = useTableQuery<FinancialTransaction>({
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
          <button className="btn-primary" onClick={openModal}>
            <FiPlus className="h-4 w-4" />
            Νέα Συναλλαγή
          </button>
        }
      />

      {isEmpty ? (
        <EmptyState
          icon={FiDollarSign}
          title="Δεν υπάρχουν συναλλαγές"
          description="Ξεκινήστε καταχωρώντας μια συναλλαγή."
          action={
            <button className="btn-primary" onClick={openModal}>
              <FiPlus className="h-4 w-4" />
              Προσθήκη Συναλλαγής
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
              Παραγωγός <span className="text-red-500">*</span>
            </label>
            <input
              className="input"
              value={form.business_entity_id}
              onChange={(e) => set("business_entity_id", e.target.value)}
              placeholder="ID παραγωγού"
            />
          </div>

          <div>
            <label className="label">Χωράφι (προαιρετικό)</label>
            <input
              className="input"
              value={form.field_id}
              onChange={(e) => set("field_id", e.target.value)}
              placeholder="ID χωραφιού"
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
                <option value="PAYMENT">Πληρωμή</option>
                <option value="DEBT">Οφειλή</option>
                <option value="OFFSET">Συμψηφισμός</option>
              </select>
            </div>
            <div>
              <label className="label">Έτος</label>
              <input
                className="input"
                type="number"
                value={form.year}
                onChange={(e) => set("year", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">
                Ποσό (€) <span className="text-red-500">*</span>
              </label>
              <input
                className="input"
                type="number"
                step="0.01"
                value={form.amount}
                onChange={(e) => set("amount", e.target.value)}
                placeholder="π.χ. 1500.00"
              />
            </div>
            <div>
              <label className="label">Ακατέργαστο ποσό</label>
              <input
                className="input"
                value={form.raw_amount}
                onChange={(e) => set("raw_amount", e.target.value)}
                placeholder="π.χ. 1200+288"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Στρέμματα</label>
              <input
                className="input"
                type="number"
                step="0.1"
                value={form.stremmata_covered}
                onChange={(e) => set("stremmata_covered", e.target.value)}
              />
            </div>
            <div>
              <label className="label">Ημερομηνία</label>
              <input
                className="input"
                type="date"
                value={form.transaction_date}
                onChange={(e) => set("transaction_date", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Κατάσταση Τιμολογίου</label>
              <select
                className="input"
                value={form.invoice_status}
                onChange={(e) => set("invoice_status", e.target.value)}
              >
                <option value="NOT_ISSUED">Δεν εκδόθηκε</option>
                <option value="ISSUED">Εκδόθηκε</option>
                <option value="PARTIAL">Μερική</option>
              </select>
            </div>
            <div>
              <label className="label">Αρ. / Αναφορά Τιμολογίου</label>
              <input
                className="input"
                value={form.invoice_reference}
                onChange={(e) => set("invoice_reference", e.target.value)}
                placeholder="π.χ. ΤΙΜ 1.488"
              />
            </div>
          </div>

          <div>
            <label className="label">Σημείωση ΦΠΑ</label>
            <input
              className="input"
              value={form.vat_note}
              onChange={(e) => set("vat_note", e.target.value)}
              placeholder="π.χ. δεν έβαλε ΦΠΑ"
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
