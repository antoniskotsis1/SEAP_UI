import { useState, useEffect } from "react";
import { FiBarChart2, FiPlus, FiMap, FiMapPin } from "react-icons/fi";
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
import { formatDate, formatNumber } from "@/lib/utils";
import type {
  ProductionRecord,
  BusinessEntity,
  BusinessEntityStatus,
  BusinessEntityType,
  FieldListItem,
  PaginatedResponse,
} from "@/types";

// ─── Extended row type ───────────────────────────────────────────────────────

type ProductionRow = ProductionRecord & {
  field_id?: string;
  business_entity_id?: string;
  field_name?: string;
  owner_name?: string;
  variety?: string;
};

// ─── Entity modal helpers ────────────────────────────────────────────────────

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

function InfoField({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-gray-900">{value}</dd>
    </div>
  );
}

// ─── Field modal helpers ─────────────────────────────────────────────────────

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
  onOwnerClick: (row: ProductionRow) => void,
  onFieldClick: (row: ProductionRow) => void,
): Column<ProductionRow>[] {
  return [
    {
      key: "owner_name",
      header: "Παραγωγός / Χωράφι",
      render: (row) => (
        <div className="min-w-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOwnerClick(row);
            }}
            className="block truncate text-left font-medium text-brand-600 hover:underline"
          >
            {row.owner_name || "—"}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onFieldClick(row);
            }}
            className="flex items-center gap-1 truncate text-left text-xs text-gray-400 hover:text-brand-500"
          >
            <FiMap className="h-3 w-3 shrink-0" />
            {row.field_name || "—"}
          </button>
        </div>
      ),
    },
    {
      key: "harvest_year",
      header: "Έτος",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900">
            {String(row.harvest_year)}
          </span>
        </div>
      ),
    },
    {
      key: "quantity_kg",
      header: "Σύνολο (kg)",
      sortable: true,
      render: (row) => (
        <span className="tabular-nums font-medium text-gray-900">
          {formatNumber(row.quantity_kg)}
        </span>
      ),
    },
  ];
}

// ─── Breakdown table ─────────────────────────────────────────────────────────

