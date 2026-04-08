import {
  FiUsers,
  FiMap,
  FiBarChart2,
  FiDollarSign,
} from "react-icons/fi";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";

export function DashboardPage() {
  // TODO: fetch real stats from API
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Επισκόπηση λειτουργίας Arta Gold"
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Παραγωγοί" value="—" icon={FiUsers} />
        <StatCard label="Χωράφια" value="—" icon={FiMap} />
        <StatCard label="Παραγωγή (kg)" value="—" icon={FiBarChart2} />
        <StatCard label="Εισπράξεις" value="—" icon={FiDollarSign} />
      </div>

      <div className="mt-10 rounded-xl border-2 border-dashed border-gray-200 p-12 text-center text-sm text-gray-400">
        Γραφήματα &amp; πρόσφατη δραστηριότητα — σύντομα
      </div>
    </>
  );
}
