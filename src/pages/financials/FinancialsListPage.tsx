import { FiDollarSign, FiPlus } from "react-icons/fi";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";

export function FinancialsListPage() {
  return (
    <>
      <PageHeader
        title="Οικονομικά"
        description="Πληρωμές, οφειλές και τιμολόγια"
        actions={
          <button className="btn-primary">
            <FiPlus className="h-4 w-4" />
            Νέα Συναλλαγή
          </button>
        }
      />
      <EmptyState
        icon={FiDollarSign}
        title="Δεν υπάρχουν συναλλαγές"
        description="Ξεκινήστε καταχωρώντας μια συναλλαγή."
      />
    </>
  );
}
