import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { DetailRow } from "@/components/ui/DescriptionList";
import { formatDate } from "@/lib/utils";
import { methodLabel, shapeLabel } from "@/lib/labels";
import type { FieldListItem } from "@/types";

interface FieldDetailModalProps {
  field: FieldListItem | null;
  onClose: () => void;
}

/** Read-only field detail dialog shared by every page that links to a field. */
export function FieldDetailModal({ field, onClose }: FieldDetailModalProps) {
  return (
    <Modal
      open={!!field}
      onClose={onClose}
      title={field?.location_name ?? ""}
      wide
      footer={
        <Button variant="secondary" onPress={onClose}>
          Κλείσιμο
        </Button>
      }
    >
      {field && (
        <dl className="divide-y divide-gray-100">
          <DetailRow label="Παραγωγός" value={field.owner_name} />
          <DetailRow label="Περιοχή" value={field.region} />
          <DetailRow
            label="Στρέμματα"
            value={field.stremmata != null ? String(field.stremmata) : null}
          />
          <DetailRow label="Αρ. Δέντρων / Ποικιλία" value={field.planting_summary} />
          <DetailRow
            label="Ημερομηνία Φύτευσης"
            value={field.planting_date ? formatDate(field.planting_date) : null}
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
          <DetailRow label="Αρ. Ανάλυσης" value={field.analysis_number} />
          <DetailRow label="GPS" value={field.gps_coordinates} />
        </dl>
      )}
    </Modal>
  );
}
