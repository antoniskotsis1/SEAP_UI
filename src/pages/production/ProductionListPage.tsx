import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { cn } from "@/lib/utils";
import { ProductionRecordsTab } from "./ProductionRecordsTab";
import { SettlementsTab } from "./SettlementsTab";

// ─── Tabs ─────────────────────────────────────────────────────────────────────

type TabKey = "production" | "estimation" | "settlement";

const TABS: { key: TabKey; label: string }[] = [
  { key: "production", label: "Παραγωγή" },
  { key: "estimation", label: "Εκτίμηση" },
  { key: "settlement", label: "Εκκαθάριση" },
];

// ─── Page component ─────────────────────────────────────────────────────────

export function ProductionListPage() {
  const [tab, setTab] = useState<TabKey>("production");

  return (
    <>
      <PageHeader
        title="Παραγωγή"
        description="Παραγωγή, εκτιμήσεις και εκκαθαρίσεις ανά χωράφι και έτος"
      />

      {/* ── Tab bar ─────────────────────────────────────────────────────────── */}
      <div className="mb-5 border-b border-gray-200">
        <nav className="-mb-px flex gap-6" aria-label="Υποσελίδες παραγωγής">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                "border-b-2 px-1 pb-3 text-sm font-medium transition-colors",
                tab === t.key
                  ? "border-brand-600 text-brand-700"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700",
              )}
              aria-current={tab === t.key ? "page" : undefined}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {/* ── Active tab ──────────────────────────────────────────────────────── */}
      {tab === "production" && <ProductionRecordsTab isEstimate={false} />}
      {tab === "estimation" && <ProductionRecordsTab isEstimate={true} />}
      {tab === "settlement" && <SettlementsTab />}
    </>
  );
}
