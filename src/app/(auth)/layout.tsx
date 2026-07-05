import type { ReactNode } from "react";
import { Logo } from "@/components/brand/logo";

// Split-screen auth shell: branded panel on the left, form on the right.
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-1">
      {/* Brand panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-primary via-primary to-indigo-700 p-12 text-primary-foreground lg:flex">
        <Logo className="[&_span]:text-white [&_.text-muted-foreground]:text-white/70" />
        <div className="relative z-10 max-w-md">
          <h1 className="text-4xl font-semibold leading-tight tracking-tight">
            Run your institution, end to end.
          </h1>
          <p className="mt-4 text-lg text-white/80">
            Admissions, attendance, payroll, compliance and more — one modern
            console for the Vonisha Service Foundation.
          </p>
        </div>
        <p className="relative z-10 text-sm text-white/60">
          © {new Date().getFullYear()} Ed-Astra · Vonisha Service Foundation
        </p>
        {/* Decorative glows */}
        <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 size-96 rounded-full bg-indigo-400/20 blur-3xl" />
      </div>

      {/* Form area */}
      <div className="flex w-full flex-col items-center justify-center bg-muted/30 px-6 py-10 lg:w-1/2">
        <div className="mb-8 lg:hidden">
          <Logo showBeta />
        </div>
        {children}
      </div>
    </div>
  );
}
