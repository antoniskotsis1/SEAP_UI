import { FiAlertTriangle, FiUsers } from "react-icons/fi";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { ProducerDetailModal } from "@/components/entities/ProducerDetailModal";
import { FieldDetailModal } from "@/components/entities/FieldDetailModal";
import { useTableQuery } from "@/hooks/useTableQuery";
import { useLookupModal } from "@/hooks/useLookupModal";
import { formatDate } from "@/lib/utils";
import {
  severityLabel,
  severityBadge,
  issueStatusLabel,
  issueStatusBadge,
} from "@/lib/labels";
import type {
  FieldIssue,
  FilterOption,
  Producer,
  Field,
} from "@/types";

// ─── Extended row type ───────────────────────────────────────────────────────

type IssueRow = FieldIssue & {
  field_name?: string;
  owner_name?: string;
  producer_id?: string;
};

// ─── Column definitions ─────────────────────────────────────────────────────

function buildColumns(
  onFieldClick: (row: IssueRow) => void,
  onOwnerClick: (row: IssueRow) => void,
): Column<IssueRow>[] {
  return [
    {
      key: "owner_name",
      header: "Παραγωγός / Χωράφι",
      sortable: true,
      render: (row) => (
        <div className="min-w-0">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onOwnerClick(row); }}
            className="flex items-center gap-1 truncate text-left font-medium text-brand-600 hover:underline"
          >
            <FiUsers className="h-3 w-3 shrink-0" />
            {row.owner_name || "—"}
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onFieldClick(row); }}
            className="block truncate text-left text-xs text-gray-400 hover:text-brand-500"
          >
            {row.field_name || "—"}
          </button>
        </div>
      ),
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
      key: "status",
      header: "Κατάσταση",
      sortable: true,
      render: (row) => (
        <span className={issueStatusBadge[row.status]}>
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

// ─── Page component ─────────────────────────────────────────────────────────

export function FieldIssuesListPage() {
  const table = useTableQuery<IssueRow>({
    endpoint: "/field-issues",
    defaultSortBy: "reported_at",
    defaultSortDir: "desc",
  });

  // ── Detail modals (owner / field lookups) ──────────────────────────────────
  const owner = useLookupModal<Producer>("/producers");
  const field = useLookupModal<Field>("/fields");

  const columns = buildColumns(
    (row) => field.openById(row.field_id),
    (row) => owner.openById(row.producer_id),
  );

  const isEmpty =
    !table.isLoading &&
    table.total === 0 &&
    !table.search &&
    Object.keys(table.filters).length === 0;

  return (
    <>
      <PageHeader
        title="Προβλήματα Χωραφιών"
        description="Προβλήματα που καταγράφηκαν μέσω φωτογραφιών χωραφιών"
      />

      {isEmpty ? (
        <EmptyState
          icon={FiAlertTriangle}
          title="Δεν υπάρχουν αναφορές"
          description="Τα προβλήματα καταγράφονται κατά το ανέβασμα φωτογραφίας στη σελίδα «Φωτογραφίες»."
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
      <ProducerDetailModal producer={owner.record} onClose={owner.close} />

      {/* ── Field detail modal ───────────────────────────────────────────── */}
      <FieldDetailModal field={field.record} onClose={field.close} />
    </>
  );
}
