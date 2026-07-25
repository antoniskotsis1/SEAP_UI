// Central home for enum → display-label and enum → badge-class maps.
// Keep the Greek strings and `badge-*` classes byte-identical to what the
// pages rendered before, so the UI does not change.

import type {
  ProducerStatus,
  Variety,
  PlantingMethod,
  TrainingShape,
  TransactionType,
  InvoiceStatus,
  IssueSeverity,
  IssueStatus,
  PhotoCategory,
} from "@/types";
import type { IssueState } from "@/types/api";

// ─── Producer ────────────────────────────────────────────────────────────────

export const producerStatusLabel: Record<ProducerStatus, string> = {
  LEAD: "Lead",
  ACTIVE: "Ενεργός",
  INACTIVE: "Ανενεργός",
};
export const producerStatusBadge: Record<ProducerStatus, string> = {
  LEAD: "badge-blue",
  ACTIVE: "badge-green",
  INACTIVE: "badge-gray",
};
/** Solid hex fills for producer status in charts (categorical; validated). */
export const producerStatusChartColor: Record<ProducerStatus, string> = {
  LEAD: "#2563eb",
  ACTIVE: "#16a34a",
  INACTIVE: "#64748b",
};

/** Single brand hue for magnitude charts (one series, one hue). */
export const BRAND_CHART_COLOR = "#13a319";
/** Neutral hue for the de-emphasized slot (e.g. an estimate vs. a realized value). */
export const NEUTRAL_CHART_COLOR = "#64748b";

// ─── Planting ────────────────────────────────────────────────────────────────

export const varietyLabel: Record<Variety, string> = {
  MALE: "Αρσενικά",
  AC22: "AC22",
  AC76: "AC76",
};
export const varietyBadge: Record<Variety, string> = {
  MALE: "badge-gray",
  AC22: "badge-blue",
  AC76: "badge-teal",
};
/** Display order for the three varieties in filters, forms and badges. */
export const VARIETY_ORDER: Variety[] = ["AC22", "AC76", "MALE"];
/**
 * Solid hex fills for varieties in charts (badges use tint classes instead).
 * Validated as a categorical palette: AC22 blue, AC76 teal, MALE neutral slate.
 */
export const varietyChartColor: Record<Variety, string> = {
  AC22: "#2563eb",
  AC76: "#0d9488",
  MALE: "#64748b",
};

// ─── Field ───────────────────────────────────────────────────────────────────

export const methodLabel: Record<PlantingMethod, string> = {
  PLANTING: "Φύτευση",
  GRAFTING: "Εμβολιασμός",
  MIX: "Μεικτό",
};
export const shapeLabel: Record<TrainingShape, string> = {
  FISHBONE: "Ψαροκόκαλο",
  UMBRELLA: "Ομπρέλα",
  MIX: "Μεικτό",
  OTHER: "Άλλο",
};

// ─── Field issue ─────────────────────────────────────────────────────────────

export const severityLabel: Record<IssueSeverity, string> = {
  LOW: "Χαμηλή",
  MEDIUM: "Μέτρια",
  HIGH: "Υψηλή",
};
export const severityBadge: Record<IssueSeverity, string> = {
  LOW: "badge-gray",
  MEDIUM: "badge-yellow",
  HIGH: "badge-red",
};
/** Solid hex fills for severity in charts — a reserved status ramp (always labelled). */
export const severityChartColor: Record<IssueSeverity, string> = {
  LOW: "#94a3b8",
  MEDIUM: "#d97706",
  HIGH: "#dc2626",
};
export const issueStatusLabel: Record<IssueStatus, string> = {
  OPEN: "Ανοιχτό",
  RESOLVED: "Επιλύθηκε",
};
export const issueStatusBadge: Record<IssueStatus, string> = {
  OPEN: "badge-yellow",
  RESOLVED: "badge-green",
};

// Issue `state` as served by the real API (four states).
export const ISSUE_STATE_ORDER: IssueState[] = [
  "OPEN",
  "IN_PROGRESS",
  "CLOSED",
  "OBSOLETE",
];
export const issueStateLabel: Record<IssueState, string> = {
  OPEN: "Ανοιχτό",
  IN_PROGRESS: "Σε εξέλιξη",
  CLOSED: "Κλειστό",
  OBSOLETE: "Άκυρο",
};
export const issueStateBadge: Record<IssueState, string> = {
  OPEN: "badge-yellow",
  IN_PROGRESS: "badge-blue",
  CLOSED: "badge-green",
  OBSOLETE: "badge-gray",
};

// ─── Financials ──────────────────────────────────────────────────────────────

export const transactionTypeLabel: Record<TransactionType, string> = {
  PAYMENT: "Πληρωμή",
  DEBT: "Οφειλή",
  OFFSET: "Συμψηφισμός",
};
export const transactionTypeBadge: Record<TransactionType, string> = {
  PAYMENT: "badge-green",
  DEBT: "badge-red",
  OFFSET: "badge-blue",
};
export const invoiceStatusLabel: Record<InvoiceStatus, string> = {
  ISSUED: "Εκδόθηκε",
  NOT_ISSUED: "Δεν εκδόθηκε",
  PARTIAL: "Μερική",
};
export const invoiceStatusBadge: Record<InvoiceStatus, string> = {
  ISSUED: "badge-green",
  NOT_ISSUED: "badge-gray",
  PARTIAL: "badge-yellow",
};

// ─── Field photos ────────────────────────────────────────────────────────────

export const PHOTO_CATEGORY_ORDER: PhotoCategory[] = [
  "KLADEMA",
  "ARAIWMA_BLASTOU",
  "ARAIWMA_KARPOU",
  "KALOKAIRI_NERA",
  "PERIODOS_SUGKOMIDIS",
  "OTHER",
];
export const photoCategoryLabel: Record<PhotoCategory, string> = {
  KLADEMA: "Κλάδεμα",
  ARAIWMA_BLASTOU: "Αραίωμα Βλαστού-Μπουμπούκι",
  ARAIWMA_KARPOU: "Αραίωμα Καρπού",
  KALOKAIRI_NERA: "Καλοκαιρινή Επίβλεψη",
  PERIODOS_SUGKOMIDIS: "Συγκομιδή",
  OTHER: "Άλλο",
};
// Distinct, calm hues per category — deliberately no red/error colors.
export const photoCategoryBadge: Record<PhotoCategory, string> = {
  KLADEMA: "badge-blue",
  ARAIWMA_BLASTOU: "badge-teal",
  ARAIWMA_KARPOU: "badge-green",
  KALOKAIRI_NERA: "badge-amber",
  PERIODOS_SUGKOMIDIS: "badge-purple",
  OTHER: "badge-gray",
};

/**
 * Border color wrapping a photo thumbnail. A normal photo gets a neutral frame;
 * only photos documenting a problem are highlighted (amber = low/medium, red =
 * severe) so issues stand out without every photo looking like a status.
 */
export function photoIssueBorder(issue?: { severity: IssueSeverity }): string {
  if (!issue) return "border-gray-200";
  return issue.severity === "HIGH" ? "border-red-400" : "border-amber-400";
}
