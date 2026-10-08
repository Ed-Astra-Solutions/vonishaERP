"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Pencil, Printer, User } from "lucide-react";
import { toast } from "sonner";

import { AuthService } from "@/lib/api/auth";
import { isErr } from "@/lib/api/client";
import { getToken } from "@/lib/auth";
import { formatDDMMYYYY, inr } from "@/lib/format";
import type { MediaItem } from "@/types/media";
import { amountOf, asPayments, formatPaymentDate, totalPaid } from "@/types/registration-fees";
import { MediaGallery } from "@/components/common/media-gallery";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

// Student details sub-screen — a 1:1 port of the Flutter StudentDetails page
// (student_details.dart): breadcrumb, avatar + name + class card, then a
// "Personal Details" card in the same field order, extended with the new
// data-upload fields (house, parents' Aadhaar, documents).

interface StudentRow {
  data?: string;
  [k: string]: unknown;
}
type StudentData = Record<string, unknown>;

function asMedia(v: unknown): MediaItem[] {
  return Array.isArray(v) ? (v.filter((m) => m && typeof m === "object" && "key" in m) as MediaItem[]) : [];
}

function display(v: unknown): string {
  const s = v == null ? "" : String(v);
  return s && s !== "Select" && s !== "Select Date" ? s : "No Data!";
}

