// Central home for enum → display-label and enum → badge-class maps.
// Keep the Greek strings and `badge-*` classes byte-identical to what the
// pages rendered before, so the UI does not change.

import type {
  ProducerStatus,
  Variety,
  Sex,
  PlantingMethod,
  TrainingShape,
  TransactionType,
  InvoiceStatus,
  IssueSeverity,
  IssueStatus,
  PhotoCategory,
} from "@/types";

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

// ─── Planting ────────────────────────────────────────────────────────────────

export const varietyLabel: Record<Variety, string> = { AC22: "AC22", AC76: "AC76" };
export const sexLabel: Record<Sex, string> = {
  FEMALE: "Θηλυκό",
  MALE: "Αρσενικό",
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
export const issueStatusLabel: Record<IssueStatus, string> = {
  OPEN: "Ανοιχτό",
  RESOLVED: "Επιλύθηκε",
};
export const issueStatusBadge: Record<IssueStatus, string> = {
  OPEN: "badge-yellow",
  RESOLVED: "badge-green",
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
  ARAIWMA_BLASTOU: "Αραίωμα Βλαστού",
  ARAIWMA_KARPOU: "Αραίωμα Καρπού",
  KALOKAIRI_NERA: "Καλοκαίρι-Νερά",
  PERIODOS_SUGKOMIDIS: "Περίοδος Συγκομιδής",
  OTHER: "Άλλο",
};
export const photoCategoryBadge: Record<PhotoCategory, string> = {
  KLADEMA: "badge-gray",
  ARAIWMA_BLASTOU: "badge-green",
  ARAIWMA_KARPOU: "badge-blue",
  KALOKAIRI_NERA: "badge-yellow",
  PERIODOS_SUGKOMIDIS: "badge-red",
  OTHER: "badge-gray",
};
