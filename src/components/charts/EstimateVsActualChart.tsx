import {
  BRAND_CHART_COLOR,
  NEUTRAL_CHART_COLOR,
} from "@/lib/labels";
import { formatNumber } from "@/lib/utils";
import type { EstimateVsActualPoint } from "@/types";
import { HBarChart } from "./HBarChart";
import { ChartCard, ChartEmpty } from "./ChartCard";

interface EstimateVsActualChartProps {
  data: EstimateVsActualPoint | null;
}

/** Estimate vs. actual production (kg) for the most recent year with data. */
export function EstimateVsActualChart({ data }: EstimateVsActualChartProps) {
  if (!data) {
    return (
      <ChartCard title="Εκτίμηση vs Πραγματική">
        <ChartEmpty message="Δεν υπάρχουν δεδομένα παραγωγής." />
      </ChartCard>
    );
  }

  return (
    <HBarChart
      title="Εκτίμηση vs Πραγματική"
      subtitle={`Παραγωγή ${data.year} (kg)`}
      labelWidthClass="w-24"
      formatValue={(n) => formatNumber(n)}
      data={[
        {
          key: "estimate",
          label: "Εκτίμηση",
          value: data.estimate_kg,
          color: NEUTRAL_CHART_COLOR,
        },
        {
          key: "actual",
          label: "Πραγματική",
          value: data.actual_kg,
          color: BRAND_CHART_COLOR,
        },
      ]}
      emptyMessage="Δεν υπάρχουν δεδομένα παραγωγής."
    />
  );
}
