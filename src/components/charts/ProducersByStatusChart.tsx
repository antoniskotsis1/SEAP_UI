import { producerStatusChartColor, producerStatusLabel } from "@/lib/labels";
import type { StatusCountPoint } from "@/types";
import { DonutChart } from "./DonutChart";

interface ProducersByStatusChartProps {
  data: StatusCountPoint[];
}

/** Producers grouped by status (LEAD / ACTIVE / INACTIVE). */
export function ProducersByStatusChart({ data }: ProducersByStatusChartProps) {
  return (
    <DonutChart
      title="Παραγωγοί ανά κατάσταση"
      subtitle="Κατανομή χαρτοφυλακίου"
      unit="παραγωγοί"
      data={data.map((d) => ({
        key: d.status,
        label: producerStatusLabel[d.status],
        value: d.count,
        color: producerStatusChartColor[d.status],
      }))}
      emptyMessage="Δεν υπάρχουν παραγωγοί."
    />
  );
}
