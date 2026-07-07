import { severityChartColor, severityLabel } from "@/lib/labels";
import type { SeverityCountPoint } from "@/types";
import { HBarChart } from "./HBarChart";

interface OpenIssuesChartProps {
  data: SeverityCountPoint[];
}

/** Open issues grouped by severity (a reserved status ramp; always labelled). */
export function OpenIssuesChart({ data }: OpenIssuesChartProps) {
  return (
    <HBarChart
      title="Ανοιχτά προβλήματα"
      subtitle="Ανά σοβαρότητα"
      data={data.map((d) => ({
        key: d.severity,
        label: severityLabel[d.severity],
        value: d.count,
        color: severityChartColor[d.severity],
      }))}
      emptyMessage="Δεν υπάρχουν ανοιχτά προβλήματα."
    />
  );
}
