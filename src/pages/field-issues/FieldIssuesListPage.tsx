import { FiAlertTriangle, FiPlus } from "react-icons/fi";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";

export function FieldIssuesListPage() {
  return (
    <>
      <PageHeader
        title="Προβλήματα Χωραφιών"
        description="Αναφορά και παρακολούθηση προβλημάτων"
        actions={
          <button className="btn-primary">
            <FiPlus className="h-4 w-4" />
            Νέα Αναφορά
          </button>
        }
      />
      <EmptyState
        icon={FiAlertTriangle}
        title="Δεν υπάρχουν αναφορές"
        description="Ξεκινήστε αναφέροντας ένα πρόβλημα."
      />
    </>
  );
}
