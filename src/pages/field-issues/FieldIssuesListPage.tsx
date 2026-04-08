import { useState } from "react";
import { FiAlertTriangle, FiPlus } from "react-icons/fi";
import toast from "react-hot-toast";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { useTableQuery } from "@/hooks/useTableQuery";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type {
  FieldIssue,
  IssueSeverity,
  IssueStatus,
  FilterOption,
} from "@/types";

// ─── Labels ─────────────────────────────────────────────────────────────────

const severityLabel: Record<IssueSeverity, string> = {
  LOW: "Χαμηλή",
  MEDIUM: "Μέτρια",
  HIGH: "Υψηλή",
};

const statusLabel: Record<IssueStatus, string> = {
  OPEN: "Ανοιχτό",
  RESOLVED: "Επιλύθηκε",
};

// ─── Column definitions ─────────────────────────────────────────────────────

const columns: Column<FieldIssue>[] = [
  {
    key: "description",
    header: "Περιγραφή",
    render: (row) => (
      <span className="font-medium text-gray-900 line-clamp-1">
        {row.description}
      </span>
    ),
  },
  {
    key: "severity",
    header: "Σοβαρότητα",
    sortable: true,
    render: (row) => (
      <span
        className={cn(
          row.severity === "HIGH" && "badge-red",
          row.severity === "MEDIUM" && "badge-yellow",
          row.severity === "LOW" && "badge-gray"
        )}
      >
        {severityLabel[row.severity]}
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
          row.status === "OPEN" && "badge-yellow",
          row.status === "RESOLVED" && "badge-green"
        )}
      >
        {statusLabel[row.status]}
      </span>
    ),
  },
  {
    key: "reported_at",
    header: "Αναφορά",
    sortable: true,
    render: (row) => formatDate(row.reported_at),
  },
  {
    key: "resolved_at",
    header: "Επίλυση",
    render: (row) => formatDate(row.resolved_at),
  },
];

// ─── Filter definitions ─────────────────────────────────────────────────────

const filterDefs: FilterOption[] = [
  {
    key: "severity",
    label: "Σοβαρότητα",
    options: [
      { value: "LOW", label: "Χαμηλή" },
      { value: "MEDIUM", label: "Μέτρια" },
      { value: "HIGH", label: "Υψηλή" },
    ],
  },
  {
    key: "status",
    label: "Κατάσταση",
    options: [
      { value: "OPEN", label: "Ανοιχτό" },
      { value: "RESOLVED", label: "Επιλύθηκε" },
    ],
  },
];

// ─── Initial form state ─────────────────────────────────────────────────────

const emptyForm = {
  field_id: "",
  description: "",
  severity: "MEDIUM" as IssueSeverity,
  status: "OPEN" as IssueStatus,
  reported_at: new Date().toISOString().split("T")[0],
};

// ─── Page component ─────────────────────────────────────────────────────────

export function FieldIssuesListPage() {
  const table = useTableQuery<FieldIssue>({
    endpoint: "/field-issues",
    defaultSortBy: "reported_at",
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
    setForm({
      ...emptyForm,
      reported_at: new Date().toISOString().split("T")[0],
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.field_id.trim()) {
      toast.error("Το χωράφι είναι υποχρεωτικό");
      return;
    }
    if (!form.description.trim()) {
      toast.error("Η περιγραφή είναι υποχρεωτική");
      return;
    }
    setSaving(true);
    try {
      await api.post("/field-issues", form);
      toast.success("Η αναφορά δημιουργήθηκε");
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
        title="Προβλήματα Χωραφιών"
        description="Αναφορά και παρακολούθηση προβλημάτων"
        actions={
          <button className="btn-primary" onClick={openModal}>
            <FiPlus className="h-4 w-4" />
            Νέα Αναφορά
          </button>
        }
      />

      {isEmpty ? (
        <EmptyState
          icon={FiAlertTriangle}
          title="Δεν υπάρχουν αναφορές"
          description="Ξεκινήστε αναφέροντας ένα πρόβλημα."
          action={
            <button className="btn-primary" onClick={openModal}>
              <FiPlus className="h-4 w-4" />
              Νέα Αναφορά
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
          searchPlaceholder="Αναζήτηση αναφοράς…"
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
        title="Νέα Αναφορά Προβλήματος"
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

          <div>
            <label className="label">
              Περιγραφή <span className="text-red-500">*</span>
            </label>
            <textarea
              className="input"
              rows={3}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Περιγράψτε το πρόβλημα…"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Σοβαρότητα</label>
              <select
                className="input"
                value={form.severity}
                onChange={(e) => set("severity", e.target.value)}
              >
                <option value="LOW">Χαμηλή</option>
                <option value="MEDIUM">Μέτρια</option>
                <option value="HIGH">Υψηλή</option>
              </select>
            </div>
            <div>
              <label className="label">Ημερομηνία Αναφοράς</label>
              <input
                className="input"
                type="date"
                value={form.reported_at}
                onChange={(e) => set("reported_at", e.target.value)}
              />
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
