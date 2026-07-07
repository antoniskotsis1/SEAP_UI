import { formatNumber } from "@/lib/utils";
import { varietyChartColor, varietyLabel } from "@/lib/labels";
import type { ProductionYearPoint } from "@/types";
import { ChartCard, ChartEmpty } from "./ChartCard";

const PLOT_H = 180; // px

interface ProductionByYearChartProps {
  data: ProductionYearPoint[];
}

/**
 * Actual production per harvest year, stacked by fruit variety (AC22 + AC76).
 * Totals are direct-labelled above each bar; a 2px surface gap separates the two
 * segments. MALE is absent by design — pollinators never bear fruit.
 */
export function ProductionByYearChart({ data }: ProductionByYearChartProps) {
  const max = Math.max(...data.map((d) => d.ac22_kg + d.ac76_kg), 0);
  const hasData = data.length > 0 && max > 0;

  return (
    <ChartCard
      title="Παραγωγή ανά έτος"
      subtitle="Πραγματική παραγωγή (kg)"
      legend={[
        { label: varietyLabel.AC22, color: varietyChartColor.AC22 },
        { label: varietyLabel.AC76, color: varietyChartColor.AC76 },
      ]}
    >
      {hasData ? (
        <div className="flex items-end gap-3" style={{ height: PLOT_H + 44 }}>
          {data.map((d) => {
            const total = d.ac22_kg + d.ac76_kg;
            const h22 = (d.ac22_kg / max) * PLOT_H;
            const h76 = (d.ac76_kg / max) * PLOT_H;
            return (
              <div
                key={d.year}
                className="flex min-w-0 flex-1 flex-col items-center gap-1.5"
              >
                <span className="text-[11px] font-medium tabular-nums text-gray-700">
                  {formatNumber(total)}
                </span>
                <div
                  className="flex w-full max-w-[52px] flex-col justify-end"
                  style={{ height: PLOT_H }}
                >
                  {d.ac76_kg > 0 && (
                    <div
                      style={{
                        height: h76,
                        backgroundColor: varietyChartColor.AC76,
                        borderTopLeftRadius: 4,
                        borderTopRightRadius: 4,
                      }}
                      title={`${varietyLabel.AC76}: ${formatNumber(d.ac76_kg)} kg`}
                    />
                  )}
                  {d.ac22_kg > 0 && (
                    <div
                      style={{
                        height: h22,
                        marginTop: d.ac76_kg > 0 ? 2 : 0,
                        backgroundColor: varietyChartColor.AC22,
                        borderTopLeftRadius: d.ac76_kg > 0 ? 0 : 4,
                        borderTopRightRadius: d.ac76_kg > 0 ? 0 : 4,
                      }}
                      title={`${varietyLabel.AC22}: ${formatNumber(d.ac22_kg)} kg`}
                    />
                  )}
                </div>
                <span className="text-xs tabular-nums text-gray-500">
                  {d.year}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <ChartEmpty message="Δεν υπάρχουν καταγραφές παραγωγής." />
      )}
    </ChartCard>
  );
}
