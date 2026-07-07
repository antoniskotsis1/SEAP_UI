import { BRAND_CHART_COLOR } from "@/lib/labels";
import { formatNumber } from "@/lib/utils";
import type { YieldPerStremmaPoint } from "@/types";
import { LineChart } from "./LineChart";

interface YieldPerStremmaChartProps {
  data: YieldPerStremmaPoint[];
}

/** Productivity trend: actual kg per stremma per harvest year. */
export function YieldPerStremmaChart({ data }: YieldPerStremmaChartProps) {
  return (
    <LineChart
      title="Απόδοση ανά στρέμμα"
      subtitle="kg / στρέμμα ανά έτος"
      color={BRAND_CHART_COLOR}
      formatValue={(n) => formatNumber(n)}
      data={data.map((d) => ({
        label: String(d.year),
        value: d.kg_per_stremma,
      }))}
      emptyMessage="Δεν υπάρχουν δεδομένα παραγωγής."
    />
  );
}
