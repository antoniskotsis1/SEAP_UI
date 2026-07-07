import { formatNumber } from "@/lib/utils";
import { ChartCard, ChartEmpty } from "./ChartCard";

const W = 320;
const H = 170;
const PAD = { top: 26, right: 14, bottom: 24, left: 14 };

export interface LinePoint {
  label: string;
  value: number;
}

interface LineChartProps {
  title: string;
  subtitle?: string;
  data: LinePoint[];
  color: string;
  formatValue?: (n: number) => string;
  emptyMessage: string;
}

/**
 * Single-series line chart over an ordered axis (e.g. years). One series, one
 * hue, no legend — the title names the measure. Points are direct-labelled.
 */
export function LineChart({
  title,
  subtitle,
  data,
  color,
  formatValue = formatNumber,
  emptyMessage,
}: LineChartProps) {
  const hasData = data.length > 0 && data.some((d) => d.value > 0);

  if (!hasData) {
    return (
      <ChartCard title={title} subtitle={subtitle}>
        <ChartEmpty message={emptyMessage} />
      </ChartCard>
    );
  }

  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const baseline = PAD.top + plotH;
  const max = Math.max(...data.map((d) => d.value)) * 1.15 || 1;

  const x = (i: number) =>
    data.length === 1
      ? PAD.left + plotW / 2
      : PAD.left + (i / (data.length - 1)) * plotW;
  const y = (v: number) => PAD.top + (1 - v / max) * plotH;

  const pts = data.map((d, i) => ({ ...d, cx: x(i), cy: y(d.value) }));
  const linePath = pts.map((p) => `${p.cx},${p.cy}`).join(" ");
  const areaPath =
    `M ${pts[0]!.cx},${baseline} ` +
    pts.map((p) => `L ${p.cx},${p.cy}`).join(" ") +
    ` L ${pts[pts.length - 1]!.cx},${baseline} Z`;

  return (
    <ChartCard title={title} subtitle={subtitle}>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img">
        <path d={areaPath} fill={color} fillOpacity="0.1" />
        <polyline
          points={linePath}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {pts.map((p) => (
          <g key={p.label}>
            <circle
              cx={p.cx}
              cy={p.cy}
              r="3.5"
              fill={color}
              stroke="#fff"
              strokeWidth="2"
            >
              <title>{`${p.label}: ${formatValue(p.value)}`}</title>
            </circle>
            <text
              x={p.cx}
              y={p.cy - 9}
              textAnchor="middle"
              className="fill-gray-700 text-[10px] font-medium tabular-nums"
            >
              {formatValue(p.value)}
            </text>
            <text
              x={p.cx}
              y={H - 6}
              textAnchor="middle"
              className="fill-gray-400 text-[10px] tabular-nums"
            >
              {p.label}
            </text>
          </g>
        ))}
      </svg>
    </ChartCard>
  );
}
