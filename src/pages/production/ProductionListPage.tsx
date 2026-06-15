import { useState } from "react";
import { FiBarChart2, FiPlus } from "react-icons/fi";
import toast from "react-hot-toast";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { useTableQuery } from "@/hooks/useTableQuery";
import { api } from "@/lib/api";
import { formatNumber, formatCurrency, formatDate } from "@/lib/utils";
import type { ProductionRecord } from "@/types";

// ─── Column definitions ─────────────────────────────────────────────────────

const columns: Column<ProductionRecord>[] = [
  {
    key: "harvest_year",
    header: "Έτος Συγκομιδής",
    sortable: true,
    render: (row) => (
      <span className="font-medium text-gray-900">
        {String(row.harvest_year)}
      </span>
    ),
  },
  {
    key: "quantity_kg",
    header: "Μεικτό (kg)",
    sortable: true,
    render: (row) => formatNumber(row.quantity_kg),
  },
  {
    key: "quantity_clean_kg",
    header: "Καθαρό (kg)",
    sortable: true,
    render: (row) =>
      row.quantity_clean_kg !== undefined
        ? formatNumber(row.quantity_clean_kg)
        : "—",
  },
  {
    key: "price_per_kg",
    header: "Τιμή/kg",
    render: (row) =>
      row.price_per_kg !== undefined ? formatCurrency(row.price_per_kg) : "—",
  },
  {
    key: "is_estimate",
    header: "Τύπος",
    render: (row) => (
      <span className={row.is_estimate ? "badge-yellow" : "badge-green"}>
        {row.is_estimate ? "Εκτίμηση" : "Πραγματικό"}
      </span>
    ),
  },
  {
    key: "notes",
    header: "Σημειώσεις",
    render: (row) => row.notes || "—",
  },
  {
    key: "created_at",
    header: "Δημιουργία",
    sortable: true,
    render: (row) => formatDate(row.created_at),
  },
];

// ─── Initial form state ─────────────────────────────────────────────────────

const emptyForm = {
  planting_id: "",
  harvest_year: String(new Date().getFullYear()),
  quantity_kg: "",
  quantity_clean_kg: "",
  is_estimate: false,
  price_per_kg: "",
  notes: "",
};

// ─── Page component ─────────────────────────────────────────────────────────

export function ProductionListPage() {
  const table = useTableQuery<ProductionRecord>({
    endpoint: "/production",
    defaultSortBy: "harvest_year",
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
    if (!form.planting_id.trim()) {
      toast.error("Η φύτευση είναι υποχρεωτική");
      return;
    }
    if (!form.quantity_kg) {
      toast.error("Η ποσότητα (μεικτό) είναι υποχρεωτική");
      return;
    }
    setSaving(true);
    try {
      await api.post("/production", {
        planting_id: form.planting_id,
        harvest_year: Number(form.harvest_year),
        quantity_kg: Number(form.quantity_kg),
        quantity_clean_kg: form.quantity_clean_kg
          ? Number(form.quantity_clean_kg)
          : undefined,
        is_estimate: form.is_estimate,
        price_per_kg: form.price_per_kg ? Number(form.price_per_kg) : undefined,
        notes: form.notes || undefined,
      });
      toast.success("Η καταγραφή δημιουργήθηκε");
      setModalOpen(false);
      table.refetch();
    } catch {
      toast.error("Αποτυχία δημιουργίας");
    } finally {
      setSaving(false);
    }
  };

  const set = (key: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <>
      <PageHeader
        title="Παραγωγή"
        description="Καταγραφή παραγωγής ανά φύτευση και έτος"
        actions={
          <button className="btn-primary" onClick={openModal}>
            <FiPlus className="h-4 w-4" />
            Νέα Καταγραφή
          </button>
        }
      />

      {isEmpty ? (
        <EmptyState
          icon={FiBarChart2}
          title="Δεν υπάρχουν καταγραφές"
          description="Ξεκινήστε καταγράφοντας παραγωγή."
          action={
            <button className="btn-primary" onClick={openModal}>
              <FiPlus className="h-4 w-4" />
              Προσθήκη Καταγραφής
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
          searchPlaceholder="Αναζήτηση καταγραφής…"
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
        title="Νέα Καταγραφή Παραγωγής"
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
              Φύτευση <span className="text-red-500">*</span>
            </label>
            <input
              className="input"
              value={form.planting_id}
              onChange={(e) => set("planting_id", e.target.value)}
              placeholder="ID φύτευσης"
            />
          </div>

          <div>
            <label className="label">Έτος Συγκομιδής</label>
            <input
              className="input"
              type="number"
              value={form.harvest_year}
              onChange={(e) => set("harvest_year", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">
                Μεικτό βάρος (kg) <span className="text-red-500">*</span>
              </label>
              <input
                className="input"
                type="number"
                step="0.1"
                value={form.quantity_kg}
                onChange={(e) => set("quantity_kg", e.target.value)}
                placeholder="π.χ. 1500"
              />
            </div>
            <div>
              <label className="label">Καθαρό βάρος (kg)</label>
              <input
                className="input"
                type="number"
                step="0.1"
                value={form.quantity_clean_kg}
                onChange={(e) => set("quantity_clean_kg", e.target.value)}
                placeholder="π.χ. 1350"
              />
            </div>
          </div>

          <div>
            <label className="label">Τιμή / kg (€)</label>
            <input
              className="input"
              type="number"
              step="0.01"
              value={form.price_per_kg}
              onChange={(e) => set("price_per_kg", e.target.value)}
              placeholder="π.χ. 0.85"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.is_estimate}
                onChange={(e) => set("is_estimate", e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
              Είναι εκτίμηση
            </label>
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
