import { Construction } from "lucide-react";
import { PageHeader } from "./page-header";
import { EmptyState } from "./empty-state";

// Temporary placeholder for screens not yet ported. Removed as each phase lands.
export function ComingSoon({ title, description }: { title: string; description?: string }) {
  return (
    <div>
      <PageHeader title={title} description={description} />
      <EmptyState
        icon={Construction}
        title="This module is being rebuilt"
        description="The upgraded version of this screen is on its way in an upcoming phase."
      />
    </div>
  );
}
