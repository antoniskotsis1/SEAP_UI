// Shared presentational primitives for detail views. Both render `null` when
// the value is empty, so callers can list every possible field unconditionally.

interface FieldProps {
  label: string;
  value?: string | null;
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
export function DetailRow({ label, value }: FieldProps) {
  if (!value) return null;
  return (
    <div className="flex gap-3 py-1.5">
      <dt className="w-44 shrink-0 text-sm text-gray-500">{label}</dt>
      <dd className="text-sm font-medium text-gray-900">{value}</dd>
    </div>
  );
}
