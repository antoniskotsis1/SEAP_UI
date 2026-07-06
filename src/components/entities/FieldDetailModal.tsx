import { FiEdit2 } from "react-icons/fi";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { DetailRow } from "@/components/ui/DescriptionList";
import { formatMonthYear } from "@/lib/utils";
import { methodLabel, shapeLabel } from "@/lib/labels";
import type { Field } from "@/types";

interface FieldDetailModalProps {
  field: Field | null;
  onClose: () => void;
  /** When provided, an "Επεξεργασία" action is shown that opens the edit form. */
  onEdit?: (field: Field) => void;
}

/** Read-only field detail dialog shared by every page that links to a field. */
export function FieldDetailModal({
  field,
  onClose,
  onEdit,
}: FieldDetailModalProps) {
  return (
    <Modal
      open={!!field}
      onClose={onClose}
      title={field?.location_name ?? ""}
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
        <dl className="divide-y divide-gray-100">
          <DetailRow label="Παραγωγός" value={field.producer_name} />
          <DetailRow label="Περιοχή" value={field.region} />
          <DetailRow
            label="Στρέμματα"
            value={field.stremmata != null ? String(field.stremmata) : null}
          />
          <DetailRow label="Αρ. Δέντρων / Ποικιλία" value={field.planting_summary} />
          <DetailRow
            label="Σύνολο Δέντρων"
            value={field.total_plants != null ? String(field.total_plants) : null}
          />
          <DetailRow
            label="Ημερομηνία Φύτευσης"
            value={
              field.planting_date ? formatMonthYear(field.planting_date) : null
            }
          />
          <DetailRow
            label="Μέθοδος Φύτευσης"
            value={field.planting_method ? methodLabel[field.planting_method] : null}
          />
          <DetailRow
            label="Σχήμα Διαμόρφωσης"
            value={field.training_shape ? shapeLabel[field.training_shape] : null}
          />
          <DetailRow label="Υποκείμενο" value={field.rootstock} />
          <DetailRow label="Αποστάσεις Φύτευσης" value={field.spacing} />
          <DetailRow
            label="Αναλύσεις"
            value={
              field.analyses && field.analyses.length > 0 ? (
                <ul className="space-y-1">
                  {field.analyses.map((a) => (
                    <li key={a.id}>
                      <a
                        href={a.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-brand-600 hover:underline"
                      >
                        {a.file_name}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null
            }
          />
          <DetailRow label="GPS" value={field.gps_coordinates} />
          <DetailRow label="Σχόλια" value={field.comments} />
        </dl>
      )}
    </Modal>
  );
}
