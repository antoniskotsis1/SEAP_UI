import { useState, useEffect, useMemo, type ReactNode } from "react";
import {
  FiMapPin,
  FiEdit2,
  FiPhone,
  FiMail,
  FiUser,
  FiHash,
  FiMap,
  FiFileText,
  FiChevronRight,
} from "react-icons/fi";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { VarietyPills } from "@/components/ui/VarietyPills";
import { FieldDetailModal } from "@/components/entities/FieldDetailModal";
import { fieldsApi } from "@/lib/services";
import { toField } from "@/lib/adapters";
import { formatNumber } from "@/lib/utils";
import { producerStatusLabel, producerStatusBadge } from "@/lib/labels";
import type { Producer, Field } from "@/types";

interface ProducerDetailModalProps {
  producer: Producer | null;
  onClose: () => void;
  /** When provided, an "Επεξεργασία" action is shown that opens the edit form. */
  onEdit?: (producer: Producer) => void;
}

/** Initials from a display name, e.g. "Γιώργος Παπαδόπουλος" → "ΓΠ". */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0]![0]! + (parts[1]?.[0] ?? "")).toUpperCase();
}

/** A single contact row with icon; renders nothing when empty. */
function ContactRow({
  icon,
  label,
  value,
  href,
}: {
  icon: ReactNode;
  label: string;
  value?: string | null;
  href?: string;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        {href ? (
          <a
            href={href}
            className="block truncate text-sm font-medium text-brand-600 hover:underline"
          >
            {value}
          </a>
        ) : (
          <p className="truncate text-sm font-medium text-gray-900">{value}</p>
        )}
      </div>
    </div>
  );
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
 * Read-only producer detail dialog: identity header with a summary, a contact
 * card, notes, and the list of that producer's fields (fetched on open). Shared
 * by every page that surfaces a producer. Pass `onEdit` to surface an edit action.
 */
export function ProducerDetailModal({
  producer,
  onClose,
  onEdit,
}: ProducerDetailModalProps) {
  const [fields, setFields] = useState<Field[]>([]);
  const [fieldsLoading, setFieldsLoading] = useState(false);
  const [detailField, setDetailField] = useState<Field | null>(null);

  useEffect(() => {
    if (!producer) {
      setFields([]);
      return;
    }
    setFieldsLoading(true);
    fieldsApi
      .list({ producerId: producer.id, size: 100, sortBy: "LOCATION_NAME" })
      .then((r) => setFields(r.content.map(toField)))
      .catch(() => setFields([]))
      .finally(() => setFieldsLoading(false));
  }, [producer]);

  const stats = useMemo(() => {
    const totalStremmata = fields.reduce((s, f) => s + (f.stremmata ?? 0), 0);
    const totalTrees = fields.reduce((s, f) => s + (f.total_plants ?? 0), 0);
    return { count: fields.length, totalStremmata, totalTrees };
  }, [fields]);

  const hasContact =
    producer &&
    (producer.afm ||
      producer.phone ||
      producer.email ||
      producer.representative_name ||
      producer.region);

  return (
    <>
    <Modal
      open={!!producer}
      onClose={onClose}
      title={
        producer ? (
          <span className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
              {initials(producer.display_name)}
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="truncate leading-tight">
                {producer.display_name}
              </span>
              <span className="mt-0.5">
                <span className={producerStatusBadge[producer.status]}>
                  {producerStatusLabel[producer.status]}
                </span>
              </span>
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
          {onEdit && producer && (
            <Button onPress={() => onEdit(producer)}>
              <FiEdit2 className="h-4 w-4" />
              Επεξεργασία
            </Button>
          )}
        </>
      }
    >
      {producer && (
        <div className="space-y-6">
          {/* ── Summary tiles ──────────────────────────────────────────── */}
          <div className="grid grid-cols-3 gap-2">
            <StatTile
              label="Χωράφια"
              value={fieldsLoading ? "—" : stats.count}
            />
            <StatTile
              label="Στρέμματα"
              value={fieldsLoading ? "—" : formatNumber(stats.totalStremmata)}
            />
            <StatTile
              label="Δέντρα"
              value={fieldsLoading ? "—" : formatNumber(stats.totalTrees)}
            />
          </div>

          {/* ── Contact ─────────────────────────────────────────────────── */}
          {hasContact && (
            <section>
              <h3 className="mb-3 text-sm font-semibold text-gray-900">
                Στοιχεία Επικοινωνίας
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <ContactRow
                  icon={<FiHash className="h-4 w-4" />}
                  label="ΑΦΜ"
                  value={producer.afm}
                />
                <ContactRow
                  icon={<FiPhone className="h-4 w-4" />}
                  label="Τηλέφωνο"
                  value={producer.phone}
                  href={producer.phone ? `tel:${producer.phone}` : undefined}
                />
                <ContactRow
                  icon={<FiMail className="h-4 w-4" />}
                  label="Email"
                  value={producer.email}
                  href={producer.email ? `mailto:${producer.email}` : undefined}
                />
                <ContactRow
                  icon={<FiUser className="h-4 w-4" />}
                  label="Εκπρόσωπος"
                  value={producer.representative_name}
                />
                <ContactRow
                  icon={<FiMapPin className="h-4 w-4" />}
                  label="Περιοχή"
                  value={producer.region}
                />
              </div>
            </section>
          )}

          {/* ── Notes ───────────────────────────────────────────────────── */}
          {producer.notes && (
            <section>
              <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                <FiFileText className="h-4 w-4 text-gray-400" />
                Σημειώσεις
              </h3>
              <p className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-600">
                {producer.notes}
              </p>
            </section>
          )}

          {/* ── Fields ──────────────────────────────────────────────────── */}
          <section>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
              <FiMap className="h-4 w-4 text-gray-400" />
              Χωράφια
              {!fieldsLoading && fields.length > 0 && (
                <span className="text-xs font-normal text-gray-400">
                  {fields.length}
                </span>
              )}
            </h3>

            {fieldsLoading ? (
              <p className="text-sm text-gray-400">Φόρτωση…</p>
            ) : fields.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-400">
                Δεν υπάρχουν καταχωρημένα χωράφια.
              </div>
            ) : (
              <div className="divide-y divide-gray-100 overflow-hidden rounded-lg border border-gray-200">
                {fields.map((field) => (
                  <button
                    key={field.id}
                    type="button"
                    onClick={() => setDetailField(field)}
                    className="group flex w-full items-start justify-between gap-4 px-4 py-3 text-left transition-colors hover:bg-gray-50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900 group-hover:text-brand-600">
                        {field.location_name}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                        {field.region && (
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <FiMapPin className="h-3 w-3 shrink-0" />
                            {field.region}
                          </span>
                        )}
                        {field.planting_varieties &&
                          field.planting_varieties.length > 0 && (
                            <VarietyPills varieties={field.planting_varieties} />
                          )}
                      </div>
                    </div>
                    <span className="flex shrink-0 items-center gap-1.5">
                      {field.stremmata != null && (
                        <span className="text-sm tabular-nums text-gray-500">
                          {formatNumber(field.stremmata)} στρ.
                        </span>
                      )}
                      <FiChevronRight className="h-4 w-4 text-gray-300" />
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </Modal>

    {/* Nested field detail — opened by clicking a field row. */}
    <FieldDetailModal
      field={detailField}
      onClose={() => setDetailField(null)}
    />
    </>
  );
}
