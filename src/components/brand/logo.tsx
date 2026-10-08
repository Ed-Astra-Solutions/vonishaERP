import Image from "next/image";
import { cn } from "@/lib/utils";

// Wordmark used in the auth header and sidebar. Uses the Vonisha logo asset
// carried over from the Flutter app.
export function Logo({
  className,
  showBeta = false,
}: {
  className?: string;
  showBeta?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-3.5", className)}>
      <div className="flex size-14 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5">
        <Image
          src="/brand/vonisha.jpeg"
          alt="Vonisha"
          width={56}
          height={56}
          className="size-14 object-cover"
        />
      </div>
      <div className="leading-tight">
        <div className="flex items-center gap-1.5">
          <span className="text-2xl font-semibold tracking-tight">Vonisha ERP</span>
          {showBeta && (
            <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-bold uppercase tracking-wide text-primary">
              Beta
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
