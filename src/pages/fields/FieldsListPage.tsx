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
import { useTableQuery } from "@/hooks/useTableQuery";
import { useLookupModal } from "@/hooks/useLookupModal";
import { formatNumber, formatMonthYear } from "@/lib/utils";
import type { Field, Producer } from "@/types";

// ─── Types ───────────────────────────────────────────────────────────────────

type FieldRow = Field;

// ─── Map helpers ─────────────────────────────────────────────────────────────

function parseDmsCoords(coords: string): { lat: number; lon: number } | null {
  const m = coords.match(
    /(\d+)°(\d+)'([\d.]+)"([NS])\s+(\d+)°(\d+)'([\d.]+)"([EW])/,
  );
  if (!m) return null;
  const lat =
    (Number(m[1]) + Number(m[2]) / 60 + Number(m[3]) / 3600) *
    (m[4] === "S" ? -1 : 1);
  const lon =
    (Number(m[5]) + Number(m[6]) / 60 + Number(m[7]) / 3600) *
    (m[8] === "W" ? -1 : 1);
  return { lat, lon };
}

function osmEmbedUrl(lat: number, lon: number): string {
  const d = 0.008;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${lon - d},${lat - d},${lon + d},${lat + d}&layer=mapnik&marker=${lat},${lon}`;
}

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
      width: "minmax(120px, 1fr)",
      render: (row) => {
        const coords = row.gps_coordinates
          ? parseDmsCoords(row.gps_coordinates)
          : null;
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
      width: "minmax(90px, 0.7fr)",
      render: (row) =>
        row.stremmata != null ? formatNumber(row.stremmata) : "—",
    },
    {
      key: "planting_summary",
      header: "Αρ. Δέντρων",
      width: "minmax(160px, 1.3fr)",
      render: (row) => <VarietyPills varieties={row.planting_varieties} />,
    },
    {
      key: "tree_count",
      header: "Σύνολο Δέντρων",
      width: "minmax(90px, 0.6fr)",
      render: (row) => {
        const total = (row.planting_varieties ?? []).reduce(
          (sum, v) => sum + v.tree_count,
          0,
        );
        return total > 0 ? (
          <span className="font-medium tabular-nums">
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

// ─── Page component ─────────────────────────────────────────────────────────

export function FieldsListPage() {
  const table = useTableQuery<FieldRow>({
    endpoint: "/fields",
    defaultSortBy: "location_name",
  });

  // ── Create / edit form modal ────────────────────────────────────────────
  // `formOpen` toggles the dialog; `editing` is the field being edited
  // (null → create mode).
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Field | null>(null);

  const [mapRow, setMapRow] = useState<FieldRow | null>(null);
  const [detailRow, setDetailRow] = useState<FieldRow | null>(null);

  // Producer detail modal, looked up by the field's producer_id.
  const producer = useLookupModal<Producer>("/producers");

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
  const mapCoords = mapRow?.gps_coordinates
    ? parseDmsCoords(mapRow.gps_coordinates)
    : null;

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
