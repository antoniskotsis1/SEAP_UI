import { useState } from "react";
import { FiGrid, FiPlus } from "react-icons/fi";
import toast from "react-hot-toast";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { useTableQuery } from "@/hooks/useTableQuery";
import { api } from "@/lib/api";
import { formatNumber } from "@/lib/utils";
import type { Planting, Variety, Sex, FilterOption } from "@/types";

// ─── Labels ─────────────────────────────────────────────────────────────────

const varietyLabel: Record<Variety, string> = { V22: "V22", V76: "V76" };
const sexLabel: Record<Sex, string> = { FEMALE: "Θηλυκό", MALE: "Αρσενικό" };

// ─── Column definitions ─────────────────────────────────────────────────────

const columns: Column<Planting>[] = [
  {
    key: "sex",
    header: "Φύλο",
    sortable: true,
    render: (row) => (
      <span className={row.sex === "FEMALE" ? "badge-blue" : "badge-gray"}>
        {sexLabel[row.sex]}
      </span>
    ),
  },
  {
    key: "variety",
    header: "Ποικιλία",
    sortable: true,
    render: (row) =>
      row.variety ? (
        <span className="badge-blue">{varietyLabel[row.variety]}</span>
      ) : (
        <span className="text-gray-400">—</span>
      ),
  },
  {
    key: "tree_count",
    header: "Δέντρα",
    sortable: true,
    render: (row) => formatNumber(row.tree_count),
  },
];

// ─── Filter definitions ─────────────────────────────────────────────────────

const filterDefs: FilterOption[] = [
  {
    key: "sex",
    label: "Φύλο",
    options: [
      { value: "FEMALE", label: "Θηλυκό" },
      { value: "MALE", label: "Αρσενικό" },
    ],
  },
  {
    key: "variety",
    label: "Ποικιλία",
    options: [
      { value: "V22", label: "V22" },
      { value: "V76", label: "V76" },
    ],
  },
];

// ─── Initial form state ─────────────────────────────────────────────────────

const emptyForm = {
  field_id: "",
  sex: "FEMALE" as Sex,
  variety: "V22" as Variety | "",
  tree_count: "",
};

// ─── Page component ─────────────────────────────────────────────────────────

export function PlantingsListPage() {
  const table = useTableQuery<Planting>({
    endpoint: "/plantings",
    defaultSortBy: "tree_count",
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
    if (!form.tree_count) {
      toast.error("Ο αριθμός δέντρων είναι υποχρεωτικός");
      return;
    }
    if (form.sex === "FEMALE" && !form.variety) {
      toast.error("Η ποικιλία είναι υποχρεωτική για θηλυκά δέντρα");
      return;
    }
    setSaving(true);
    try {
      await api.post("/plantings", {
        field_id: form.field_id,
        sex: form.sex,
        variety: form.sex === "FEMALE" ? form.variety : undefined,
        tree_count: Number(form.tree_count),
      });
      toast.success("Η φύτευση δημιουργήθηκε");
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
        title="Φυτεύσεις"
        description="Διαχείριση φυτεύσεων ανά χωράφι"
        actions={
          <button className="btn-primary" onClick={openModal}>
            <FiPlus className="h-4 w-4" />
            Νέα Φύτευση
          </button>
        }
      />

      {isEmpty ? (
        <EmptyState
          icon={FiGrid}
          title="Δεν υπάρχουν φυτεύσεις"
          description="Ξεκινήστε καταχωρώντας μια φύτευση."
          action={
            <button className="btn-primary" onClick={openModal}>
              <FiPlus className="h-4 w-4" />
              Προσθήκη Φύτευσης
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
          searchPlaceholder="Αναζήτηση φύτευσης…"
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
        title="Νέα Φύτευση"
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
              Χωράφι <span className="text-red-500">*</span>
            </label>
            <input
              className="input"
              value={form.field_id}
              onChange={(e) => set("field_id", e.target.value)}
              placeholder="ID χωραφιού"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Φύλο</label>
              <select
                className="input"
                value={form.sex}
                onChange={(e) => {
                  set("sex", e.target.value);
                  if (e.target.value === "MALE") set("variety", "");
                }}
              >
                <option value="FEMALE">Θηλυκό</option>
                <option value="MALE">Αρσενικό (επικονιαστής)</option>
              </select>
            </div>

            {form.sex === "FEMALE" && (
              <div>
                <label className="label">
                  Ποικιλία <span className="text-red-500">*</span>
                </label>
                <select
                  className="input"
                  value={form.variety}
                  onChange={(e) => set("variety", e.target.value)}
                >
                  <option value="">—</option>
                  <option value="V22">V22</option>
                  <option value="V76">V76</option>
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="label">
              Αριθμός Δέντρων <span className="text-red-500">*</span>
            </label>
            <input
              className="input"
              type="number"
              value={form.tree_count}
              onChange={(e) => set("tree_count", e.target.value)}
              placeholder="π.χ. 500"
            />
          </div>
        </div>
      </Modal>
    </>
  );
}
