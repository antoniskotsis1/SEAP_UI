import { useState } from "react";
import { FiBarChart2, FiPlus } from "react-icons/fi";
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
          <Button onPress={openModal}>
            <FiPlus className="h-4 w-4" />
            Νέα Καταγραφή
          </Button>
        }
      />

      {isEmpty ? (
        <EmptyState
          icon={FiBarChart2}
          title="Δεν υπάρχουν καταγραφές"
          description="Ξεκινήστε καταγράφοντας παραγωγή."
          action={
            <Button onPress={openModal}>
              <FiPlus className="h-4 w-4" />
              Προσθήκη Καταγραφής
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
            label="Φύτευση"
            isRequired
            value={form.planting_id}
            onChange={(v) => set("planting_id", v)}
            placeholder="ID φύτευσης"
          />

          <TextField
            label="Έτος Συγκομιδής"
            value={form.harvest_year}
            onChange={(v) => set("harvest_year", v)}
            inputProps={{ type: "number" }}
          />

          <div className="grid grid-cols-2 gap-4">
            <TextField
              label="Μεικτό βάρος (kg)"
              isRequired
              value={form.quantity_kg}
              onChange={(v) => set("quantity_kg", v)}
              placeholder="π.χ. 1500"
              inputProps={{ type: "number", step: "0.1" }}
            />
            <TextField
              label="Καθαρό βάρος (kg)"
              value={form.quantity_clean_kg}
              onChange={(v) => set("quantity_clean_kg", v)}
              placeholder="π.χ. 1350"
              inputProps={{ type: "number", step: "0.1" }}
            />
          </div>

          <TextField
            label="Τιμή / kg (€)"
            value={form.price_per_kg}
            onChange={(v) => set("price_per_kg", v)}
            placeholder="π.χ. 0.85"
            inputProps={{ type: "number", step: "0.01" }}
          />

          <div>
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={form.is_estimate}
                onChange={(e) => set("is_estimate", e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
              Είναι εκτίμηση
            </label>
          </div>

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
