import type { ReactNode } from "react";
import { FiEdit2, FiGrid, FiFileText } from "react-icons/fi";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { DetailRow } from "@/components/ui/DescriptionList";
import { formatMonthYear, formatNumber } from "@/lib/utils";
import {
  methodLabel,
  shapeLabel,
  varietyLabel,
  varietyBadge,
  VARIETY_ORDER,
} from "@/lib/labels";
import type { Field, Variety } from "@/types";

interface PlantingDetailModalProps {
  /** The field whose planting facet is being viewed. */
  field: Field | null;
  onClose: () => void;
  /** When provided, an "Επεξεργασία" action opens the field edit form. */
  onEdit?: (field: Field) => void;
}

/** A summary metric tile. */
function StatTile({ label, value }: { label: ReactNode; value: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-gray-200 bg-gray-50/60 px-3 py-2.5 text-center">
      <p className="text-lg font-semibold tabular-nums text-gray-900">{value}</p>
      <div className="mt-1 text-xs text-gray-500">{label}</div>
    </div>
  );
}

function SectionHeading({
  icon,
  children,
  hint,
}: {
  icon: ReactNode;
  children: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
      <span className="text-gray-400">{icon}</span>
      {children}
      {hint != null && (
        <span className="text-xs font-normal text-gray-400">{hint}</span>
      )}
    </h3>
  );
}

/**
 * Read-only view of a field's **planting** data (variety tree counts + planting
 * metadata). Plantings are a facet of the field, so editing routes through the
 * field edit form via `onEdit`.
 */
export function PlantingDetailModal({
  field,
  onClose,
  onEdit,
}: PlantingDetailModalProps) {
  const countOf = (v: Variety): number =>
    field?.planting_varieties?.find((x) => x.variety === v)?.tree_count ?? 0;

  const total = field?.total_plants ?? 0;

  const hasPlantingDetails =
    field &&
    (field.planting_date ||
      field.planting_method ||
      field.training_shape ||
      field.rootstock ||
      field.spacing);

  return (
    <Modal
      open={!!field}
      onClose={onClose}
      title={
        field ? (
          <span className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
              <FiGrid className="h-5 w-5" />
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="truncate leading-tight">
                {field.location_name}
              </span>
              {field.producer_name && (
                <span className="truncate text-xs font-normal text-gray-500">
                  {field.producer_name}
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
          {onEdit && field && (
            <Button onPress={() => onEdit(field)}>
              <FiEdit2 className="h-4 w-4" />
              Επεξεργασία
            </Button>
          )}
        </>
      }
    >
      {field && (
        <div className="space-y-6">
          {/* ── Variety composition ────────────────────────────────────── */}
          <section>
            <SectionHeading
              icon={<FiGrid className="h-4 w-4" />}
              hint={`Σύνολο ${formatNumber(total)} δέντρα`}
            >
              Σύνθεση Φύτευσης
            </SectionHeading>
            <div className="grid grid-cols-3 gap-2">
              {VARIETY_ORDER.map((v) => (
                <StatTile
                  key={v}
                  label={
                    <span className={varietyBadge[v]}>{varietyLabel[v]}</span>
                  }
                  value={formatNumber(countOf(v))}
                />
              ))}
            </div>
          </section>

          {/* ── Planting details ───────────────────────────────────────── */}
          {hasPlantingDetails && (
            <section>
              <SectionHeading icon={<FiGrid className="h-4 w-4" />}>
                Στοιχεία Φύτευσης
              </SectionHeading>
              <dl className="divide-y divide-gray-100 rounded-lg border border-gray-200 px-3">
                {field.planting_date && (
                  <DetailRow
                    label="Ημερομηνία Φύτευσης"
                    value={formatMonthYear(field.planting_date)}
                  />
                )}
                {field.planting_method && (
                  <DetailRow
                    label="Μέθοδος Φύτευσης"
                    value={methodLabel[field.planting_method]}
                  />
                )}
                {field.training_shape && (
                  <DetailRow
                    label="Σχήμα Διαμόρφωσης"
                    value={shapeLabel[field.training_shape]}
                  />
                )}
                {field.rootstock && (
                  <DetailRow label="Υποκείμενο" value={field.rootstock} />
                )}
                {field.spacing && (
                  <DetailRow label="Αποστάσεις Φύτευσης" value={field.spacing} />
                )}
              </dl>
            </section>
          )}

          {/* ── Comments ────────────────────────────────────────────────── */}
          {field.comments && (
            <section>
              <SectionHeading icon={<FiFileText className="h-4 w-4" />}>
                Σχόλια
              </SectionHeading>
              <p className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-600">
                {field.comments}
              </p>
            </section>
          )}
        </div>
      )}
    </Modal>
  );
}
