"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, Lock, Save, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { AuthService } from "@/lib/api/auth";
import { isErr } from "@/lib/api/client";
import { getToken } from "@/lib/auth";
import { HOUSE_TYPES, SEX_OPTIONS } from "@/lib/constants";
import { useClasses } from "@/lib/class-access";
import type { MediaItem } from "@/types/media";
import { type RegistrationPayment, amountOf, asPayments } from "@/types/registration-fees";
import { PageHeader } from "@/components/common/page-header";
import { MediaUpload } from "@/components/common/media-upload";
import { RegistrationFeeFields } from "@/components/students/registration-fee-fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Full-screen add/edit student form — a sub-screen (not a dialog), mirroring the
// Flutter staff_management flow. Persists the same `data` JSON keys the Flutter app
// writes (f, l, email, father, fnumber, sex, dob, adhaar, caste, mother, mothernum,
// add, salary, notes, house, pics) plus the new media/parent-Aadhaar keys.
//
// Compulsory: first/last name, father, mother, caste, student Aadhaar number,
// Aadhaar document (photo or file) and profile picture (camera or gallery).
// Everything else is active but optional — including each parent's Aadhaar
// number and document, and the nominal registration fee (regStatus, regExpected,
// regPayments) that feeds /faculty/students/registration-fees.

interface StudentRow {
  data?: string;
  [k: string]: unknown;
}
type StudentData = Record<string, unknown>;

// ddMMyyyy (Flutter convention) <-> yyyy-MM-dd (input[type=date]).
function dobToInput(s: unknown): string {
  const v = String(s ?? "");
  if (!/^\d{8}$/.test(v)) return "";
  return `${v.slice(4)}-${v.slice(2, 4)}-${v.slice(0, 2)}`;
}
function inputToDob(s: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return "Select Date";
  const [y, m, d] = s.split("-");
  return `${d}${m}${y}`;
}

function asMedia(v: unknown): MediaItem[] {
  return Array.isArray(v) ? (v.filter((m) => m && typeof m === "object" && "key" in m) as MediaItem[]) : [];
}

