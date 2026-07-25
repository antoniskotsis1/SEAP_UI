import { useEffect, useMemo, useState } from "react";
import { FiBarChart2, FiPlus, FiMap } from "react-icons/fi";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { ProducerDetailModal } from "@/components/entities/ProducerDetailModal";
import { FieldDetailModal } from "@/components/entities/FieldDetailModal";
import { ProductionDetailModal } from "@/components/entities/ProductionDetailModal";
import { ProductionFormModal } from "@/components/entities/ProductionFormModal";
import { useApiTable } from "@/hooks/useApiTable";
import { useApiLookup } from "@/hooks/useApiLookup";
import { fieldsApi, producersApi } from "@/lib/services";
import { toField, toProducer, toProductionRecord } from "@/lib/adapters";
import { formatNumber } from "@/lib/utils";
import type { ProductionDto } from "@/types/api";
import type { ProductionRecord, FilterOption } from "@/types";

// ─── Year filter ─────────────────────────────────────────────────────────────

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => String(CURRENT_YEAR - i));

const yearFilterDefs: FilterOption[] = [
  {
    key: "year",
    label: "Έτος",
    options: YEAR_OPTIONS.map((y) => ({ value: y, label: y })),
  },
];

/** DataTable column key → API `ProductionSortField`. */
const sortColumnMap: Record<string, string> = {
  harvest_year: "YEAR",
};

type FieldInfo = { location: string; producer: string; producerId: string };

// ─── Column definitions ─────────────────────────────────────────────────────

function buildColumns(
  fieldInfo: (fieldId: string) => FieldInfo,
  onOwnerClick: (producerId: string) => void,
  onFieldClick: (fieldId: string) => void,
  /** Estimation only ever shows the current year, so the year column is dropped. */
  includeYear: boolean,
): Column<ProductionRecord>[] {
  return [
    {
      key: "owner_name",
      header: "Παραγωγός / Χωράφι",
      render: (row) => {
        const info = fieldInfo(row.field_id);
        return (
          <div className="min-w-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOwnerClick(info.producerId);
              }}
              className="block truncate text-left font-medium text-brand-600 hover:underline"
            >
              {info.producer || "—"}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onFieldClick(row.field_id);
              }}
              className="flex items-center gap-1 truncate text-left text-xs text-gray-400 hover:text-brand-500"
            >
              <FiMap className="h-3 w-3 shrink-0" />
              {info.location || "—"}
            </button>
          </div>
        );
      },
    },
    ...(includeYear
      ? [
          {
            key: "harvest_year",
            header: "Έτος",
            sortable: true,
            width: "minmax(80px, 0.5fr)",
            render: (row: ProductionRecord) => (
              <span className="font-medium text-gray-900">
                {String(row.harvest_year)}
              </span>
            ),
          } satisfies Column<ProductionRecord>,
        ]
      : []),
    {
      key: "ac22_kg",
      header: "AC22 (kg)",
      width: "minmax(90px, 0.6fr)",
      render: (row) => (
        <span className="tabular-nums text-gray-900">
          {formatNumber(row.ac22_kg)}
        </span>
      ),
    },
    {
      key: "ac76_kg",
      header: "AC76 (kg)",
      width: "minmax(90px, 0.6fr)",
      render: (row) => (
        <span className="tabular-nums text-gray-900">
          {formatNumber(row.ac76_kg)}
        </span>
      ),
    },
    {
      key: "quantity_kg",
      header: "Σύνολο (kg)",
      width: "minmax(90px, 0.6fr)",
      render: (row) => (
        <span className="tabular-nums font-semibold text-gray-900">
          {formatNumber(row.quantity_kg)}
        </span>
      ),
    },
  ];
}

// ─── Tab component ────────────────────────────────────────────────────────────

interface ProductionRecordsTabProps {
  /** `true` renders the estimates list, `false` the actual-production list. */
  isEstimate: boolean;
}

