import { useState, useEffect } from "react";
import { FiAlertTriangle, FiMap, FiPlus, FiMapPin } from "react-icons/fi";
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
import { formatDate, cn } from "@/lib/utils";
import type {
  FieldIssue,
  IssueSeverity,
  IssueStatus,
  FilterOption,
  BusinessEntity,
  BusinessEntityType,
  BusinessEntityStatus,
  FieldListItem,
  PaginatedResponse,
} from "@/types";

// ─── Extended row type ───────────────────────────────────────────────────────

type IssueRow = FieldIssue & {
  field_name?: string;
  owner_name?: string;
  business_entity_id?: string;
};

// ─── Labels ─────────────────────────────────────────────────────────────────

const severityLabel: Record<IssueSeverity, string> = {
  LOW: "Χαμηλή",
  MEDIUM: "Μέτρια",
  HIGH: "Υψηλή",
};
const issueStatusLabel: Record<IssueStatus, string> = {
  OPEN: "Ανοιχτό",
  RESOLVED: "Επιλύθηκε",
};

const entityStatusLabel: Record<BusinessEntityStatus, string> = {
  LEAD: "Lead",
  ACTIVE: "Ενεργός",
  INACTIVE: "Ανενεργός",
};
const entityStatusBadge: Record<BusinessEntityStatus, string> = {
  LEAD: "badge-blue",
  ACTIVE: "badge-green",
  INACTIVE: "badge-gray",
};
const typeLabel: Record<BusinessEntityType, string> = {
  INDIVIDUAL: "Ιδιώτης",
  BUSINESS: "Επιχείρηση",
};

// ─── Detail helpers ──────────────────────────────────────────────────────────

const methodLabel: Record<string, string> = {
  PLANTING: "Φύτευση",
  GRAFTING: "Εμβολιασμός",
};
const shapeLabel: Record<string, string> = {
  FISHBONE: "Ψαροκόκαλο",
  UMBRELLA: "Ομπρέλα",
  MIX: "Μεικτό",
  OTHER: "Άλλο",
};

