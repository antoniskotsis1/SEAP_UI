import { useEffect, useMemo, useState } from "react";
import { FiAlertTriangle, FiPlus, FiUsers } from "react-icons/fi";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { ProducerDetailModal } from "@/components/entities/ProducerDetailModal";
import { FieldDetailModal } from "@/components/entities/FieldDetailModal";
import { IssueDetailModal } from "@/components/entities/IssueDetailModal";
import { FieldIssueFormModal } from "@/components/entities/FieldIssueFormModal";
import { useApiTable } from "@/hooks/useApiTable";
import { useApiLookup } from "@/hooks/useApiLookup";
import { fieldsApi, producersApi } from "@/lib/services";
import { toField, toProducer } from "@/lib/adapters";
import { formatDate } from "@/lib/utils";
import {
  severityLabel,
  severityBadge,
  issueStateLabel,
  issueStateBadge,
  ISSUE_STATE_ORDER,
} from "@/lib/labels";
import type { IssueDto } from "@/types/api";
import type { FilterOption } from "@/types";

// ─── Field resolution ────────────────────────────────────────────────────────

type FieldInfo = { location: string; producer: string; producerId: string };

// ─── Column definitions ─────────────────────────────────────────────────────

function buildColumns(
  fieldInfo: (fieldId: string | null | undefined) => FieldInfo,
  onFieldClick: (fieldId: string) => void,
  onOwnerClick: (producerId: string) => void,
): Column<IssueDto>[] {
  return [
    {
      key: "owner_name",
      header: "Παραγωγός / Χωράφι",
      render: (row) => {
        const info = fieldInfo(row.fieldId);
        return (
          <div className="min-w-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (info.producerId) onOwnerClick(info.producerId);
              }}
              className="flex items-center gap-1 truncate text-left font-medium text-brand-600 hover:underline"
            >
              <FiUsers className="h-3 w-3 shrink-0" />
              {info.producer || "—"}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (row.fieldId) onFieldClick(row.fieldId);
              }}
              className="block truncate text-left text-xs text-gray-400 hover:text-brand-500"
            >
              {info.location || "—"}
            </button>
          </div>
        );
      },
    },
    {
      key: "title",
      header: "Τίτλος",
      sortable: true,
      render: (row) => (
        <p className="truncate font-medium text-gray-900">{row.title}</p>
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
      key: "state",
      header: "Κατάσταση",
      sortable: true,
      render: (row) => (
        <span className={issueStateBadge[row.state]}>
          {issueStateLabel[row.state]}
        </span>
      ),
    },
    {
      key: "created_at",
      header: "Ημ. Αναφοράς",
      sortable: true,
      render: (row) => formatDate(row.createdAt),
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
    key: "state",
    label: "Κατάσταση",
    options: ISSUE_STATE_ORDER.map((s) => ({
      value: s,
      label: issueStateLabel[s],
    })),
  },
];

/** DataTable column key → API `IssueSortField`. */
const sortColumnMap: Record<string, string> = {
  title: "TITLE",
  severity: "SEVERITY",
  state: "STATE",
  created_at: "CREATED_AT",
};

// ─── Page component ─────────────────────────────────────────────────────────

export function FieldIssuesListPage() {
  const table = useApiTable<IssueDto, IssueDto>({
    endpoint: "/issues",
    adapt: (dto) => dto,
    sortColumnMap,
    defaultSortBy: "created_at",
    defaultSortDir: "desc",
  });

  // Resolve fieldId → { location, producer, producerId } for the first column.
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
    () => (fieldId: string | null | undefined): FieldInfo =>
      (fieldId && fieldInfoMap.get(fieldId)) || {
        location: "",
        producer: "",
        producerId: "",
      },
    [fieldInfoMap],
  );

  // ── Detail modals (owner / field lookups) ──────────────────────────────────
  const owner = useApiLookup(producersApi.get, toProducer);
  const field = useApiLookup(fieldsApi.get, toField);

  // A `null` editing target means "create"; a row means "edit that issue".
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<IssueDto | null>(null);
  const [detail, setDetail] = useState<IssueDto | null>(null);

  const columns = buildColumns(
    fieldInfo,
    (fieldId) => field.openById(fieldId),
    (producerId) => owner.openById(producerId),
  );

  const isEmpty =
    !table.isLoading &&
    table.total === 0 &&
    !table.search &&
    Object.keys(table.filters).length === 0;

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (row: IssueDto) => {
    setEditing(row);
    setFormOpen(true);
  };

  return (
    <>
      <PageHeader
        title="Προβλήματα Χωραφιών"
        description="Προβλήματα χωραφιών — από αναφορά ή από φωτογραφία"
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
          description="Καταχωρήστε ένα πρόβλημα ή ανεβάστε φωτογραφία με πρόβλημα στη σελίδα «Φωτογραφίες»."
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
          onRowClick={setDetail}
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
      <ProducerDetailModal producer={owner.record} onClose={owner.close} />

      {/* ── Field detail modal ───────────────────────────────────────────── */}
      <FieldDetailModal field={field.record} onClose={field.close} />

      {/* ── Issue detail (read-only) → edit routes through the form ───────── */}
      <IssueDetailModal
        issue={detail}
        fieldName={detail ? fieldInfo(detail.fieldId).location : undefined}
        producerName={detail ? fieldInfo(detail.fieldId).producer : undefined}
        onClose={() => setDetail(null)}
        onEdit={(row) => {
          setDetail(null);
          openEdit(row);
        }}
      />

      {/* ── Create / edit issue modal ────────────────────────────────────── */}
      <FieldIssueFormModal
        open={formOpen}
        issue={editing}
        onClose={() => setFormOpen(false)}
        onSaved={table.refetch}
      />
    </>
  );
}
