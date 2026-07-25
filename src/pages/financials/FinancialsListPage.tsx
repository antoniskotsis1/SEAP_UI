import { PageHeader } from "@/components/ui/PageHeader";
import { ComingSoon } from "@/components/ui/ComingSoon";

export function FinancialsListPage() {
  return (
    <>
      <PageHeader
        title="Οικονομικά"
        description="Πληρωμές, οφειλές και συμψηφισμοί ανά παραγωγό"
      />
      <ComingSoon />
    </>
  );
}
