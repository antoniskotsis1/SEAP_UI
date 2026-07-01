import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { FiUsers, FiPlus, FiMapPin } from "react-icons/fi";
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
import type {
  BusinessEntity,
  BusinessEntityType,
  BusinessEntityStatus,
  FieldListItem,
  FilterOption,
  PaginatedResponse,
} from "@/types";

// ─── Labels & badge classes ─────────────────────────────────────────────────

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

// ─── Detail modal helpers ────────────────────────────────────────────────────

function InfoField({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-gray-900">{value}</dd>
    </div>
  );
}

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
      <span className={row.type === "BUSINESS" ? "badge-blue" : "badge-gray"}>
        {typeLabel[row.type]}
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
  const [entityFields, setEntityFields] = useState<FieldListItem[]>([]);
  const [fieldsLoading, setFieldsLoading] = useState(false);

  useEffect(() => {
    if (!detailEntity) {
      setEntityFields([]);
      return;
    }
    setFieldsLoading(true);
    api
      .list<FieldListItem>("/fields", {
        business_entity_id: detailEntity.id,
        page_size: 100,
        sort_by: "location_name",
      })
      .then((r: PaginatedResponse<FieldListItem>) => setEntityFields(r.data))
      .catch(() => setEntityFields([]))
      .finally(() => setFieldsLoading(false));
  }, [detailEntity]);

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
      <Modal
        open={!!detailEntity}
        onClose={() => setDetailEntity(null)}
        title={detailEntity?.display_name ?? ""}
        wide
        footer={
          <Button variant="secondary" onPress={() => setDetailEntity(null)}>
            Κλείσιμο
          </Button>
        }
      >
        {detailEntity && (
          <div className="space-y-5">
            {/* Status + type badges */}
            <div className="flex items-center gap-2">
              <span className={statusBadge[detailEntity.status]}>
                {statusLabel[detailEntity.status]}
              </span>
              <span
                className={
                  detailEntity.type === "BUSINESS" ? "badge-blue" : "badge-gray"
                }
              >
                {typeLabel[detailEntity.type]}
              </span>
            </div>

            {/* Contact / info grid */}
            <dl className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
              <InfoField label="ΑΦΜ" value={detailEntity.afm} />
              <InfoField label="Τηλέφωνο" value={detailEntity.phone} />
              <InfoField label="Email" value={detailEntity.email} />
              <InfoField
                label="Εκπρόσωπος"
                value={detailEntity.representative_name}
              />
              <InfoField label="Περιοχή" value={detailEntity.region} />
            </dl>

            {detailEntity.notes && (
              <p className="rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-600">
                {detailEntity.notes}
              </p>
            )}

            {/* Fields list */}
            <div className="border-t pt-4">
              <h3 className="mb-3 text-sm font-semibold text-gray-900">
                Χωράφια
                {!fieldsLoading && entityFields.length > 0 && (
                  <span className="ml-2 text-xs font-normal text-gray-400">
                    ({entityFields.length})
                  </span>
                )}
              </h3>

              {fieldsLoading ? (
                <p className="text-sm text-gray-400">Φόρτωση…</p>
              ) : entityFields.length === 0 ? (
                <p className="text-sm text-gray-400">
                  Δεν υπάρχουν καταχωρημένα χωράφια.
                </p>
              ) : (
                <div className="divide-y divide-gray-100 rounded-lg border border-gray-200">
                  {entityFields.map((field) => (
                    <div
                      key={field.id}
                      className="flex items-start justify-between px-4 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {field.location_name}
                        </p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                          {field.region && (
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                              <FiMapPin className="h-3 w-3 shrink-0" />
                              {field.region}
                            </span>
                          )}
                          {field.planting_summary && (
                            <span className="text-xs text-gray-400">
                              {field.planting_summary}
                            </span>
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

      {/* ── Create producer modal ────────────────────────────────────────── */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Νέος Παραγωγός"
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
      </Modal>
    </>
  );
}
