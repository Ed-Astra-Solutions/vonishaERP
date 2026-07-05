import type { ReactNode } from "react";
import { FixedAssetsTabs } from "@/components/assets/fixed-assets-tabs";
import "./wp.css";

// Fixed Assets section shell — WordPress-admin styled (see wp.css). A single sidebar
// entry whose sub-pages (Stock, Approvals, Log) are switched via wp-admin nav tabs.
// The wrapper bleeds over the dashboard's padding so the gray wp canvas fills the area.
export default function FixedAssetsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="wpfa -m-4 min-h-[calc(100dvh-4rem)] p-4 md:-m-6 md:p-6 lg:-m-8 lg:p-8">
      <h1 className="wpfa-title mb-1">Fixed Assets</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        Stock, approvals, and audit trail across all centers.
      </p>
      <FixedAssetsTabs />
      {children}
    </div>
  );
}
