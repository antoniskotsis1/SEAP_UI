import type { ReactNode } from "react";

export interface LegendItem {
  label: string;
  color: string;
}

interface ChartCardProps {
  title: string;
  /** Optional short subtitle under the title (e.g. units). */
  subtitle?: string;
  /** Legend swatches — shown for two or more series. */
  legend?: LegendItem[];
  children: ReactNode;
}

/**
 * Shared shell for a dashboard chart: a card with a title, optional subtitle and
 * legend, and the plot as children. Legend/title text use ink tokens, never the
 * series color — the swatch beside them carries identity.
 */
export function ChartCard({ title, subtitle, legend, children }: ChartCardProps) {
  return (
    <div className="card flex flex-col p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-gray-400">{subtitle}</p>}
        </div>
        {legend && legend.length > 1 && (
          <ul className="flex flex-wrap justify-end gap-x-3 gap-y-1">
            {legend.map((item) => (
              <li
                key={item.label}
                className="flex items-center gap-1.5 text-xs text-gray-500"
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-sm"
                  style={{ backgroundColor: item.color }}
                  aria-hidden
                />
                {item.label}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

/** Centered placeholder used when a chart has no data to show. */
export function ChartEmpty({ message }: { message: string }) {
  return (
    <div className="flex h-full min-h-[160px] items-center justify-center text-center text-sm text-gray-400">
      {message}
    </div>
  );
}
