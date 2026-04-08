import { FiMap, FiPlus } from "react-icons/fi";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";

export function FieldsListPage() {
  return (
    <>
      <PageHeader
        title="Χωράφια"
        description="Διαχείριση χωραφιών και τοποθεσιών"
        actions={
          <button className="btn-primary">
            <FiPlus className="h-4 w-4" />
            Νέο Χωράφι
          </button>
        }
      />
      <EmptyState
        icon={FiMap}
        title="Δεν υπάρχουν χωράφια"
        description="Ξεκινήστε προσθέτοντας το πρώτο χωράφι."
      />
    </>
  );
}
