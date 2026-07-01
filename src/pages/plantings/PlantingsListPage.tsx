import { useState, useEffect } from "react";
import { FiGrid, FiPlus, FiUsers, FiMapPin } from "react-icons/fi";
import toast from "react-hot-toast";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { SelectField } from "@/components/ui/SelectField";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { useTableQuery } from "@/hooks/useTableQuery";
import { api } from "@/lib/api";
import { formatNumber, formatDate } from "@/lib/utils";
import type {
  Planting,
  Variety,
  Sex,
  FilterOption,
  BusinessEntity,
  BusinessEntityType,
  BusinessEntityStatus,
  FieldListItem,
  PaginatedResponse,
} from "@/types";

// ─── Labels ─────────────────────────────────────────────────────────────────

const varietyLabel: Record<Variety, string> = { V22: "V22", V76: "V76" };
const sexLabel: Record<Sex, string> = { FEMALE: "Θηλυκό", MALE: "Αρσενικό" };

const statusLabel: Record<BusinessEntityStatus, string> = {
  LEAD: "Lead",
  ACTIVE: "Ενεργός",
  INACTIVE: "Ανενεργός",
};
const statusBadge: Record<BusinessEntityStatus, string> = {
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

// ─── Extended row type ───────────────────────────────────────────────────────

type PlantingRow = Planting & {
  field_name?: string;
  owner_name?: string;
  business_entity_id?: string;
};

// ─── Column definitions ─────────────────────────────────────────────────────

function buildColumns(
  onOwnerClick: (row: PlantingRow) => void,
  onFieldClick: (row: PlantingRow) => void,
): Column<PlantingRow>[] {
  return [
    {
      key: "field_name",
      header: "Χωράφι / Παραγωγός",
      render: (row) => (
        <div className="min-w-0">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onFieldClick(row); }}
            className="block truncate text-left font-medium text-brand-600 hover:underline"
          >
            {row.field_name || "—"}
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onOwnerClick(row); }}
            className="flex items-center gap-1 truncate text-left text-xs text-gray-400 hover:text-brand-500"
          >
            <FiUsers className="h-3 w-3 shrink-0" />
            {row.owner_name || "—"}
          </button>
        </div>
      ),
    },
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
}

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
  const table = useTableQuery<PlantingRow>({
    endpoint: "/plantings",
    defaultSortBy: "tree_count",
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
  const handleOwnerClick = async (row: PlantingRow) => {
    if (!row.business_entity_id) return;
    const res = await api.list<BusinessEntity>("/business-entities", {
      id: row.business_entity_id,
    });
    if (res.data[0]) setEntityModal(res.data[0]);
  };
  const handleFieldClick = async (row: PlantingRow) => {
    if (!row.field_id) return;
    const res = await api.list<FieldListItem>("/fields", { id: row.field_id });
    if (res.data[0]) setFieldModal(res.data[0]);
  };

  const columns = buildColumns(handleOwnerClick, handleFieldClick);

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
        title="Φυτεύσεις"
        description="Διαχείριση φυτεύσεων ανά χωράφι"
        actions={
          <Button onPress={openCreate}>
            <FiPlus className="h-4 w-4" />
            Νέα Φύτευση
          </Button>
        }
      />

      {isEmpty ? (
        <EmptyState
          icon={FiGrid}
          title="Δεν υπάρχουν φυτεύσεις"
          description="Ξεκινήστε καταχωρώντας μια φύτευση."
          action={
            <Button onPress={openCreate}>
              <FiPlus className="h-4 w-4" />
              Προσθήκη Φύτευσης
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
              <span className={statusBadge[entityModal.status]}>
                {statusLabel[entityModal.status]}
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

      {/* ── Create planting modal ────────────────────────────────────────── */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Νέα Φύτευση"
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
          <div className="grid grid-cols-2 gap-4">
            <SelectField
              label="Φύλο"
              value={form.sex}
              onChange={(e) => {
                set("sex", e.target.value);
                if (e.target.value === "MALE") set("variety", "");
              }}
            >
              <option value="FEMALE">Θηλυκό</option>
              <option value="MALE">Αρσενικό (επικονιαστής)</option>
            </SelectField>
            {form.sex === "FEMALE" && (
              <SelectField
                label="Ποικιλία"
                required
                value={form.variety}
                onChange={(e) => set("variety", e.target.value)}
              >
                <option value="">—</option>
                <option value="V22">V22</option>
                <option value="V76">V76</option>
              </SelectField>
            )}
          </div>
          <TextField
            label="Αριθμός Δέντρων"
            isRequired
            value={form.tree_count}
            onChange={(v) => set("tree_count", v)}
            placeholder="π.χ. 500"
            inputProps={{ type: "number" }}
          />
        </div>
      </Modal>
    </>
  );
}