function StudentDetailView() {
  const router = useRouter();
  const params = useSearchParams();
  const cls = params.get("class") ?? "";
  const index = params.get("index") ?? "";

  const [student, setStudent] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

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

    // Resolve the profile picture into a presigned URL for the avatar.
    const pic = s ? asMedia(s.profilePic)[0] : undefined;
    if (pic) {
      const urlRes = await AuthService.getMediaUrls(getToken() ?? "", [pic.key]);
      if (!isErr(urlRes)) {
        const urlBody = urlRes.data as { success?: boolean; urls?: Record<string, string> };
        if (urlBody.success && urlBody.urls?.[pic.key]) setAvatarUrl(urlBody.urls[pic.key]);
      }
    }
  }, [cls, index]);

  useEffect(() => {
    load();
  }, [load]);

  const name = student ? `${student.f ?? ""} ${student.l ?? ""}`.trim() || "—" : "";
  const editHref = `/faculty/students/manage?class=${encodeURIComponent(cls)}&index=${index}`;

  // Personal Details rows — same order as student_details.dart, then the
  // extended fields added in the Next.js data-upload flow.
  const rows: [string, string][] = student
    ? [
        ["Date of Birth", /^\d{8}$/.test(String(student.dob ?? "")) ? formatDDMMYYYY(String(student.dob)) : "No Data!"],
        ["Phone No.", display(student.fnumber)],
        ["Sex", display(student.sex)],
        ["Father", display(student.father)],
        ["Adhaar Number", display(student.adhaar)],
        ["Caste", display(student.caste)],
        ["Mother", display(student.mother)],
        ["Email", display(student.email)],
        ["Home Address", display(student.add)],
        ["House", display(student.house)],
        ["Mother's Number", display(student.mothernum)],
        ["Father's Adhaar", display(student.fatherAdhaar)],
        ["Mother's Adhaar", display(student.motherAdhaar)],
      ]
    : [];

  // Nominal registration fee — one entry per written challan (see
  // /faculty/students/registration-fees for the consolidated 10 BD report).
  const payments = student ? asPayments(student.regPayments) : [];
  const regStatus = student ? display(student.regStatus) : "No Data!";
  const regExpected = student ? Number(String(student.regExpected ?? "").replace(/[^0-9.]/g, "")) : 0;

  const documents = student
    ? [
        ...asMedia(student.adhaarDoc),
        ...asMedia(student.fatherAdhaarDoc),
        ...asMedia(student.motherAdhaarDoc),
      ]
    : [];

  return (
    <div className="mx-auto max-w-2xl">
      {/* Breadcrumb — mirrors "Student Management > Manage Users > Student Details" */}
      <div className="mb-1 flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        <span>Student Management</span>
        <span>&gt;</span>
        <Link href={`/faculty/students?class=${encodeURIComponent(cls)}`} className="hover:text-foreground">
          Manage Users
        </Link>
        <span>&gt;</span>
        <span className="text-primary">Student Details</span>
      </div>
      <div className="mb-4 flex items-center gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Manage Students</h1>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Edit Student Details"
          render={<Link href={editHref} />}
        >
          <Pencil className="size-4" />
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : !student ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Student not found.{" "}
            <button type="button" className="text-primary underline" onClick={() => router.back()}>
              Go back
            </button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Name & Class card */}
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
                  ) : (
                    <User className="size-9 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1 text-center">
                  <p className="truncate text-xl font-bold">{name}</p>
                </div>
              </div>
              <Separator className="my-4" />
              <p className="text-center text-sm">Class - {cls}</p>
            </CardContent>
          </Card>

          {/* Personal Details card */}
          <Card>
            <CardContent className="p-5">
              <p className="mb-4 text-lg font-bold">Personal Details</p>
              <div className="space-y-3">
                {rows.map(([k, v]) => (
                  <div key={k}>
                    <p className="text-[15px] font-bold">{k}</p>
                    <p className="text-sm text-muted-foreground">{v}</p>
                  </div>
                ))}
                {documents.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-[15px] font-bold">Documents</p>
                    <MediaGallery media={documents} />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Registration Fee card */}
          <Card>
            <CardContent className="p-5">
              <p className="mb-4 text-lg font-bold">Nominal Registration Fee</p>
              <div className="space-y-3">
                <div>
                  <p className="text-[15px] font-bold">Registration / Defaulter</p>
                  <p className="text-sm text-muted-foreground">{regStatus}</p>
                </div>
                {regExpected > 0 && (
                  <div>
                    <p className="text-[15px] font-bold">Fee Applicable</p>
                    <p className="text-sm text-muted-foreground">{inr(regExpected)}</p>
                  </div>
                )}
                {payments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No payment recorded yet.</p>
                ) : (
                  <>
                    {payments.map((p, i) => (
                      <div key={i} className="rounded-md border p-3">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="text-[15px] font-bold">
                            {formatPaymentDate(p.date) || "No date"}
                          </p>
                          <p className="text-sm font-semibold tabular-nums">{inr(amountOf(p))}</p>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {p.mode || "Mode not recorded"}
                          {p.challanNo ? ` · Receipt ${p.challanNo}` : ""}
                        </p>
                        {p.remarks && <p className="mt-1 text-sm text-muted-foreground">{p.remarks}</p>}
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          render={
                            <Link
                              href={`/faculty/students/registration-fees/receipt?class=${encodeURIComponent(cls)}&index=${index}&p=${i}`}
                            />
                          }
                        >
                          <Printer className="size-4" /> Print Receipt
                        </Button>
                        {(p.media ?? []).length > 0 && (
                          <div className="mt-2">
                            <MediaGallery media={p.media ?? []} />
                          </div>
                        )}
                      </div>
                    ))}
                    <Separator />
                    <div className="flex items-baseline justify-between">
                      <p className="text-[15px] font-bold">Total Paid</p>
                      <p className="text-sm font-semibold tabular-nums">{inr(totalPaid(payments))}</p>
                    </div>
                    {regExpected > 0 && totalPaid(payments) < regExpected && (
                      <div className="flex items-baseline justify-between">
                        <p className="text-[15px] font-bold">Balance Due</p>
                        <p className="text-sm font-semibold tabular-nums text-destructive">
                          {inr(regExpected - totalPaid(payments))}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Button variant="outline" className="w-full" onClick={() => router.back()}>
            <ArrowLeft className="size-4" /> Back
          </Button>
        </div>
      )}
    </div>
  );
}

export default function StudentDetailPage() {
  // useSearchParams requires a Suspense boundary for prerendering.
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <StudentDetailView />
    </Suspense>
  );
}
