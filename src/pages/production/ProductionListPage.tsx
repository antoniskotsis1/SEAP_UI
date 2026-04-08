import { FiBarChart2, FiPlus } from "react-icons/fi";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";

export function ProductionListPage() {
  return (
    <>
      <PageHeader
        title="Παραγωγή"
        description="Καταγραφή παραγωγής ανά φύτευση και έτος"
        actions={
          <button className="btn-primary">
            <FiPlus className="h-4 w-4" />
            Νέα Καταγραφή
          </button>
        }
      />
      <EmptyState
        icon={FiBarChart2}
        title="Δεν υπάρχουν καταγραφές"
        description="Ξεκινήστε καταγράφοντας παραγωγή."
      />
    </>
  );
}
