import { useState } from "react";
import { FiMap, FiPlus, FiUsers } from "react-icons/fi";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { FieldDetailModal } from "@/components/entities/FieldDetailModal";
import { FieldFormModal } from "@/components/entities/FieldFormModal";
import { ProducerDetailModal } from "@/components/entities/ProducerDetailModal";
import { VarietyPills } from "@/components/ui/VarietyPills";
import { useApiTable } from "@/hooks/useApiTable";
import { useApiLookup } from "@/hooks/useApiLookup";
import { producersApi } from "@/lib/services";
import { toField, toProducer } from "@/lib/adapters";
import { formatNumber, formatMonthYear } from "@/lib/utils";
import { parseCoords, osmEmbedUrl } from "@/lib/geo";
import type { FieldDto } from "@/types/api";
import type { Field } from "@/types";

// ─── Types ───────────────────────────────────────────────────────────────────

type FieldRow = Field;

// ─── Column definitions ─────────────────────────────────────────────────────

function buildColumns(
  onProducerClick: (row: FieldRow) => void,
  onDetailClick: (row: FieldRow) => void,
  onMapClick: (row: FieldRow) => void,
): Column<FieldRow>[] {
  return [
    {
      key: "producer_name",
      header: "Παραγωγός / Χωράφι",
      sortable: true,
      width: "minmax(150px, 1.2fr)",
      render: (row) => (
        <div className="min-w-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onProducerClick(row);
            }}
            className="flex w-full items-center gap-1 truncate text-left font-medium text-brand-600 hover:underline"
          >
            <FiUsers className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{row.producer_name || "—"}</span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDetailClick(row);
            }}
            className="block max-w-full truncate text-left text-xs text-gray-400 hover:text-brand-500"
          >
            {row.location_name}
          </button>
        </div>
      ),
    },
    {
      key: "region",
      header: "Περιοχή",
      sortable: true,
      width: "minmax(120px, 0.5fr)",
      render: (row) => {
        const coords = parseCoords(row.gps_coordinates);
        const label = row.region || "—";
        // Whole cell swallows the row click so the region column never opens
        // the field detail; with coords it opens the map instead.
        return (
          <span
            onClick={(e) => {
              e.stopPropagation();
              if (coords) onMapClick(row);
            }}
            className={
              coords
                ? "cursor-pointer text-brand-600 hover:underline"
                : "cursor-default"
            }
          >
            {label}
          </span>
        );
      },
    },
    {
      key: "stremmata",
      header: "Στρέμματα",
      sortable: true,
      width: "minmax(80px, 0.5fr)",
      className: "justify-start text-right tabular-nums",
      render: (row) =>
        row.stremmata != null ? formatNumber(row.stremmata) : "—",
    },
    {
      key: "planting_summary",
      header: "Ανά ποικιλία",
      width: "minmax(150px, 1fr)",
      render: (row) => <VarietyPills varieties={row.planting_varieties} />,
    },
    {
      key: "tree_count",
      header: "Σύνολο",
      sortable: true,
      width: "minmax(80px, 0.5fr)",
      className: "justify-start text-right",
      render: (row) => {
        const total = (row.planting_varieties ?? []).reduce(
          (sum, v) => sum + v.tree_count,
          0,
        );
        return total > 0 ? (
          <span className="font-semibold tabular-nums text-gray-900">
            {formatNumber(total)}
          </span>
        ) : (
          <span className="text-gray-400">—</span>
        );
      },
    },
    {
      key: "planting_date",
      header: "Ημ. Φύτευσης",
      sortable: true,
      width: "minmax(120px, 0.9fr)",
      render: (row) =>
        row.planting_date ? formatMonthYear(row.planting_date) : "—",
    },
  ];
}

/** DataTable column key → API `FieldSortField`. */
const sortColumnMap: Record<string, string> = {
  producer_name: "LOCATION_NAME",
  region: "REGION",
  stremmata: "AREA",
  tree_count: "TOTAL_TREES",
  planting_date: "PLANTING_DATE",
};

// ─── Page component ─────────────────────────────────────────────────────────

export function FieldsListPage() {
  const table = useApiTable<FieldDto, FieldRow>({
    endpoint: "/fields",
    adapt: toField,
    sortColumnMap,
    searchFilterKey: "locationName",
    defaultSortBy: "producer_name",
  });

  // ── Create / edit form modal ────────────────────────────────────────────
  // `formOpen` toggles the dialog; `editing` is the field being edited
  // (null → create mode).
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Field | null>(null);

  const [mapRow, setMapRow] = useState<FieldRow | null>(null);
  const [detailRow, setDetailRow] = useState<FieldRow | null>(null);

  // Producer detail modal, looked up by the field's producer_id.
  const producer = useApiLookup(producersApi.get, toProducer);

  const isEmpty =
    !table.isLoading &&
    table.total === 0 &&
    !table.search &&
    Object.keys(table.filters).length === 0;

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (field: Field) => {
    setDetailRow(null);
    setEditing(field);
    setFormOpen(true);
  };

  const columns = buildColumns(
    (row) => producer.openById(row.producer_id),
    setDetailRow,
    setMapRow,
  );

  // Map dialog coords
  const mapCoords = parseCoords(mapRow?.gps_coordinates);

  return (
    <>
      <PageHeader
        title="Χωράφια"
        description="Διαχείριση χωραφιών και τοποθεσιών"
        actions={
          <Button onPress={openCreate}>
            <FiPlus className="h-4 w-4" />
            Νέο Χωράφι
          </Button>
        }
      />

      {isEmpty ? (
        <EmptyState
          icon={FiMap}
          title="Δεν υπάρχουν χωράφια"
          description="Ξεκινήστε προσθέτοντας το πρώτο χωράφι."
          action={
            <Button onPress={openCreate}>
              <FiPlus className="h-4 w-4" />
              Προσθήκη Χωραφιού
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
          searchPlaceholder="Αναζήτηση τοποθεσίας, περιοχής…"
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

      {/* ── Detail dialog ───────────────────────────────────────────── */}
      <FieldDetailModal
        field={detailRow}
        onClose={() => setDetailRow(null)}
        onEdit={openEdit}
      />

      {/* ── Producer detail dialog ──────────────────────────────────── */}
      <ProducerDetailModal
        producer={producer.record}
        onClose={producer.close}
      />

      {/* ── Map dialog ──────────────────────────────────────────────── */}
      <Modal
        open={mapRow !== null}
        onClose={() => setMapRow(null)}
        title={
          mapRow
            ? `${mapRow.location_name}${mapRow.region ? ` — ${mapRow.region}` : ""}`
            : ""
        }
        wide
      >
        {mapCoords ? (
          <iframe
            src={osmEmbedUrl(mapCoords.lat, mapCoords.lon)}
            width="100%"
            height="420"
            style={{ border: 0, borderRadius: 8 }}
            title="Χάρτης τοποθεσίας"
          />
        ) : (
          <p className="py-8 text-center text-sm text-gray-500">
            Δεν υπάρχουν διαθέσιμες συντεταγμένες για αυτή την τοποθεσία.
          </p>
        )}
      </Modal>

      {/* ── Create / edit dialog ─────────────────────────────────────── */}
      <FieldFormModal
        open={formOpen}
        field={editing}
        onClose={() => setFormOpen(false)}
        onSaved={table.refetch}
      />
    </>
  );
}
