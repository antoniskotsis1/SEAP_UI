import type { ReactNode } from "react";

// Shared presentational primitives for detail views. `InfoField` renders `null`
// when empty (so callers can list every possible field unconditionally), while
// `DetailRow` always renders the row, falling back to an em-dash placeholder.

interface FieldProps {
  label: string;
  value?: string | null;
}

interface DetailRowProps {
  label: string;
  value?: ReactNode;
}

/** A compact label/value cell used inside a `<dl>` grid (producer info). */
export function InfoField({ label, value }: FieldProps) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-gray-900">{value}</dd>
    </div>
  );
}

/** A labelled row used inside a stacked `<dl>` (field detail). */
export function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="flex gap-3 py-1.5">
      <dt className="w-44 shrink-0 text-sm text-gray-500">{label}</dt>
      <dd className="text-sm font-medium text-gray-900">{value || "—"}</dd>
    </div>
  );
}
