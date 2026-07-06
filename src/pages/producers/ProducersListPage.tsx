import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { FiUsers, FiPlus } from "react-icons/fi";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { ProducerDetailModal } from "@/components/entities/ProducerDetailModal";
import { ProducerFormModal } from "@/components/entities/ProducerFormModal";
import { useTableQuery } from "@/hooks/useTableQuery";
import type { Producer, ProducerListItem } from "@/types";

// ─── Column definitions ─────────────────────────────────────────────────────

const columns: Column<ProducerListItem>[] = [
  {
    key: "display_name",
    header: "Όνομα",
    sortable: true,
    render: (row) => (
      <span className="font-medium text-gray-900 group-hover:text-brand-600 transition-colors">
        {row.display_name}
      </span>
    ),
  },
  {
    key: "total_stremmata",
    header: "Συνολικά Στρέμματα",
    sortable: true,
    render: (row) =>
      row.total_stremmata != null ? (
        <span className="tabular-nums">{row.total_stremmata} στρ.</span>
      ) : (
        "—"
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

// ─── Page component ─────────────────────────────────────────────────────────

export function ProducersListPage() {
  const [searchParams] = useSearchParams();
  const urlStatus = searchParams.get("status") ?? "";

  const table = useTableQuery<ProducerListItem>({
    endpoint: "/producers",
    defaultSortBy: "display_name",
    defaultFilters: urlStatus ? { status: urlStatus } : {},
  });

  const { setFilter } = table;
  useEffect(() => {
    setFilter("status", urlStatus);
  }, [urlStatus, setFilter]);

  // ── Create / edit form modal ────────────────────────────────────────────
  // `formOpen` toggles the dialog; `editing` is the producer being edited
  // (null → create mode).
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Producer | null>(null);

  // ── Detail modal ────────────────────────────────────────────────────────
  const [detailProducer, setDetailProducer] = useState<Producer | null>(null);

  const isEmpty =
    !table.isLoading &&
    table.total === 0 &&
    !table.search &&
    Object.keys(table.filters).length === 0;

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
        description="Διαχείριση παραγωγών και επιχειρήσεων"
        actions={
          <Button onPress={openCreate}>
            <FiPlus className="h-4 w-4" />
            Νέος Παραγωγός
          </Button>
        }
      />

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
          searchPlaceholder="Αναζήτηση ονόματος, ΑΦΜ, τηλεφώνου…"
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
