import { useState } from "react";
import { FiUsers, FiPlus } from "react-icons/fi";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { ProducerDetailModal } from "@/components/entities/ProducerDetailModal";
import { ProducerFormModal } from "@/components/entities/ProducerFormModal";
import { useApiTable } from "@/hooks/useApiTable";
import { toProducerListItem } from "@/lib/adapters";
import { cn } from "@/lib/utils";
import type { ProducerDto } from "@/types/api";
import type { Producer, ProducerListItem } from "@/types";

// ─── Tabs ─────────────────────────────────────────────────────────────────────

type TabKey = "ACTIVE" | "INACTIVE" | "LEAD";

const TABS: { key: TabKey; label: string }[] = [
  { key: "ACTIVE", label: "Ενεργός" },
  { key: "INACTIVE", label: "Ανενεργός" },
  { key: "LEAD", label: "Lead" },
];

// ─── Column definitions ─────────────────────────────────────────────────────

const columns: Column<ProducerListItem>[] = [
  {
    key: "name",
    header: "Όνομα",
    sortable: true,
    render: (row) => (
      <span className="font-medium text-gray-900 group-hover:text-brand-600 transition-colors">
        {row.display_name}
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

/** DataTable column key → API `ProducerSortField`. */
const sortColumnMap: Record<string, string> = {
  name: "NAME",
  region: "REGION",
};

// ─── Page component ─────────────────────────────────────────────────────────

export function ProducersListPage() {
  const [tab, setTab] = useState<TabKey>("ACTIVE");

  const table = useApiTable<ProducerDto, ProducerListItem>({
    endpoint: "/producers",
    adapt: toProducerListItem,
    sortColumnMap,
    searchFilterKey: "name",
    defaultSortBy: "name",
    defaultFilters: { status: tab },
  });

  const { setFilter } = table;
  const onTabChange = (key: TabKey) => {
    setTab(key);
    setFilter("status", key);
  };

  // ── Create / edit form modal ────────────────────────────────────────────
  // `formOpen` toggles the dialog; `editing` is the producer being edited
  // (null → create mode).
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Producer | null>(null);

  // ── Detail modal ────────────────────────────────────────────────────────
  const [detailProducer, setDetailProducer] = useState<Producer | null>(null);

  const isEmpty = !table.isLoading && table.total === 0 && !table.search;

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (producer: Producer) => {
    setDetailProducer(null);
    setEditing(producer);
    setFormOpen(true);
  };

  return (
    <>
      <PageHeader
        title="Παραγωγοί"
        description="Διαχείριση παραγωγών"
        actions={
          <Button onPress={openCreate}>
            <FiPlus className="h-4 w-4" />
            Νέος Παραγωγός
          </Button>
        }
      />

      {/* ── Tab bar ─────────────────────────────────────────────────────────── */}
      <div className="mb-5 border-b border-gray-200">
        <nav className="-mb-px flex gap-6" aria-label="Κατάσταση παραγωγών">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => onTabChange(t.key)}
              className={cn(
                "border-b-2 px-1 pb-3 text-sm font-medium transition-colors",
                tab === t.key
                  ? "border-brand-600 text-brand-700"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700",
              )}
              aria-current={tab === t.key ? "page" : undefined}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

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
          onRowClick={setDetailProducer}
          isLoading={table.isLoading}
          error={table.error}
          search={table.search}
          onSearchChange={table.setSearch}
          searchPlaceholder="Αναζήτηση ονόματος…"
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
      <ProducerDetailModal
        producer={detailProducer}
        onClose={() => setDetailProducer(null)}
        onEdit={openEdit}
      />

      {/* ── Create / edit producer modal ─────────────────────────────────── */}
      <ProducerFormModal
        open={formOpen}
        producer={editing}
        onClose={() => setFormOpen(false)}
        onSaved={table.refetch}
      />
    </>
  );
}
