import { PageHeader } from "@/components/ui/PageHeader";
import { ComingSoon } from "@/components/ui/ComingSoon";

export function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Συγκεντρωτικά στοιχεία και γραφήματα"
      />
      <ComingSoon />
    </>
  );
}