function ManageStudentForm() {
  const router = useRouter();
  const params = useSearchParams();
  const editIndex = params.get("index"); // present => edit mode
  const isEdit = editIndex !== null;

  // Only the class incharge (or an admin) may add to / modify a class; `canEdit`
  // comes from the server with the class list, and the server re-checks on save.
  const {
    editable: allowedClasses,
    loading: classesLoading,
    canEdit: canEditCls,
    inchargeFor,
  } = useClasses();
  const [cls, setCls] = useState(params.get("class") ?? "");
  const canEdit = canEditCls(cls);
  const incharge = inchargeFor(cls);

  // Add mode reached without a class (or with one this user cannot use): fall back to
  // the first class they are incharge of.
  useEffect(() => {
    if (isEdit || classesLoading || !allowedClasses.length) return;
    if (!allowedClasses.includes(cls)) setCls(allowedClasses[0]);
  }, [isEdit, classesLoading, allowedClasses, cls]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  // Carries through edit-mode fields this form doesn't own (e.g. notes, pics).
  const [original, setOriginal] = useState<StudentData>({});

  const [f, setF] = useState("");
  const [l, setL] = useState("");
  const [father, setFather] = useState("");
  const [mother, setMother] = useState("");
  const [caste, setCaste] = useState("");
  const [adhaar, setAdhaar] = useState("");
  const [adhaarDoc, setAdhaarDoc] = useState<MediaItem[]>([]);
  const [profilePic, setProfilePic] = useState<MediaItem[]>([]);

  const [email, setEmail] = useState("");
  const [dob, setDob] = useState("");
  const [sex, setSex] = useState("");
  const [house, setHouse] = useState("");
  const [fnumber, setFnumber] = useState("");
  const [mothernum, setMothernum] = useState("");
  const [address, setAddress] = useState("");
  const [salary, setSalary] = useState("");
  const [fatherAdhaar, setFatherAdhaar] = useState("");
  const [fatherAdhaarDoc, setFatherAdhaarDoc] = useState<MediaItem[]>([]);
  const [motherAdhaar, setMotherAdhaar] = useState("");
  const [motherAdhaarDoc, setMotherAdhaarDoc] = useState<MediaItem[]>([]);

  // Nominal registration fee (the challan book / Google Sheet this screen replaces).
  const [regStatus, setRegStatus] = useState("");
  const [regExpected, setRegExpected] = useState("");
  const [regPayments, setRegPayments] = useState<RegistrationPayment[]>([]);

  // Edit mode: re-fetch the class list and hydrate from the row at `index` —
  // students have no id of their own; class + array index is the server's identity.
  const hydrate = useCallback(async () => {
    if (!isEdit) return;
    setLoading(true);
    const res = await AuthService.getStudentDetails(getToken() ?? "", cls);
    if (isErr(res)) {
      toast.error("Connection Error");
      setLoading(false);
      return;
    }
    const body = res.data as { success?: boolean; data?: StudentRow[] };
    const row = (body.data ?? [])[Number(editIndex)];
    let s: StudentData = {};
    try {
      s = row && typeof row.data === "string" ? (JSON.parse(row.data) as StudentData) : ((row ?? {}) as StudentData);
    } catch {
      s = (row ?? {}) as StudentData;
    }
    setOriginal(s);
    setF(String(s.f ?? ""));
    setL(String(s.l ?? ""));
    setFather(String(s.father ?? ""));
    setMother(String(s.mother ?? ""));
    setCaste(String(s.caste ?? ""));
    setAdhaar(String(s.adhaar ?? ""));
    setAdhaarDoc(asMedia(s.adhaarDoc));
    setProfilePic(asMedia(s.profilePic));
    setEmail(String(s.email ?? ""));
    setDob(dobToInput(s.dob));
    setSex(String(s.sex ?? "") === "Select" ? "" : String(s.sex ?? ""));
    setHouse(String(s.house ?? "") === "Select" ? "" : String(s.house ?? ""));
    setFnumber(String(s.fnumber ?? ""));
    setMothernum(String(s.mothernum ?? ""));
    setAddress(String(s.add ?? ""));
    setSalary(String(s.salary ?? ""));
    setFatherAdhaar(String(s.fatherAdhaar ?? ""));
    setFatherAdhaarDoc(asMedia(s.fatherAdhaarDoc));
    setMotherAdhaar(String(s.motherAdhaar ?? ""));
    setMotherAdhaarDoc(asMedia(s.motherAdhaarDoc));
    setRegStatus(String(s.regStatus ?? ""));
    setRegExpected(String(s.regExpected ?? ""));
    setRegPayments(asPayments(s.regPayments));
    setLoading(false);
  }, [cls, editIndex, isEdit]);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  async function save() {
    if (!canEdit) {
      toast.error(
        incharge
          ? `Only ${incharge.name} (person in charge) or an admin can edit ${cls}.`
          : `You do not have edit access to ${cls}.`,
      );
      return;
    }
    const missing: string[] = [];
    if (!f.trim()) missing.push("First name");
    if (!l.trim()) missing.push("Last name");
    if (!father.trim()) missing.push("Father's name");
    if (!mother.trim()) missing.push("Mother's name");
    if (!caste.trim()) missing.push("Caste");
    if (!adhaar.trim()) missing.push("Aadhaar number");
    if (adhaarDoc.length === 0) missing.push("Aadhaar upload");
    if (profilePic.length === 0) missing.push("Profile picture");
    if (missing.length) {
      toast.error(`Required: ${missing.join(", ")}`);
      return;
    }
    if (!/^\d{12}$/.test(adhaar.trim())) {
      toast.error("Aadhaar number must be 12 digits");
      return;
    }
    for (const [label, v] of [
      ["Father's Aadhaar", fatherAdhaar],
      ["Mother's Aadhaar", motherAdhaar],
    ] as const) {
      if (v.trim() && !/^\d{12}$/.test(v.trim())) {
        toast.error(`${label} number must be 12 digits`);
        return;
      }
    }

    // A challan row is only meaningful once it has a date, a mode and an amount —
    // the three columns the 10 BD report cannot be produced without. Rows the user
    // added but left entirely blank are dropped rather than rejected.
    const filledPayments = regPayments.filter(
      (p) => p.date || p.mode || p.amount || p.challanNo || p.remarks || (p.media ?? []).length,
    );
    for (const [i, p] of filledPayments.entries()) {
      const gaps: string[] = [];
      if (!p.date) gaps.push("date of payment");
      if (!p.mode) gaps.push("mode of payment");
      if (!amountOf(p)) gaps.push("amount paid");
      if (gaps.length) {
        toast.error(`Challan ${i + 1} needs a ${gaps.join(", ")}`);
        return;
      }
    }

    const data: StudentData = {
      ...original,
      f: f.trim(),
      l: l.trim(),
      email: email.trim(),
      father: father.trim(),
      fnumber: fnumber.trim(),
      sex: sex || "Select",
      dob: inputToDob(dob),
      pics: (original.pics as unknown[]) ?? [""],
      adhaar: adhaar.trim(),
      caste: caste.trim(),
      mother: mother.trim(),
      mothernum: mothernum.trim(),
      add: address.trim(),
      salary: salary.trim(),
      notes: (original.notes as string) ?? "",
      house: house || "Select",
      profilePic,
      adhaarDoc,
      fatherAdhaar: fatherAdhaar.trim(),
      fatherAdhaarDoc,
      motherAdhaar: motherAdhaar.trim(),
      motherAdhaarDoc,
      regStatus,
      regExpected: regExpected.trim(),
      regPayments: filledPayments,
    };

    setSaving(true);
    const res = isEdit
      ? await AuthService.updateVonishaStudent(getToken() ?? "", data, cls, editIndex!)
      : await AuthService.addVonishaStudent(cls, data, getToken() ?? "");
    setSaving(false);
    if (isErr(res)) {
      toast.error("Connection Error");
      return;
    }
    const body = res.data as { success?: boolean; msg?: string };
    if (!body.success) {
      toast.error(body.msg ?? "Failed to save");
      return;
    }
    toast.success(isEdit ? "Updated Student" : "Added Student");
    router.push(`/faculty/students?class=${encodeURIComponent(cls)}`);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-2">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="size-4" /> Back to Students
        </Button>
      </div>
      <PageHeader
        title={isEdit ? "Modify Student Details" : "Add Student"}
        description={
          isEdit
            ? `Editing a student in ${cls}.`
            : "Fields marked * are compulsory. Everything else can be filled in later."
        }
      />

      {loading || classesLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
        </div>
      ) : !canEdit ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <Lock className="size-8 text-muted-foreground" />
            <p className="font-medium">You don&apos;t have edit access to {cls}</p>
            <p className="max-w-md text-sm text-muted-foreground">
              {incharge
                ? `${incharge.name} is the person in charge of this class${incharge.email ? ` (${incharge.email})` : ""}. Ask them or an admin to make the change.`
                : "Ask an admin to make the change."}
            </p>
            <Button variant="outline" onClick={() => router.push(`/faculty/students?class=${encodeURIComponent(cls)}`)}>
              Back to Students
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Student</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isEdit && (
                <div className="space-y-1.5">
                  <Label>Class *</Label>
                  {/* Only classes this user is incharge of (all, for admins). */}
                  <Select value={cls} onValueChange={(v) => setCls(v ?? cls)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {allowedClasses.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {incharge && (
                    <p className="text-xs text-muted-foreground">
                      Person in charge: {incharge.name}
                    </p>
                  )}
                </div>
              )}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="f">First Name *</Label>
                  <Input id="f" value={f} onChange={(e) => setF(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="l">Last Name *</Label>
                  <Input id="l" value={l} onChange={(e) => setL(e.target.value)} />
                </div>
              </div>
              <MediaUpload
                purpose="profile"
                module="student"
                value={profilePic}
                onChange={setProfilePic}
                label="Profile Picture"
                description="Take a photo with the camera or pick one from the gallery."
                required
                maxItems={1}
                capture="user"
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input id="dob" type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Sex</Label>
                  <Select value={sex || undefined} onValueChange={(v) => setSex(v ?? "")}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {SEX_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="caste">Caste *</Label>
                  <Input id="caste" value={caste} onChange={(e) => setCaste(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>House</Label>
                  <Select value={house || undefined} onValueChange={(v) => setHouse(v ?? "")}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {HOUSE_TYPES.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Aadhaar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="adhaar">Adhaar Number *</Label>
                <Input
                  id="adhaar"
                  inputMode="numeric"
                  maxLength={12}
                  placeholder="12-digit number"
                  value={adhaar}
                  onChange={(e) => setAdhaar(e.target.value.replace(/\D/g, ""))}
                />
              </div>
              <MediaUpload
                purpose="aadhaar"
                module="student"
                value={adhaarDoc}
                onChange={setAdhaarDoc}
                label="Aadhaar Card"
                description="Photograph the card or upload a scan / PDF."
                required
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Father</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="father">Name of Father *</Label>
                  <Input id="father" value={father} onChange={(e) => setFather(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fnumber">Phone Number</Label>
                  <Input id="fnumber" inputMode="tel" value={fnumber} onChange={(e) => setFnumber(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fatherAdhaar">Father&apos;s Aadhaar Number</Label>
                <Input
                  id="fatherAdhaar"
                  inputMode="numeric"
                  maxLength={12}
                  placeholder="12-digit number (optional)"
                  value={fatherAdhaar}
                  onChange={(e) => setFatherAdhaar(e.target.value.replace(/\D/g, ""))}
                />
              </div>
              <MediaUpload
                purpose="aadhaar"
                module="student"
                value={fatherAdhaarDoc}
                onChange={setFatherAdhaarDoc}
                label="Father's Aadhaar Card"
                description="Photo or scan / PDF."
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Mother</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="mother">Mother&apos;s Name *</Label>
                  <Input id="mother" value={mother} onChange={(e) => setMother(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="mothernum">Mother&apos;s Number</Label>
                  <Input id="mothernum" inputMode="tel" value={mothernum} onChange={(e) => setMothernum(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="motherAdhaar">Mother&apos;s Aadhaar Number</Label>
                <Input
                  id="motherAdhaar"
                  inputMode="numeric"
                  maxLength={12}
                  placeholder="12-digit number (optional)"
                  value={motherAdhaar}
                  onChange={(e) => setMotherAdhaar(e.target.value.replace(/\D/g, ""))}
                />
              </div>
              <MediaUpload
                purpose="aadhaar"
                module="student"
                value={motherAdhaarDoc}
                onChange={setMotherAdhaarDoc}
                label="Mother's Aadhaar Card"
                description="Photo or scan / PDF."
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Contact & Other Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="email">E-mail (Parent)</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="salary">Base Salary</Label>
                  <Input id="salary" inputMode="numeric" value={salary} onChange={(e) => setSalary(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="add">Address</Label>
                <Textarea id="add" rows={3} value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <RegistrationFeeFields
            status={regStatus}
            onStatusChange={setRegStatus}
            expected={regExpected}
            onExpectedChange={setRegExpected}
            payments={regPayments}
            onPaymentsChange={setRegPayments}
            receiptHref={
              isEdit
                ? (i) =>
                    `/faculty/students/registration-fees/receipt?class=${encodeURIComponent(cls)}&index=${editIndex}&p=${i}`
                : undefined
            }
          />

          <Button className="w-full" size="lg" disabled={saving} onClick={save}>
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : isEdit ? (
              <Save className="size-4" />
            ) : (
              <UserPlus className="size-4" />
            )}
            {isEdit ? "Modify Student Details" : "Add New Student"}
          </Button>
        </div>
      )}
    </div>
  );
}

export default function ManageStudentPage() {
  // useSearchParams requires a Suspense boundary for prerendering.
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <ManageStudentForm />
    </Suspense>
  );
}
