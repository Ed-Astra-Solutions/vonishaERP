import { ArrowRight } from "lucide-react";
import { assetActionLabel, type AssetRequest } from "@/types/assets";

/** Human-readable one-line summary of an asset request (e.g. "Add 10 × Fan @ AKSHYA"). */
export function describeRequest(r: AssetRequest): React.ReactNode {
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      <span className="font-medium">{assetActionLabel[r.action] ?? r.action}</span>
      <span className="font-semibold">{r.quantity}</span>×<span>{r.assetName}</span>
      <span className="text-muted-foreground">@ {r.center}</span>
      {r.action === "transfer" && r.toCenter && (
        <>
          <ArrowRight className="size-3 text-muted-foreground" />
          <span className="text-muted-foreground">{r.toCenter}</span>
        </>
      )}
    </span>
  );
}
