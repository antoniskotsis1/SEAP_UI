import { FiGrid, FiPlus } from "react-icons/fi";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";

export function PlantingsListPage() {
  return (
    <>
      <PageHeader
        title="Φυτεύσεις"
        description="Διαχείριση φυτεύσεων ανά χωράφι"
        actions={
          <button className="btn-primary">
            <FiPlus className="h-4 w-4" />
            Νέα Φύτευση
          </button>
        }
      />
      <EmptyState
        icon={FiGrid}
        title="Δεν υπάρχουν φυτεύσεις"
        description="Ξεκινήστε καταχωρώντας μια φύτευση."
      />
    </>
  );
}
