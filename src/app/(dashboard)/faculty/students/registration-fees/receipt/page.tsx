"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Pencil, Printer, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { AuthService } from "@/lib/api/auth";
import { isErr } from "@/lib/api/client";
import { getToken } from "@/lib/auth";
import { asPayments, amountOf } from "@/types/registration-fees";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  RegistrationReceipt,
  type ReceiptDonor,
} from "@/components/students/registration-receipt";

// Print preview for one registration-fee challan. Reached from the fee report and
// from the student's detail page as
// /faculty/students/registration-fees/receipt?class=…&index=…&p=<challan index>.
//
// The preview on screen is the same markup that prints; the @media print rules in
// globals.css hide the surrounding dashboard shell so only the receipt lands on
// paper. Nothing is written back — printing is a read of what was already recorded.

interface StudentRow {
  data?: string;
  [k: string]: unknown;
}
type StudentData = Record<string, unknown>;

function clean(v: unknown): string {
  const s = v == null ? "" : String(v).trim();
  return s && s !== "Select" && s !== "Select Date" ? s : "";
}

function ReceiptView() {
  const router = useRouter();
  const params = useSearchParams();
  const cls = params.get("class") ?? "";
  const index = params.get("index") ?? "";
  const paymentIndex = Number(params.get("p") ?? "0");

  const [student, setStudent] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await AuthService.getStudentDetails(getToken() ?? "", cls);
    if (isErr(res)) {
      toast.error("Connection Error");
      setLoading(false);
      return;
    }
    const body = res.data as { success?: boolean; data?: StudentRow[] };
    const row = (body.data ?? [])[Number(index)];
    let s: StudentData | null = null;
    try {
      s = row && typeof row.data === "string" ? (JSON.parse(row.data) as StudentData) : ((row ?? null) as StudentData | null);
    } catch {
      s = (row ?? null) as StudentData | null;
    }
    setStudent(s);
    setLoading(false);
  }, [cls, index]);

  useEffect(() => {
    load();
  }, [load]);

  const payments = student ? asPayments(student.regPayments) : [];
  const payment = payments[paymentIndex];
  const editHref = `/faculty/students/manage?class=${encodeURIComponent(cls)}&index=${index}`;

  const donor: ReceiptDonor | null = student
    ? {
        // The receipt is issued to whoever paid — the father where we have him,
        // otherwise the mother, matching how the book is written.
        name: clean(student.father) || clean(student.mother),
        address: clean(student.add),
        email: clean(student.email),
        phone: clean(student.fnumber) || clean(student.mothernum),
        pan: clean(student.fatherAdhaar) || clean(student.motherAdhaar),
        studentName: `${clean(student.f)} ${clean(student.l)}`.trim(),
        studentClass: cls,
      }
    : null;

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
      </div>
    );
  }

  if (!student || !payment || !donor) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <TriangleAlert className="size-8 text-muted-foreground" />
          <p className="font-medium">Receipt not found</p>
          <p className="max-w-md text-sm text-muted-foreground">
            {student
              ? "This student has no challan recorded at that position. It may have been removed."
              : "This student record could not be loaded."}
          </p>
          <Button variant="outline" onClick={() => router.back()}>Go back</Button>
        </CardContent>
      </Card>
    );
  }

  // The S.No is the receipt's legal identity — an 80G receipt without a unique
  // number is not usable by the donor, so we warn rather than print a blank.
  const missing: string[] = [];
  if (!payment.challanNo) missing.push("receipt / challan number");
  if (!payment.date) missing.push("date of payment");
  if (!amountOf(payment)) missing.push("amount");
  if (!donor.name) missing.push("payer's name");

  return (
    <div>
      {/* Screen-only controls — hidden on paper by the print stylesheet. */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="size-4" /> Back
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" render={<Link href={editHref} />}>
            <Pencil className="size-4" /> Edit details
          </Button>
          <Button onClick={() => window.print()} disabled={missing.length > 0}>
            <Printer className="size-4" /> Print Receipt
          </Button>
        </div>
      </div>

      {missing.length > 0 && (
        <Card className="mb-4 border-destructive/40">
          <CardContent className="flex items-start gap-3 p-4">
            <TriangleAlert className="mt-0.5 size-5 shrink-0 text-destructive" />
            <div className="text-sm">
              <p className="font-medium">This receipt is not ready to print</p>
              <p className="mt-1 text-muted-foreground">
                Missing {missing.join(", ")}. A donation receipt needs a unique serial
                number to be valid for the donor&apos;s 80G claim — fill it in on the
                student&apos;s form first.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {payments.length > 1 && (
        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">Challan:</span>
          {payments.map((p, i) => (
            <Button
              key={i}
              variant={i === paymentIndex ? "default" : "outline"}
              size="sm"
              render={
                <Link
                  href={`/faculty/students/registration-fees/receipt?class=${encodeURIComponent(cls)}&index=${index}&p=${i}`}
                />
              }
            >
              {p.challanNo || `#${i + 1}`}
            </Button>
          ))}
        </div>
      )}

      {/* Preview: the sheet is fixed-width, so let narrow screens scroll it. */}
      <div className="overflow-x-auto rounded-lg border bg-neutral-200 p-4 dark:bg-neutral-800">
        <div className="shadow-lg">
          <RegistrationReceipt payment={payment} donor={donor} />
        </div>
      </div>
    </div>
  );
}

export default function ReceiptPage() {
  // useSearchParams requires a Suspense boundary for prerendering.
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <ReceiptView />
    </Suspense>
  );
}
