import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  FiUsers,
  FiMap,
  FiBarChart2,
  FiMaximize,
  FiAlertTriangle,
} from "react-icons/fi";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { ProductionByYearChart } from "@/components/charts/ProductionByYearChart";
import { EstimateVsActualChart } from "@/components/charts/EstimateVsActualChart";
import { YieldPerStremmaChart } from "@/components/charts/YieldPerStremmaChart";
import { VarietyCompositionChart } from "@/components/charts/VarietyCompositionChart";
import { ProducersByStatusChart } from "@/components/charts/ProducersByStatusChart";
import { RegionStremmataChart } from "@/components/charts/RegionStremmataChart";
import { OpenIssuesChart } from "@/components/charts/OpenIssuesChart";
import { PhotosByCategoryChart } from "@/components/charts/PhotosByCategoryChart";
import { api } from "@/lib/api";
import { formatNumber } from "@/lib/utils";
import type { DashboardStats } from "@/types";

/** Subtle section divider used to group the dashboard into themes. */
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    api
      .get<DashboardStats>("/dashboard")
      .then(setStats)
      .catch(() => setStats(null));
  }, []);

  const value = (n: number | undefined) => (stats ? formatNumber(n) : "—");

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Επισκόπηση λειτουργίας Arta Gold"
      />

      {/* ── KPI row ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard
          label="Παραγωγοί"
          value={value(stats?.activeProducers)}
          icon={FiUsers}
        />
        <StatCard label="Χωράφια" value={value(stats?.totalFields)} icon={FiMap} />
        <StatCard
          label="Στρέμματα"
          value={value(stats?.totalStremmata)}
          icon={FiMaximize}
        />
        <StatCard
          label="Παραγωγή (kg)"
          value={value(stats?.totalProduction)}
          icon={FiBarChart2}
        />
        <StatCard
          label="Ανοιχτά Προβλήματα"
          value={value(stats?.openIssues)}
          icon={FiAlertTriangle}
        />
      </div>

      {stats && (
        <>
          {/* ── Production ─────────────────────────────────────────────── */}
          <Section title="Παραγωγή">
            <div className="grid grid-cols-1 gap-5">
              <ProductionByYearChart data={stats.productionByYear} />
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <EstimateVsActualChart data={stats.estimateVsActual} />
                <YieldPerStremmaChart data={stats.yieldPerStremmaByYear} />
              </div>
            </div>
          </Section>

          {/* ── Cultivation & producers ────────────────────────────────── */}
          <Section title="Καλλιέργεια & Παραγωγοί">
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
              <VarietyCompositionChart data={stats.varietyComposition} />
              <ProducersByStatusChart data={stats.producersByStatus} />
              <RegionStremmataChart data={stats.stremmataByRegion} />
            </div>
          </Section>

          {/* ── Operations ─────────────────────────────────────────────── */}
          <Section title="Λειτουργία">
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <OpenIssuesChart data={stats.openIssuesBySeverity} />
              <PhotosByCategoryChart data={stats.photosByCategory} />
            </div>
          </Section>
        </>
      )}
    </>
  );
}
