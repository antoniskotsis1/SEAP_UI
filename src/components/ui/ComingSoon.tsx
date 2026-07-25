import { FiClock } from "react-icons/fi";

interface ComingSoonProps {
  /** Optional override for the explanatory line. */
  message?: string;
}

/**
 * Placeholder panel for features whose backend is not implemented yet. Render it
 * where the feature's content would go (pages add their own `PageHeader`).
 */
export function ComingSoon({ message }: ComingSoonProps) {
  return (
    <div className="card flex flex-col items-center justify-center gap-4 px-6 py-20 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-600">
        <FiClock className="h-7 w-7" />
      </div>
      <span className="inline-flex items-center rounded-full bg-gold-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gold-700">
        Σύντομα
      </span>
      <p className="max-w-md text-sm text-gray-500">
        {message ??
          "Αυτή η λειτουργία θα είναι διαθέσιμη σύντομα, μόλις ολοκληρωθεί η υλοποίηση από την πλευρά του συστήματος."}
      </p>
    </div>
  );
}
