import { FiUsers, FiPlus } from "react-icons/fi";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { useTableQuery } from "@/hooks/useTableQuery";
import type { BusinessEntity, FilterOption } from "@/types";
import { cn } from "@/lib/utils";

// ─── Column definitions ─────────────────────────────────────────────────────

const columns: Column<BusinessEntity>[] = [
  {
    key: "display_name",
    header: "Όνομα",
    sortable: true,
    render: (row) => (
      <span className="font-medium text-gray-900">{row.display_name}</span>
    ),
  },
  {
    key: "type",
    header: "Τύπος",
    sortable: true,
    render: (row) => (
      <span className={row.type === "BUSINESS" ? "badge-blue" : "badge-gray"}>
        {row.type === "BUSINESS" ? "Επιχείρηση" : "Ιδιώτης"}
      </span>
    ),
  },
  {
    key: "status",
    header: "Κατάσταση",
    sortable: true,
    render: (row) => (
      <span
        className={cn(
          row.status === "ACTIVE" && "badge-green",
          row.status === "LEAD" && "badge-yellow",
          row.status === "INACTIVE" && "badge-gray",
        )}
      >
        {row.status}
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

// ─── Filter definitions (map to BE query params) ────────────────────────────

const filterDefs: FilterOption[] = [
  {
    key: "type",
    label: "Τύπος",
    options: [
      { value: "INDIVIDUAL", label: "Ιδιώτης" },
      { value: "BUSINESS", label: "Επιχείρηση" },
    ],
  },
  {
    key: "status",
    label: "Κατάσταση",
    options: [
      { value: "LEAD", label: "Lead" },
      { value: "ACTIVE", label: "Ενεργός" },
      { value: "INACTIVE", label: "Ανενεργός" },
    ],
  },
];

// ─── Page component ──────────────────────────────────────────────────────────

export function BusinessEntitiesListPage() {
  const table = useTableQuery<BusinessEntity>({
    endpoint: "/business-entities",
    defaultSortBy: "display_name",
  });

  console.log("table", table);

  const isEmpty =
    !table.isLoading &&
    table.total === 0 &&
    !table.search &&
    Object.keys(table.filters).length === 0;

  return (
    <>
      <PageHeader
        title="Παραγωγοί"
        description="Διαχείριση παραγωγών και επιχειρήσεων"
        actions={
          <button className="btn-primary">
            <FiPlus className="h-4 w-4" />
            Νέος Παραγωγός
          </button>
        }
      />

      {/* {!isEmpty ? ( */}
      <EmptyState
        icon={FiUsers}
        title="Δεν υπάρχουν παραγωγοί"
        description="Ξεκινήστε προσθέτοντας τον πρώτο παραγωγό."
        action={
          <button className="btn-primary">
            <FiPlus className="h-4 w-4" />
            Προσθήκη Παραγωγού
          </button>
        }
      />
      {/* ) : ( */}
      <DataTable
        columns={columns}
        data={[
          {
            id: "13",
            display_name: " tragos",
            type: "BUSINESS",
            status: "ACTIVE",
            created_at: "",
            updated_at: "",
          },
          {
            id: "1",
            display_name: "Mixas tragos",
            type: "INDIVIDUAL",
            status: "LEAD",
            created_at: "",
            updated_at: "",
          },
        ]}
        keyExtractor={(row) => row.id}
        onRowClick={(row) => console.log("Navigate to", row.id)}
        isLoading={table.isLoading}
        error={table.error}
        // Search — sends ?search=... to BE
        search={table.search}
        onSearchChange={table.setSearch}
        searchPlaceholder="Αναζήτηση ονόματος, ΑΦΜ, τηλεφώνου…"
        // Filters — sends ?type=...&status=... to BE
        filters={filterDefs}
        activeFilters={table.filters}
        onFilterChange={table.setFilter}
        onClearFilters={table.clearFilters}
        // Sort — sends ?sort_by=...&sort_dir=... to BE
        sortBy={table.sortBy}
        sortDir={table.sortDir}
        onSort={table.toggleSort}
        // Pagination — sends ?page=...&page_size=... to BE
        page={table.page}
        pageSize={table.pageSize}
        total={table.total}
        totalPages={table.totalPages}
        onPageChange={table.setPage}
        onPageSizeChange={table.setPageSize}
        // Virtualization (flip to true for large datasets)
        virtualized={false}
      />
      {/* )} */}
    </>
  );
}
