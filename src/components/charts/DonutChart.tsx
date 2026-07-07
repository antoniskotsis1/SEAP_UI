import { formatNumber } from "@/lib/utils";
import { ChartCard, ChartEmpty } from "./ChartCard";

const R = 60;
const CIRC = 2 * Math.PI * R;
const GAP = 3; // px surface gap between arcs

export interface DonutSegment {
  key: string;
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  title: string;
  subtitle?: string;
  /** Unit shown under the centered total, e.g. "δέντρα". */
  unit: string;
  data: DonutSegment[];
  emptyMessage: string;
}

/**
 * Generic donut for a part-to-whole breakdown. Each arc carries a 2px surface
 * gap; the labelled legend (value + share) reinforces identity beyond color.
 */
export function DonutChart({
  title,
  subtitle,
  unit,
  data,
  emptyMessage,
}: DonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (total <= 0) {
    return (
      <ChartCard title={title} subtitle={subtitle}>
        <ChartEmpty message={emptyMessage} />
      </ChartCard>
    );
  }

  let cumulative = 0;
  const arcs = data.map((d) => {
    const startDeg = (cumulative / total) * 360 - 90;
    const len = Math.max((d.value / total) * CIRC - GAP, 0);
    cumulative += d.value;
    return { ...d, startDeg, len };
  });

  return (
    <ChartCard title={title} subtitle={subtitle}>
      <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
        <div className="relative shrink-0">
          <svg viewBox="0 0 160 160" className="h-40 w-40" role="img">
            {arcs.map((a) => (
              <circle
                key={a.key}
                cx="80"
                cy="80"
                r={R}
                fill="none"
                stroke={a.color}
                strokeWidth="22"
                strokeDasharray={`${a.len} ${CIRC - a.len}`}
                transform={`rotate(${a.startDeg} 80 80)`}
              >
                <title>{`${a.label}: ${formatNumber(a.value)} ${unit}`}</title>
              </circle>
            ))}
          </svg>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold tabular-nums text-gray-900">
              {formatNumber(total)}
            </span>
            <span className="text-[11px] text-gray-400">{unit}</span>
          </div>
        </div>

        <ul className="space-y-2">
          {data.map((d) => {
            const pct = Math.round((d.value / total) * 100);
            return (
              <li key={d.key} className="flex items-center gap-2 text-sm">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-sm"
                  style={{ backgroundColor: d.color }}
                  aria-hidden
                />
                <span className="w-24 truncate text-gray-600">{d.label}</span>
                <span className="w-12 text-right font-medium tabular-nums text-gray-900">
                  {formatNumber(d.value)}
                </span>
                <span className="w-9 text-right tabular-nums text-gray-400">
                  {pct}%
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </ChartCard>
  );
}
