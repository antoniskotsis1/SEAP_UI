import { useState } from "react";
import { FiMap, FiPlus } from "react-icons/fi";
import toast from "react-hot-toast";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { FormModal } from "@/components/ui/FormModal";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { SelectField } from "@/components/ui/SelectField";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { FieldDetailModal } from "@/components/entities/FieldDetailModal";
import { useTableQuery } from "@/hooks/useTableQuery";
import { api } from "@/lib/api";
import { formatNumber, formatDate } from "@/lib/utils";
import type { PlantingMethod, TrainingShape } from "@/types";

// ─── Types ───────────────────────────────────────────────────────────────────

type FieldRow = {
  id: string;
  producer_id: string;
  location_name: string;
  region?: string;
  stremmata?: number;
  gps_coordinates?: string;
  planting_date?: string;
  planting_method?: PlantingMethod;
  training_shape?: TrainingShape;
  rootstock?: string;
  spacing?: string;
  analysis_number?: string;
  owner_name?: string;
  planting_summary?: string;
  created_at: string;
  updated_at: string;
};

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
  onDetailClick: (row: FieldRow) => void,
  onMapClick: (row: FieldRow) => void
): Column<FieldRow>[] {
  return [
    {
      key: "location_name",
      header: "Όνομα",
      sortable: true,
      render: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDetailClick(row);
          }}
          className="text-left font-medium text-brand-600 hover:underline"
        >
          {row.location_name}
        </button>
      ),
    },
    {
      key: "region",
      header: "Περιοχή",
      sortable: true,
      render: (row) => {
        const coords = row.gps_coordinates
          ? parseDmsCoords(row.gps_coordinates)
          : null;
        const label = row.region || "—";
        if (!coords) return <span>{label}</span>;
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMapClick(row);
            }}
            className="text-left text-brand-600 hover:underline"
          >
            {label}
          </button>
        );
      },
    },
    {
      key: "stremmata",
      header: "Στρέμματα",
      sortable: true,
      render: (row) =>
        row.stremmata != null ? formatNumber(row.stremmata) : "—",
    },
    {
      key: "planting_summary",
      header: "Αρ. Δέντρων / Ποικιλία",
      render: (row) => row.planting_summary || "—",
    },
    {
      key: "planting_date",
      header: "Ημ/νία Φύτευσης",
      sortable: true,
      render: (row) =>
        row.planting_date ? formatDate(row.planting_date) : "—",
    },
  ];
}

// ─── Initial form state ─────────────────────────────────────────────────────

const emptyForm = {
  producer_id: "",
  location_name: "",
  region: "",
  stremmata: "",
  gps_coordinates: "",
  analysis_number: "",
  planting_date: "",
  planting_method: "" as PlantingMethod | "",
  training_shape: "" as TrainingShape | "",
  rootstock: "",
  spacing: "",
};

// ─── Page component ─────────────────────────────────────────────────────────

export function FieldsListPage() {
  const table = useTableQuery<FieldRow>({
    endpoint: "/fields",
    defaultSortBy: "location_name",
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [mapRow, setMapRow] = useState<FieldRow | null>(null);
  const [detailRow, setDetailRow] = useState<FieldRow | null>(null);

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
    if (!form.location_name.trim()) {
      toast.error("Η τοποθεσία είναι υποχρεωτική");
      return;
    }
    if (!form.producer_id.trim()) {
      toast.error("Ο παραγωγός είναι υποχρεωτικός");
      return;
    }
    setSaving(true);
    try {
      await api.post("/fields", {
        producer_id: form.producer_id,
        location_name: form.location_name,
        region: form.region || undefined,
        stremmata: form.stremmata ? Number(form.stremmata) : undefined,
        gps_coordinates: form.gps_coordinates || undefined,
        analysis_number: form.analysis_number || undefined,
        planting_date: form.planting_date || undefined,
        planting_method: form.planting_method || undefined,
        training_shape: form.training_shape || undefined,
        rootstock: form.rootstock || undefined,
        spacing: form.spacing || undefined,
      });
      toast.success("Το χωράφι δημιουργήθηκε");
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

  const columns = buildColumns(setDetailRow, setMapRow);

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
          <Button onPress={openModal}>
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
            <Button onPress={openModal}>
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
      <FieldDetailModal field={detailRow} onClose={() => setDetailRow(null)} />

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

      {/* ── Create dialog ────────────────────────────────────────────── */}
      <FormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Νέο Χωράφι"
        onSubmit={handleSubmit}
        saving={saving}
      >
        <div className="space-y-4">
          <TextField
            label="Παραγωγός"
            isRequired
            value={form.producer_id}
            onChange={(v) => set("producer_id", v)}
            placeholder="ID παραγωγού"
          />

          <div className="grid grid-cols-2 gap-4">
            <TextField
              label="Τοποθεσία"
              isRequired
              value={form.location_name}
              onChange={(v) => set("location_name", v)}
              placeholder="π.χ. Χωράφι Αμαλιάδας"
            />
            <TextField
              label="Περιοχή"
              value={form.region}
              onChange={(v) => set("region", v)}
              placeholder="π.χ. Άρτα"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <TextField
              label="Στρέμματα"
              value={form.stremmata}
              onChange={(v) => set("stremmata", v)}
              placeholder="π.χ. 12.5"
              inputProps={{ type: "number", step: "0.1" }}
            />
            <TextField
              label="Αρ. Ανάλυσης"
              value={form.analysis_number}
              onChange={(v) => set("analysis_number", v)}
            />
          </div>

          <TextField
            label="GPS Συντεταγμένες"
            value={form.gps_coordinates}
            onChange={(v) => set("gps_coordinates", v)}
            placeholder={`"π.χ. 39°07'25.4N 20°55'11.1E"`}
          />

          <hr className="border-gray-200" />
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Στοιχεία Φύτευσης
          </p>

          <div className="grid grid-cols-2 gap-4">
            <TextField
              label="Ημερομηνία Φύτευσης"
              value={form.planting_date}
              onChange={(v) => set("planting_date", v)}
              inputProps={{ type: "date" }}
            />
            <SelectField
              label="Μέθοδος"
              value={form.planting_method}
              onChange={(e) => set("planting_method", e.target.value)}
            >
              <option value="">—</option>
              <option value="PLANTING">Φύτευση</option>
              <option value="GRAFTING">Εμβολιασμός</option>
            </SelectField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <SelectField
              label="Σχήμα Διαμόρφωσης"
              value={form.training_shape}
              onChange={(e) => set("training_shape", e.target.value)}
            >
              <option value="">—</option>
              <option value="FISHBONE">Ψαροκόκαλο</option>
              <option value="UMBRELLA">Ομπρέλα</option>
              <option value="MIX">Μεικτό</option>
              <option value="OTHER">Άλλο</option>
            </SelectField>
            <TextField
              label="Υποκείμενο"
              value={form.rootstock}
              onChange={(v) => set("rootstock", v)}
              placeholder="π.χ. HAYWARD, BOUNTY"
            />
          </div>

          <TextField
            label="Αποστάσεις Φύτευσης"
            value={form.spacing}
            onChange={(v) => set("spacing", v)}
            placeholder="π.χ. 4x3"
          />
        </div>
      </FormModal>
    </>
  );
}
