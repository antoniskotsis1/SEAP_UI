import { useEffect, useState, type ReactNode } from "react";
import {
  FiEdit2,
  FiAlertTriangle,
  FiFileText,
  FiCamera,
} from "react-icons/fi";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { DetailRow } from "@/components/ui/DescriptionList";
import { imagesApi } from "@/lib/services";
import { formatDate } from "@/lib/utils";
import {
  severityLabel,
  severityBadge,
  issueStateLabel,
  issueStateBadge,
} from "@/lib/labels";
import type { ImageDto, IssueDto, IssueSeverity } from "@/types/api";

interface IssueDetailModalProps {
  issue: IssueDto | null;
  /** Resolved field/producer labels (the issue only carries `fieldId`). */
  fieldName?: string;
  producerName?: string;
  onClose: () => void;
  /** When provided, an "Επεξεργασία" action opens the edit form. */
  onEdit?: (issue: IssueDto) => void;
}

/** Avatar tint by severity, so the header reads the issue's seriousness. */
const severityAvatar: Record<IssueSeverity, string> = {
  HIGH: "bg-red-100 text-red-600",
  MEDIUM: "bg-amber-100 text-amber-600",
  LOW: "bg-gray-100 text-gray-500",
};

function SectionHeading({
  icon,
  children,
}: {
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-900">
      <span className="text-gray-400">{icon}</span>
      {children}
    </h3>
  );
}

/**
 * Read-only view of a field issue: severity/state, description, when it was
 * reported, and any photos linked to it. Editing routes through `onEdit`.
 */
export function IssueDetailModal({
  issue,
  fieldName,
  producerName,
  onClose,
  onEdit,
}: IssueDetailModalProps) {
  const [photos, setPhotos] = useState<ImageDto[]>([]);

  useEffect(() => {
    if (!issue) {
      setPhotos([]);
      return;
    }
    imagesApi
      .list({ issueId: issue.id, size: 50 })
      .then((r) => setPhotos(r.content))
      .catch(() => setPhotos([]));
  }, [issue]);

  const fieldValue = [fieldName, producerName].filter(Boolean).join(" — ");

  return (
    <Modal
      open={!!issue}
      onClose={onClose}
      title={
        issue ? (
          <span className="flex items-center gap-3">
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${severityAvatar[issue.severity]}`}
            >
              <FiAlertTriangle className="h-5 w-5" />
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="truncate leading-tight">{issue.title}</span>
              {fieldValue && (
                <span className="truncate text-xs font-normal text-gray-500">
                  {fieldValue}
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
          {onEdit && issue && (
            <Button onPress={() => onEdit(issue)}>
              <FiEdit2 className="h-4 w-4" />
              Επεξεργασία
            </Button>
          )}
        </>
      }
    >
      {issue && (
        <div className="space-y-6">
          {/* ── Severity + state ───────────────────────────────────────── */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500">
                Σοβαρότητα
              </span>
              <span
                className={severityBadge[issue.severity]}
                title="Σοβαρότητα"
              >
                {severityLabel[issue.severity]}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500">
                Κατάσταση
              </span>
              <span className={issueStateBadge[issue.state]} title="Κατάσταση">
                {issueStateLabel[issue.state]}
              </span>
            </div>
          </div>

          {/* ── Description ────────────────────────────────────────────── */}
          <section>
            <SectionHeading icon={<FiFileText className="h-4 w-4" />}>
              Περιγραφή
            </SectionHeading>
            {issue.description ? (
              <p className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-600">
                {issue.description}
              </p>
            ) : (
              <p className="rounded-lg border border-dashed border-gray-200 px-3 py-2.5 text-sm text-gray-400">
                Χωρίς περιγραφή.
              </p>
            )}
          </section>

          {/* ── Details ────────────────────────────────────────────────── */}
          <section>
            <SectionHeading icon={<FiAlertTriangle className="h-4 w-4" />}>
              Στοιχεία
            </SectionHeading>
            <dl className="divide-y divide-gray-100 rounded-lg border border-gray-200 px-3">
              {fieldValue && <DetailRow label="Χωράφι" value={fieldValue} />}
              <DetailRow label="Ημ. Αναφοράς" value={formatDate(issue.createdAt)} />
              <DetailRow
                label="Τελευταία Ενημέρωση"
                value={formatDate(issue.updatedAt)}
              />
            </dl>
          </section>

          {/* ── Linked photos ──────────────────────────────────────────── */}
          {photos.length > 0 && (
            <section>
              <SectionHeading icon={<FiCamera className="h-4 w-4" />}>
                Φωτογραφίες
                <span className="text-xs font-normal text-gray-400">
                  {photos.length}
                </span>
              </SectionHeading>
              <div className="grid grid-cols-3 gap-3">
                {photos.map((photo) => (
                  <a
                    key={photo.id}
                    href={photo.url}
                    target="_blank"
                    rel="noreferrer"
                    className="overflow-hidden rounded-lg border border-gray-200 transition hover:opacity-95"
                  >
                    <img
                      src={photo.url}
                      alt={photo.notes ?? ""}
                      loading="lazy"
                      className="h-32 w-full object-cover"
                    />
                  </a>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </Modal>
  );
}