export function ProductionRecordsTab({ isEstimate }: ProductionRecordsTabProps) {
  // Estimates only concern the current harvest year — there is no history to
  // browse, so we pin the year server-side and hide the year filter/column.
  const table = useApiTable<ProductionDto, ProductionRecord>({
    endpoint: "/productions",
    adapt: toProductionRecord,
    sortColumnMap,
    staticParams: {
      isEstimation: String(isEstimate),
      ...(isEstimate ? { year: String(CURRENT_YEAR) } : {}),
    },
    defaultSortBy: "harvest_year",
    defaultSortDir: "desc",
  });

  // Resolve fieldId → { location, producer, producerId } for display (the DTO
  // carries only fieldId). Fetched once; the field set is small.
  const [fieldInfoMap, setFieldInfoMap] = useState<Map<string, FieldInfo>>(
    new Map(),
  );

  useEffect(() => {
    fieldsApi
      .list({ size: 1000, sortBy: "LOCATION_NAME" })
      .then((r) => {
        const map = new Map<string, FieldInfo>();
        for (const dto of r.content) {
          map.set(dto.id, {
            location: dto.locationName,
            producer: dto.producerName ?? "",
            producerId: dto.producerId,
          });
        }
        setFieldInfoMap(map);
      })
      .catch(() => setFieldInfoMap(new Map()));
  }, []);

  const fieldInfo = useMemo(
    () => (fieldId: string) =>
      fieldInfoMap.get(fieldId) ?? {
        location: "",
        producer: "",
        producerId: "",
      },
    [fieldInfoMap],
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ProductionRecord | null>(null);
  const [detail, setDetail] = useState<ProductionRecord | null>(null);

  const owner = useApiLookup(producersApi.get, toProducer);
  const field = useApiLookup(fieldsApi.get, toField);

  const columns = buildColumns(
    fieldInfo,
    (producerId) => owner.openById(producerId),
    (fieldId) => field.openById(fieldId),
    !isEstimate,
  );

  const isEmpty =
    !table.isLoading &&
    table.total === 0 &&
    Object.keys(table.filters).length === 0;

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (row: ProductionRecord) => {
    setEditing(row);
    setFormOpen(true);
  };

  const noun = isEstimate ? "Εκτίμηση" : "Καταγραφή";

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onPress={openCreate}>
          <FiPlus className="h-4 w-4" />
          Νέα {noun}
        </Button>
      </div>

      {isEmpty ? (
        <EmptyState
          icon={FiBarChart2}
          title={isEstimate ? "Δεν υπάρχουν εκτιμήσεις" : "Δεν υπάρχουν καταγραφές"}
          description={
            isEstimate
              ? `Ξεκινήστε προσθέτοντας μια εκτίμηση παραγωγής για το ${CURRENT_YEAR}.`
              : "Ξεκινήστε καταγράφοντας παραγωγή ανά χωράφι."
          }
          action={
            <Button onPress={openCreate}>
              <FiPlus className="h-4 w-4" />
              Νέα {noun}
            </Button>
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={table.data}
          keyExtractor={(row) => row.id}
          onRowClick={setDetail}
          isLoading={table.isLoading}
          error={table.error}
          filters={isEstimate ? [] : yearFilterDefs}
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

      <ProducerDetailModal producer={owner.record} onClose={owner.close} />
      <FieldDetailModal field={field.record} onClose={field.close} />

      {/* Read-only view → edit routes through the form. */}
      <ProductionDetailModal
        record={detail}
        fieldName={detail ? fieldInfo(detail.field_id).location : undefined}
        producerName={detail ? fieldInfo(detail.field_id).producer : undefined}
        onClose={() => setDetail(null)}
        onEdit={(row) => {
          setDetail(null);
          openEdit(row);
        }}
      />

      <ProductionFormModal
        open={formOpen}
        record={editing}
        isEstimate={isEstimate}
        onClose={() => setFormOpen(false)}
        onSaved={table.refetch}
      />
    </div>
  );
}
