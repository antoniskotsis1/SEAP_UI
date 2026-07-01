import { useState } from "react";
import { FiAlertTriangle, FiMap, FiPlus } from "react-icons/fi";
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
import { FieldDetailModal } from "@/components/entities/FieldDetailModal";
import { useTableQuery } from "@/hooks/useTableQuery";
import { useLookupModal } from "@/hooks/useLookupModal";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import {
  severityLabel,
  severityBadge,
  issueStatusLabel,
  issueStatusBadge,
} from "@/lib/labels";
import type {
  FieldIssue,
  IssueSeverity,
  IssueStatus,
  FilterOption,
  BusinessEntity,
  FieldListItem,
} from "@/types";

// ─── Extended row type ───────────────────────────────────────────────────────

type IssueRow = FieldIssue & {
  field_name?: string;
  owner_name?: string;
  business_entity_id?: string;
};

// ─── Column definitions ─────────────────────────────────────────────────────

function buildColumns(
  onFieldClick: (row: IssueRow) => void,
  onOwnerClick: (row: IssueRow) => void,
): Column<IssueRow>[] {
  return [
    {
      key: "title",
      header: "Τίτλος",
      sortable: true,
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-gray-900">{row.title}</p>
          {(row.field_name || row.owner_name) && (
            <div className="mt-0.5 flex items-center gap-1 text-xs text-gray-400">
              <FiMap className="h-3 w-3 shrink-0" />
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onFieldClick(row); }}
                className="truncate text-left hover:text-brand-500"
              >
                {row.field_name}
              </button>
              {row.field_name && row.owner_name && (
                <span className="text-gray-300">·</span>
              )}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onOwnerClick(row); }}
                className="truncate text-left hover:text-brand-500"
              >
                {row.owner_name}
              </button>
            </div>
          )}
        </div>
      ),
    },
    {
      key: "severity",
      header: "Σοβαρότητα",
      sortable: true,
      render: (row) => (
        <span className={severityBadge[row.severity]}>
          {severityLabel[row.severity]}
        </span>
      ),
    },
    {
      key: "status",
      header: "Κατάσταση",
      sortable: true,
      render: (row) => (
        <span className={issueStatusBadge[row.status]}>
          {issueStatusLabel[row.status]}
        </span>
      ),
    },
    {
      key: "reported_at",
      header: "Ημ. Αναφοράς",
      sortable: true,
      render: (row) => formatDate(row.reported_at),
    },
    {
      key: "resolved_at",
      header: "Ημ. Επίλυσης",
      render: (row) => formatDate(row.resolved_at),
    },
  ];
}

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
  title: "",
  description: "",
  severity: "MEDIUM" as IssueSeverity,
  status: "OPEN" as IssueStatus,
  reported_at: new Date().toISOString().split("T")[0],
};

// ─── Page component ─────────────────────────────────────────────────────────

export function FieldIssuesListPage() {
  const table = useTableQuery<IssueRow>({
    endpoint: "/field-issues",
    defaultSortBy: "reported_at",
    defaultSortDir: "desc",
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  // ── Detail modals (owner / field lookups) ──────────────────────────────────
  const owner = useLookupModal<BusinessEntity>("/business-entities");
  const field = useLookupModal<FieldListItem>("/fields");

  const columns = buildColumns(
    (row) => field.openById(row.field_id),
    (row) => owner.openById(row.business_entity_id),
  );

  const isEmpty =
    !table.isLoading &&
    table.total === 0 &&
    !table.search &&
    Object.keys(table.filters).length === 0;

  const openCreate = () => {
    setForm({
      ...emptyForm,
      reported_at: new Date().toISOString().split("T")[0],
    });
    setCreateOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.field_id.trim()) {
      toast.error("Το χωράφι είναι υποχρεωτικό");
      return;
    }
    if (!form.title.trim()) {
      toast.error("Ο τίτλος είναι υποχρεωτικός");
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
        title="Προβλήματα Χωραφιών"
        description="Αναφορά και παρακολούθηση προβλημάτων"
        actions={
          <Button onPress={openCreate}>
            <FiPlus className="h-4 w-4" />
            Νέα Αναφορά
          </Button>
        }
      />

      {isEmpty ? (
        <EmptyState
          icon={FiAlertTriangle}
          title="Δεν υπάρχουν αναφορές"
          description="Ξεκινήστε αναφέροντας ένα πρόβλημα."
          action={
            <Button onPress={openCreate}>
              <FiPlus className="h-4 w-4" />
              Νέα Αναφορά
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

      {/* ── Producer detail modal ────────────────────────────────────────── */}
      <ProducerDetailModal entity={owner.record} onClose={owner.close} />

      {/* ── Field detail modal ───────────────────────────────────────────── */}
      <FieldDetailModal field={field.record} onClose={field.close} />

      {/* ── Create issue modal ───────────────────────────────────────────── */}
      <FormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Νέα Αναφορά Προβλήματος"
        onSubmit={handleSubmit}
        saving={saving}
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
            label="Τίτλος"
            isRequired
            value={form.title}
            onChange={(v) => set("title", v)}
            placeholder="π.χ. Προσβολή από έντομα"
          />
          <TextAreaField
            label="Περιγραφή"
            isRequired
            value={form.description}
            onChange={(v) => set("description", v)}
            placeholder="Λεπτομερής περιγραφή του προβλήματος…"
          />
          <div className="grid grid-cols-2 gap-4">
            <SelectField
              label="Σοβαρότητα"
              value={form.severity}
              onChange={(e) => set("severity", e.target.value)}
            >
              <option value="LOW">Χαμηλή</option>
              <option value="MEDIUM">Μέτρια</option>
              <option value="HIGH">Υψηλή</option>
            </SelectField>
            <TextField
              label="Ημερομηνία Αναφοράς"
              value={form.reported_at}
              onChange={(v) => set("reported_at", v)}
              inputProps={{ type: "date" }}
            />
          </div>
        </div>
      </FormModal>
    </>
  );
}
