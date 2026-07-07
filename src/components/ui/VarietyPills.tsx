import { formatNumber } from "@/lib/utils";
import { varietyLabel, varietyBadge, VARIETY_ORDER } from "@/lib/labels";
import type { VarietyCount } from "@/types";

interface VarietyPillsProps {
  varieties?: VarietyCount[];
}

/**
 * Renders per-variety tree counts as colored badges ("pills"), e.g. AC22 · AC76 ·
 * Αρσενικό, each with its count. Falls back to an em-dash when there are none.
 * Ordered by `VARIETY_ORDER`.
 */
export function VarietyPills({ varieties }: VarietyPillsProps) {
  if (!varieties || varieties.length === 0) {
    return <span className="text-gray-400">—</span>;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {VARIETY_ORDER.filter((v) => varieties.some((x) => x.variety === v)).map(
        (v) => {
          const count = varieties.find((x) => x.variety === v)!.tree_count;
          return (
            <span
              key={v}
              className={`${varietyBadge[v]} inline-flex items-center gap-1`}
            >
              {varietyLabel[v]}
              <span className="font-semibold tabular-nums">
                {formatNumber(count)}
              </span>
            </span>
          );
        },
      )}
    </div>
  );
}