function BreakdownTable({ row }: { row: ProductionRow }) {
  const cats = [
    {
      label: "Κατηγορία Α",
      v1: row.cat_a_1kg ?? 0,
      v2: row.cat_a_2kg ?? 0,
      v3: row.cat_a_3kg ?? 0,
    },
    {
      label: "Κατηγορία Β",
      v1: row.cat_b_1kg ?? 0,
      v2: row.cat_b_2kg ?? 0,
      v3: row.cat_b_3kg ?? 0,
    },
    {
      label: "Χαλασμένα",
      v1: row.spoiled_1kg ?? 0,
      v2: row.spoiled_2kg ?? 0,
      v3: row.spoiled_3kg ?? 0,
    },
  ];

  const col1 = cats.reduce((s, c) => s + c.v1, 0);
  const col2 = cats.reduce((s, c) => s + c.v2, 0);
  const col3 = cats.reduce((s, c) => s + c.v3, 0);

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-gray-200">
          <th className="pb-2.5 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
            Κατηγορία
          </th>
          <th className="pb-2.5 text-right text-xs font-medium uppercase tracking-wide text-gray-500">
            1 kg
          </th>
          <th className="pb-2.5 text-right text-xs font-medium uppercase tracking-wide text-gray-500">
            2 kg
          </th>
          <th className="pb-2.5 text-right text-xs font-medium uppercase tracking-wide text-gray-500">
            3 kg
          </th>
          <th className="pb-2.5 text-right text-xs font-medium uppercase tracking-wide text-gray-700">
            Σύνολο
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {cats.map(({ label, v1, v2, v3 }) => (
          <tr key={label}>
            <td className="py-2.5 text-gray-700">{label}</td>
            <td className="py-2.5 text-right tabular-nums text-gray-900">
              {formatNumber(v1)}
            </td>
            <td className="py-2.5 text-right tabular-nums text-gray-900">
              {formatNumber(v2)}
            </td>
            <td className="py-2.5 text-right tabular-nums text-gray-900">
              {formatNumber(v3)}
            </td>
            <td className="py-2.5 text-right tabular-nums font-medium text-gray-900">
              {formatNumber(v1 + v2 + v3)}
            </td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr className="border-t-2 border-gray-200">
          <td className="pt-3 font-semibold text-gray-900">Σύνολο</td>
          <td className="pt-3 text-right tabular-nums font-semibold text-gray-900">
            {formatNumber(col1)}
          </td>
          <td className="pt-3 text-right tabular-nums font-semibold text-gray-900">
            {formatNumber(col2)}
          </td>
          <td className="pt-3 text-right tabular-nums font-semibold text-gray-900">
            {formatNumber(col3)}
          </td>
          <td className="pt-3 text-right tabular-nums text-base font-bold text-brand-700">
            {formatNumber(row.quantity_kg)}
          </td>
        </tr>
      </tfoot>
    </table>
  );
}

// ─── Initial form state ─────────────────────────────────────────────────────

const emptyForm = {
  planting_id: "",
  harvest_year: String(new Date().getFullYear()),
  is_estimate: false,
  cat_a_1kg: "",
  cat_a_2kg: "",
  cat_a_3kg: "",
  cat_b_1kg: "",
  cat_b_2kg: "",
  cat_b_3kg: "",
  spoiled_1kg: "",
  spoiled_2kg: "",
  spoiled_3kg: "",
  notes: "",
};

// ─── Page component ─────────────────────────────────────────────────────────

export function ProductionListPage() {
  const table = useTableQuery<ProductionRow>({
    endpoint: "/production",
    defaultSortBy: "harvest_year",
    defaultSortDir: "desc",
  });

  // ── Create modal ────────────────────────────────────────────────────────
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  // ── Production breakdown modal ──────────────────────────────────────────
  const [detailRow, setDetailRow] = useState<ProductionRow | null>(null);

  // ── Producer detail modal ───────────────────────────────────────────────
  const [entityModal, setEntityModal] = useState<BusinessEntity | null>(null);
  const [entityFields, setEntityFields] = useState<FieldListItem[]>([]);
  const [entityFieldsLoading, setEntityFieldsLoading] = useState(false);

  useEffect(() => {
    if (!entityModal) {
      setEntityFields([]);
      return;
    }
    setEntityFieldsLoading(true);
    api
      .list<FieldListItem>("/fields", {
        business_entity_id: entityModal.id,
        page_size: 100,
        sort_by: "location_name",
      })
      .then((r: PaginatedResponse<FieldListItem>) => setEntityFields(r.data))
      .catch(() => setEntityFields([]))
      .finally(() => setEntityFieldsLoading(false));
  }, [entityModal]);

  // ── Field detail modal ──────────────────────────────────────────────────
  const [fieldModal, setFieldModal] = useState<FieldListItem | null>(null);

  // ── Click handlers ──────────────────────────────────────────────────────
  const handleOwnerClick = async (row: ProductionRow) => {
    if (!row.business_entity_id) return;
    const res = await api.list<BusinessEntity>("/business-entities", {
      id: row.business_entity_id,
    });
    if (res.data[0]) setEntityModal(res.data[0]);
  };

  const handleFieldClick = async (row: ProductionRow) => {
    if (!row.field_id) return;
    const res = await api.list<FieldListItem>("/fields", { id: row.field_id });
    if (res.data[0]) setFieldModal(res.data[0]);
  };

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
    if (!form.planting_id.trim()) {
      toast.error("Η φύτευση είναι υποχρεωτική");
      return;
    }
    setSaving(true);
    const n = (v: string) => (v ? Number(v) : 0);
    const catA1 = n(form.cat_a_1kg),
      catA2 = n(form.cat_a_2kg),
      catA3 = n(form.cat_a_3kg);
    const catB1 = n(form.cat_b_1kg),
      catB2 = n(form.cat_b_2kg),
      catB3 = n(form.cat_b_3kg);
    const sp1 = n(form.spoiled_1kg),
      sp2 = n(form.spoiled_2kg),
      sp3 = n(form.spoiled_3kg);
    try {
      await api.post("/production", {
        planting_id: form.planting_id,
        harvest_year: Number(form.harvest_year),
        cat_a_1kg: catA1,
        cat_a_2kg: catA2,
        cat_a_3kg: catA3,
        cat_b_1kg: catB1,
        cat_b_2kg: catB2,
        cat_b_3kg: catB3,
        spoiled_1kg: sp1,
        spoiled_2kg: sp2,
        spoiled_3kg: sp3,
        quantity_kg:
          catA1 + catA2 + catA3 + catB1 + catB2 + catB3 + sp1 + sp2 + sp3,
        is_estimate: form.is_estimate,
        notes: form.notes || undefined,
      });
      toast.success("Η καταγραφή δημιουργήθηκε");
      setCreateOpen(false);
      table.refetch();
    } catch {
      toast.error("Αποτυχία δημιουργίας");
    } finally {
      setSaving(false);
    }
  };

  const set = (key: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const columns = buildColumns(handleOwnerClick, handleFieldClick);

  return (
    <>
      <PageHeader
        title="Παραγωγή"
        description="Καταγραφή παραγωγής ανά φύτευση και έτος"
        actions={
          <Button onPress={openCreate}>
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
            <Button onPress={openCreate}>
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
          onRowClick={setDetailRow}
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

      {/* ── Production breakdown modal ─────────────────────────────────────── */}
      <Modal
        open={!!detailRow}
        onClose={() => setDetailRow(null)}
        title={
          detailRow
            ? `${detailRow.owner_name || "—"} — ${detailRow.field_name || "—"} (${detailRow.harvest_year})`
            : ""
        }
        wide
        footer={
          <Button variant="secondary" onPress={() => setDetailRow(null)}>
            Κλείσιμο
          </Button>
        }
      >
        {detailRow && (
          <div className="space-y-5">
            <BreakdownTable row={detailRow} />
            {detailRow.notes && (
              <p className="rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-600">
                {detailRow.notes}
              </p>
            )}
          </div>
        )}
      </Modal>

      {/* ── Producer detail modal ──────────────────────────────────────────── */}
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
              <span
                className={
                  entityModal.type === "BUSINESS" ? "badge-blue" : "badge-gray"
                }
              >
                {typeLabel[entityModal.type]}
              </span>
            </div>

            <dl className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
              <InfoField label="ΑΦΜ" value={entityModal.afm} />
              <InfoField label="Τηλέφωνο" value={entityModal.phone} />
              <InfoField label="Email" value={entityModal.email} />
              <InfoField
                label="Εκπρόσωπος"
                value={entityModal.representative_name}
              />
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

      {/* ── Field detail modal ─────────────────────────────────────────────── */}
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
              value={
                fieldModal.stremmata != null
                  ? String(fieldModal.stremmata)
                  : null
              }
            />
            <DetailRow
              label="Αρ. Δέντρων / Ποικιλία"
              value={fieldModal.planting_summary}
            />
            <DetailRow
              label="Ημερομηνία Φύτευσης"
              value={
                fieldModal.planting_date
                  ? formatDate(fieldModal.planting_date)
                  : null
              }
            />
            <DetailRow
              label="Μέθοδος Φύτευσης"
              value={
                fieldModal.planting_method
                  ? methodLabel[fieldModal.planting_method]
                  : null
              }
            />
            <DetailRow
              label="Διαμόρφωση"
              value={
                fieldModal.training_shape
                  ? shapeLabel[fieldModal.training_shape]
                  : null
              }
            />
            <DetailRow label="Υποκείμενο" value={fieldModal.rootstock} />
            <DetailRow label="Αποστάσεις Φύτευσης" value={fieldModal.spacing} />
            <DetailRow
              label="Αρ. Ανάλυσης"
              value={fieldModal.analysis_number}
            />
            <DetailRow label="GPS" value={fieldModal.gps_coordinates} />
          </dl>
        )}
      </Modal>

      {/* ── Create production modal ────────────────────────────────────────── */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Νέα Καταγραφή Παραγωγής"
        wide
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
          <div className="grid grid-cols-2 gap-4">
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
          </div>

          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Κατηγορία Α
          </p>
          <div className="grid grid-cols-3 gap-3">
            {(["cat_a_1kg", "cat_a_2kg", "cat_a_3kg"] as const).map((k, i) => (
              <TextField
                key={k}
                label={`${i + 1} kg`}
                value={form[k]}
                onChange={(v) => set(k, v)}
                placeholder="0"
                inputProps={{ type: "number", step: "0.1" }}
              />
            ))}
          </div>

          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Κατηγορία Β
          </p>
          <div className="grid grid-cols-3 gap-3">
            {(["cat_b_1kg", "cat_b_2kg", "cat_b_3kg"] as const).map((k, i) => (
              <TextField
                key={k}
                label={`${i + 1} kg`}
                value={form[k]}
                onChange={(v) => set(k, v)}
                placeholder="0"
                inputProps={{ type: "number", step: "0.1" }}
              />
            ))}
          </div>

          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Χαλασμένα
          </p>
          <div className="grid grid-cols-3 gap-3">
            {(["spoiled_1kg", "spoiled_2kg", "spoiled_3kg"] as const).map(
              (k, i) => (
                <TextField
                  key={k}
                  label={`${i + 1} kg`}
                  value={form[k]}
                  onChange={(v) => set(k, v)}
                  placeholder="0"
                  inputProps={{ type: "number", step: "0.1" }}
                />
              ),
            )}
          </div>

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
