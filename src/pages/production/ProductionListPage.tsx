import { useState } from "react";
import { FiBarChart2, FiPlus, FiMap } from "react-icons/fi";
import toast from "react-hot-toast";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { FormModal } from "@/components/ui/FormModal";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { TextAreaField } from "@/components/ui/TextAreaField";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { ProducerDetailModal } from "@/components/entities/ProducerDetailModal";
import { FieldDetailModal } from "@/components/entities/FieldDetailModal";
import { useTableQuery } from "@/hooks/useTableQuery";
import { useLookupModal } from "@/hooks/useLookupModal";
import { api } from "@/lib/api";
import { formatNumber } from "@/lib/utils";
import type {
  ProductionRecord,
  BusinessEntity,
  FieldListItem,
} from "@/types";

// ─── Extended row type ───────────────────────────────────────────────────────

type ProductionRow = ProductionRecord & {
  field_id?: string;
  business_entity_id?: string;
  field_name?: string;
  owner_name?: string;
  variety?: string;
};

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

  // ── Detail modals (owner / field lookups) ───────────────────────────────
  const owner = useLookupModal<BusinessEntity>("/business-entities");
  const field = useLookupModal<FieldListItem>("/fields");

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

  const columns = buildColumns(
    (row) => owner.openById(row.business_entity_id),
    (row) => field.openById(row.field_id),
  );

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
      <ProducerDetailModal entity={owner.record} onClose={owner.close} />

      {/* ── Field detail modal ─────────────────────────────────────────────── */}
      <FieldDetailModal field={field.record} onClose={field.close} />

      {/* ── Create production modal ────────────────────────────────────────── */}
      <FormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Νέα Καταγραφή Παραγωγής"
        wide
        onSubmit={handleSubmit}
        saving={saving}
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
      </FormModal>
    </>
  );
}
