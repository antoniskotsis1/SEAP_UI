import { useState, useEffect } from "react";
import { FiMapPin } from "react-icons/fi";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { InfoField } from "@/components/ui/DescriptionList";
import { api } from "@/lib/api";
import {
  entityStatusLabel,
  entityStatusBadge,
  entityTypeLabel,
  entityTypeBadge,
} from "@/lib/labels";
import type {
  BusinessEntity,
  FieldListItem,
  PaginatedResponse,
} from "@/types";

interface ProducerDetailModalProps {
  entity: BusinessEntity | null;
  onClose: () => void;
}

/**
 * Read-only producer detail dialog: status/type badges, contact grid, notes,
 * and the list of that producer's fields (fetched on open). Shared by every
 * page that surfaces a producer.
 */
export function ProducerDetailModal({ entity, onClose }: ProducerDetailModalProps) {
  const [fields, setFields] = useState<FieldListItem[]>([]);
  const [fieldsLoading, setFieldsLoading] = useState(false);

  useEffect(() => {
    if (!entity) {
      setFields([]);
      return;
    }
    setFieldsLoading(true);
    api
      .list<FieldListItem>("/fields", {
        business_entity_id: entity.id,
        page_size: 100,
        sort_by: "location_name",
      })
      .then((r: PaginatedResponse<FieldListItem>) => setFields(r.data))
      .catch(() => setFields([]))
      .finally(() => setFieldsLoading(false));
  }, [entity]);

  return (
    <Modal
      open={!!entity}
      onClose={onClose}
      title={entity?.display_name ?? ""}
      wide
      footer={
        <Button variant="secondary" onPress={onClose}>
          Κλείσιμο
        </Button>
      }
    >
      {entity && (
        <div className="space-y-5">
          {/* Status + type badges */}
          <div className="flex items-center gap-2">
            <span className={entityStatusBadge[entity.status]}>
              {entityStatusLabel[entity.status]}
            </span>
            <span className={entityTypeBadge(entity.type)}>
              {entityTypeLabel[entity.type]}
            </span>
          </div>

          {/* Contact / info grid */}
          <dl className="grid grid-cols-1 gap-x-8 gap-y-4 text-sm sm:grid-cols-2">
            <InfoField label="ΑΦΜ" value={entity.afm} />
            <InfoField label="Τηλέφωνο" value={entity.phone} />
            <InfoField label="Email" value={entity.email} />
            <InfoField label="Εκπρόσωπος" value={entity.representative_name} />
            <InfoField label="Περιοχή" value={entity.region} />
          </dl>

          {entity.notes && (
            <p className="rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-600">
              {entity.notes}
            </p>
          )}

          {/* Fields list */}
          <div className="border-t pt-4">
            <h3 className="mb-3 text-sm font-semibold text-gray-900">
              Χωράφια
              {!fieldsLoading && fields.length > 0 && (
                <span className="ml-2 text-xs font-normal text-gray-400">
                  ({fields.length})
                </span>
              )}
            </h3>

            {fieldsLoading ? (
              <p className="text-sm text-gray-400">Φόρτωση…</p>
            ) : fields.length === 0 ? (
              <p className="text-sm text-gray-400">
                Δεν υπάρχουν καταχωρημένα χωράφια.
              </p>
            ) : (
              <div className="divide-y divide-gray-100 rounded-lg border border-gray-200">
                {fields.map((field) => (
                  <div
                    key={field.id}
                    className="flex items-start justify-between px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {field.location_name}
                      </p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                        {field.region && (
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <FiMapPin className="h-3 w-3 shrink-0" />
                            {field.region}
                          </span>
                        )}
                        {field.planting_summary && (
                          <span className="text-xs text-gray-400">
                            {field.planting_summary}
                          </span>
                        )}
                      </div>
                    </div>
                    {field.stremmata != null && (
                      <span className="ml-6 shrink-0 text-sm tabular-nums text-gray-500">
                        {field.stremmata} στρ.
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
