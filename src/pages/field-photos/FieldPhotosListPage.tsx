import { FiCamera, FiPlus } from "react-icons/fi";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";

export function FieldPhotosListPage() {
  return (
    <>
      <PageHeader
        title="Φωτογραφίες Χωραφιών"
        description="Φωτογραφική τεκμηρίωση χωραφιών"
        actions={
          <button className="btn-primary">
            <FiPlus className="h-4 w-4" />
            Ανέβασμα Φωτογραφίας
          </button>
        }
      />
      <EmptyState
        icon={FiCamera}
        title="Δεν υπάρχουν φωτογραφίες"
        description="Ξεκινήστε ανεβάζοντας φωτογραφίες."
      />
    </>
  );
}
