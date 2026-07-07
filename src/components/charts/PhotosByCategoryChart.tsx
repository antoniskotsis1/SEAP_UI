import { BRAND_CHART_COLOR, photoCategoryLabel } from "@/lib/labels";
import type { CategoryCountPoint } from "@/types";
import { HBarChart } from "./HBarChart";

interface PhotosByCategoryChartProps {
  data: CategoryCountPoint[];
}

/**
 * Field-work documentation volume by photo category. A single-hue magnitude
 * ranking (the 6-category badge palette is not chart-safe, and seasonality is
 * better served by a future category×month heatmap).
 */
export function PhotosByCategoryChart({ data }: PhotosByCategoryChartProps) {
  return (
    <HBarChart
      title="Τεκμηρίωση εργασιών"
      subtitle="Φωτογραφίες ανά κατηγορία"
      labelWidthClass="w-32"
      data={data.map((d) => ({
        key: d.category,
        label: photoCategoryLabel[d.category],
        value: d.count,
        color: BRAND_CHART_COLOR,
      }))}
      emptyMessage="Δεν υπάρχουν φωτογραφίες."
    />
  );
}
