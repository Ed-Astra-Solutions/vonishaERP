import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-1 flex-col items-center justify-center gap-4 bg-muted/30 px-6 text-center">
      <p className="text-7xl font-bold tracking-tight text-primary">404</p>
      <h1 className="text-xl font-semibold">Page not found</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or has moved.
      </p>
      <Button className="mt-2" render={<Link href="/dashboard" />}>
        Back to dashboard
      </Button>
    </div>
  );
}
