import type { ReactNode } from "react";
import { FiEdit2, FiBarChart2 } from "react-icons/fi";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { formatNumber } from "@/lib/utils";
import type { ProductionRecord } from "@/types";

interface ProductionDetailModalProps {
  record: ProductionRecord | null;
  /** Resolved field/producer labels (the record only carries `field_id`). */
  fieldName?: string;
  producerName?: string;
  onClose: () => void;
  /** When provided, an "Επεξεργασία" action opens the edit form. */
  onEdit?: (record: ProductionRecord) => void;
}

/** A summary metric tile. */
function StatTile({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50/60 px-3 py-2.5 text-center">
      <p className="text-lg font-semibold tabular-nums text-gray-900">{value}</p>
      <p className="mt-0.5 text-xs text-gray-500">{label}</p>
    </div>
  );
}

/**
 * Read-only view of a production (or estimate) record: yearly kg yield of the
 * two fruit varieties for a field. Editing routes through `onEdit`.
 */
export function ProductionDetailModal({
  record,
  fieldName,
  producerName,
  onClose,
  onEdit,
}: ProductionDetailModalProps) {
  return (
    <Modal
      open={!!record}
      onClose={onClose}
      title={
        record ? (
          <span className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
              <FiBarChart2 className="h-5 w-5" />
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="truncate leading-tight">
                {fieldName || "Παραγωγή"}
              </span>
              {producerName && (
                <span className="truncate text-xs font-normal text-gray-500">
                  {producerName}
                </span>
              )}
            </span>
          </span>
        ) : (
          ""
        )
      }
      wide
      footer={
        <>
          <Button variant="secondary" onPress={onClose}>
            Κλείσιμο
          </Button>
          {onEdit && record && (
            <Button onPress={() => onEdit(record)}>
              <FiEdit2 className="h-4 w-4" />
              Επεξεργασία
            </Button>
          )}
        </>
      }
    >
      {record && (
        <div className="space-y-6">
          {/* ── Year + type ────────────────────────────────────────────── */}
          <div className="flex items-center gap-3">
            <span className="text-2xl font-semibold tabular-nums text-gray-900">
              {record.harvest_year}
            </span>
            <span
              className={record.is_estimate ? "badge-yellow" : "badge-green"}
            >
              {record.is_estimate ? "Εκτίμηση" : "Καταγραφή"}
            </span>
          </div>

          {/* ── Yield tiles ────────────────────────────────────────────── */}
          <div className="grid grid-cols-3 gap-2">
            <StatTile label="AC22 (kg)" value={formatNumber(record.ac22_kg)} />
            <StatTile label="AC76 (kg)" value={formatNumber(record.ac76_kg)} />
            <StatTile
              label="Σύνολο (kg)"
              value={formatNumber(record.quantity_kg)}
            />
          </div>
        </div>
      )}
    </Modal>
  );
}