function InfoField({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-gray-900">{value}</dd>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex gap-3 py-1.5">
      <dt className="w-44 shrink-0 text-sm text-gray-500">{label}</dt>
      <dd className="text-sm font-medium text-gray-900">{value}</dd>
    </div>
  );
}

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
        <span
          className={cn(
            row.severity === "HIGH" && "badge-red",
            row.severity === "MEDIUM" && "badge-yellow",
            row.severity === "LOW" && "badge-gray",
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
            row.status === "RESOLVED" && "badge-green",
          )}
        >
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

  // ── Entity modal ──────────────────────────────────────────────────────────
  const [entityModal, setEntityModal] = useState<BusinessEntity | null>(null);
  const [entityFields, setEntityFields] = useState<FieldListItem[]>([]);
  const [entityFieldsLoading, setEntityFieldsLoading] = useState(false);

  useEffect(() => {
    if (!entityModal) { setEntityFields([]); return; }
    setEntityFieldsLoading(true);
    api
      .list<FieldListItem>("/fields", { business_entity_id: entityModal.id, page_size: 100 })
      .then((r: PaginatedResponse<FieldListItem>) => setEntityFields(r.data))
      .catch(() => setEntityFields([]))
      .finally(() => setEntityFieldsLoading(false));
  }, [entityModal]);

  // ── Field modal ───────────────────────────────────────────────────────────
  const [fieldModal, setFieldModal] = useState<FieldListItem | null>(null);

  // ── Click handlers ────────────────────────────────────────────────────────
  const handleOwnerClick = async (row: IssueRow) => {
    if (!row.business_entity_id) return;
    const res = await api.list<BusinessEntity>("/business-entities", {
      id: row.business_entity_id,
    });
    if (res.data[0]) setEntityModal(res.data[0]);
  };
  const handleFieldClick = async (row: IssueRow) => {
    if (!row.field_id) return;
    const res = await api.list<FieldListItem>("/fields", { id: row.field_id });
    if (res.data[0]) setFieldModal(res.data[0]);
  };

  const columns = buildColumns(handleFieldClick, handleOwnerClick);

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
      <Modal
        open={!!entityModal}
        onClose={() => setEntityModal(null)}
        title={entityModal?.display_name ?? ""}
        wide
        footer={
          <Button variant="secondary" onPress={() => setEntityModal(null)}>
            Κλείσιμο
          </Button>
        }
      >
        {entityModal && (
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <span className={entityStatusBadge[entityModal.status]}>
                {entityStatusLabel[entityModal.status]}
              </span>
              <span className={entityModal.type === "BUSINESS" ? "badge-blue" : "badge-gray"}>
                {typeLabel[entityModal.type]}
              </span>
            </div>
            <dl className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
              <InfoField label="ΑΦΜ" value={entityModal.afm} />
              <InfoField label="Τηλέφωνο" value={entityModal.phone} />
              <InfoField label="Email" value={entityModal.email} />
              <InfoField label="Εκπρόσωπος" value={entityModal.representative_name} />
              <InfoField label="Περιοχή" value={entityModal.region} />
            </dl>
            {entityModal.notes && (
              <p className="rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-600">
                {entityModal.notes}
              </p>
            )}
            <div className="border-t pt-4">
              <h3 className="mb-3 text-sm font-semibold text-gray-900">
                Χωράφια
                {!entityFieldsLoading && entityFields.length > 0 && (
                  <span className="ml-2 text-xs font-normal text-gray-400">
                    ({entityFields.length})
                  </span>
                )}
              </h3>
              {entityFieldsLoading ? (
                <p className="text-sm text-gray-400">Φόρτωση…</p>
              ) : entityFields.length === 0 ? (
                <p className="text-sm text-gray-400">Δεν υπάρχουν καταχωρημένα χωράφια.</p>
              ) : (
                <div className="divide-y divide-gray-100 rounded-lg border border-gray-200">
                  {entityFields.map((field) => (
                    <div key={field.id} className="flex items-start justify-between px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900">{field.location_name}</p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                          {field.region && (
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                              <FiMapPin className="h-3 w-3 shrink-0" />
                              {field.region}
                            </span>
                          )}
                          {field.planting_summary && (
                            <span className="text-xs text-gray-400">{field.planting_summary}</span>
                          )}
                        </div>
                      </div>
                      {field.stremmata != null && (
                        <span className="ml-6 shrink-0 text-sm tabular-nums text-gray-500">
                          {field.stremmata} στρ.
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ── Field detail modal ───────────────────────────────────────────── */}
      <Modal
        open={!!fieldModal}
        onClose={() => setFieldModal(null)}
        title={fieldModal?.location_name ?? ""}
        wide
        footer={
          <Button variant="secondary" onPress={() => setFieldModal(null)}>
            Κλείσιμο
          </Button>
        }
      >
        {fieldModal && (
          <dl className="divide-y divide-gray-100">
            <DetailRow label="Παραγωγός" value={fieldModal.owner_name} />
            <DetailRow label="Περιοχή" value={fieldModal.region} />
            <DetailRow
              label="Στρέμματα"
              value={fieldModal.stremmata != null ? String(fieldModal.stremmata) : null}
            />
            <DetailRow label="Αρ. Δέντρων / Ποικιλία" value={fieldModal.planting_summary} />
            <DetailRow
              label="Ημερομηνία Φύτευσης"
              value={fieldModal.planting_date ? formatDate(fieldModal.planting_date) : null}
            />
            <DetailRow
              label="Μέθοδος Φύτευσης"
              value={fieldModal.planting_method ? methodLabel[fieldModal.planting_method] : null}
            />
            <DetailRow
              label="Σχήμα Διαμόρφωσης"
              value={fieldModal.training_shape ? shapeLabel[fieldModal.training_shape] : null}
            />
            <DetailRow label="Υποκείμενο" value={fieldModal.rootstock} />
            <DetailRow label="Αποστάσεις Φύτευσης" value={fieldModal.spacing} />
            <DetailRow label="Αρ. Ανάλυσης" value={fieldModal.analysis_number} />
            <DetailRow label="GPS" value={fieldModal.gps_coordinates} />
          </dl>
        )}
      </Modal>

      {/* ── Create issue modal ───────────────────────────────────────────── */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Νέα Αναφορά Προβλήματος"
        footer={
          <>
            <Button variant="secondary" onPress={() => setCreateOpen(false)}>
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
      </Modal>
    </>
  );
}
