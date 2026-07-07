import { varietyChartColor, varietyLabel } from "@/lib/labels";
import type { VarietyCompositionPoint } from "@/types";
import { DonutChart } from "./DonutChart";

interface VarietyCompositionChartProps {
  data: VarietyCompositionPoint[];
}

/** Tree population split across AC22 / AC76 / MALE. */
export function VarietyCompositionChart({ data }: VarietyCompositionChartProps) {
  return (
    <DonutChart
      title="Σύνθεση ποικιλιών"
      subtitle="Δέντρα ανά ποικιλία"
      unit="δέντρα"
      data={data.map((d) => ({
        key: d.variety,
        label: varietyLabel[d.variety],
        value: d.tree_count,
        color: varietyChartColor[d.variety],
      }))}
      emptyMessage="Δεν υπάρχουν φυτεύσεις."
    />
  );
}
