import { formatNumber } from "@/lib/utils";
import { ChartCard, ChartEmpty } from "./ChartCard";

export interface HBar {
  key: string;
  label: string;
  value: number;
  color: string;
}

interface HBarChartProps {
  title: string;
  subtitle?: string;
  data: HBar[];
  /** Formats the value shown at the end of each bar (default: thousands). */
  formatValue?: (n: number) => string;
  /** Width of the label column, in Tailwind units (default 16 = 4rem). */
  labelWidthClass?: string;
  emptyMessage: string;
}

/**
 * Generic horizontal bar chart for ranking a single measure across categories.
 * Each bar is labelled (category + value), so it never relies on color alone.
 */
export function HBarChart({
  title,
  subtitle,
  data,
  formatValue = formatNumber,
  labelWidthClass = "w-16",
  emptyMessage,
}: HBarChartProps) {
  const max = Math.max(...data.map((d) => d.value), 0);
  const hasData = data.some((d) => d.value > 0);

  return (
    <ChartCard title={title} subtitle={subtitle}>
      {hasData ? (
        <div className="space-y-3">
          {data.map((d) => {
            const pct = max > 0 ? (d.value / max) * 100 : 0;
            return (
              <div key={d.key} className="flex items-center gap-3">
                <span
                  className={`${labelWidthClass} shrink-0 truncate text-sm text-gray-600`}
                  title={d.label}
                >
                  {d.label}
                </span>
                <div className="h-5 flex-1 overflow-hidden rounded bg-gray-100">
                  <div
                    className="h-full rounded"
                    style={{
                      width: `${pct}%`,
                      minWidth: d.value > 0 ? 4 : 0,
                      backgroundColor: d.color,
                    }}
                    title={`${d.label}: ${formatValue(d.value)}`}
                  />
                </div>
                <span className="w-12 shrink-0 text-right text-sm font-medium tabular-nums text-gray-900">
                  {formatValue(d.value)}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <ChartEmpty message={emptyMessage} />
      )}
    </ChartCard>
  );
}
