import { BRAND_CHART_COLOR } from "@/lib/labels";
import { formatNumber } from "@/lib/utils";
import type { RegionStremmataPoint } from "@/types";
import { HBarChart } from "./HBarChart";

interface RegionStremmataChartProps {
  data: RegionStremmataPoint[];
  /** Cap the number of regions shown (largest first). */
  limit?: number;
}

/** Total land area (stremmata) per region — a single-measure ranking. */
export function RegionStremmataChart({
  data,
  limit = 8,
}: RegionStremmataChartProps) {
  return (
    <HBarChart
      title="Στρέμματα ανά περιοχή"
      subtitle={data.length > limit ? `Κορυφαίες ${limit} περιοχές` : undefined}
      labelWidthClass="w-28"
      formatValue={(n) => formatNumber(n)}
      data={data.slice(0, limit).map((d) => ({
        key: d.region,
        label: d.region,
        value: d.stremmata,
        color: BRAND_CHART_COLOR,
      }))}
      emptyMessage="Δεν υπάρχουν χωράφια."
    />
  );
}
