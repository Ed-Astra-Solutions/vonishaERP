"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { AuthService } from "@/lib/api/auth";
import { isErr } from "@/lib/api/client";
import { MONTHS } from "@/lib/date";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Ports forgot_password_desktop.dart: verify DOB (ddMMyyyy) + 27-char recovery
// code via forgotPassword(email, dob, code).
export default function ForgotPasswordPage() {
  const params = useParams<{ email: string }>();
  const email = decodeURIComponent(params.email ?? "");
  const router = useRouter();

  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [touched, setTouched] = useState(false);

  const dayNum = parseInt(day, 10);
  const yearNum = parseInt(year, 10);
  const codeValid = code.length === 27;
  const dobValid =
    !!month && dayNum >= 1 && dayNum <= 31 && yearNum > 1900 && yearNum < 2100;

  function pad(n: number) {
    return n.toString().length === 1 ? `0${n}` : `${n}`;
  }

  async function handleVerify() {
    setTouched(true);
    if (!codeValid || !dobValid) return;

    const monthNum = MONTHS.indexOf(month) + 1;
    const dob = `${pad(dayNum)}${pad(monthNum)}${yearNum}`;

    setLoading(true);
    const res = await AuthService.forgotPassword(email, dob, code);
    if (isErr(res)) {
      setLoading(false);
      toast.error("Connection Error");
      return;
    }
    const data = res.data as { success?: boolean };
    if (data.success) {
      setSent(true);
    } else {
      setLoading(false);
      toast.error("Incorrect Date of Birth or Recovery Code");
    }
  }

  if (sent) {
    return (
      <Card className="w-full max-w-md border-border/60 shadow-lg">
        <CardContent className="flex flex-col items-center p-8 text-center">
          <CheckCircle2 className="size-12 text-emerald-500" />
          <h2 className="mt-4 text-xl font-semibold">Check your email</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            We&apos;ve sent a password reset link to <strong>{email}</strong>.
          </p>
          <Button variant="outline" className="mt-6" onClick={() => router.replace("/signin")}>
            <ArrowLeft className="size-4" /> Back to sign in
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md border-border/60 shadow-lg">
      <CardContent className="p-8">
        <button
          onClick={() => router.replace("/signin")}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back
        </button>

        <h2 className="text-2xl font-semibold tracking-tight">Recover your account</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Verify your identity for <strong>{email}</strong>.
        </p>

        <form
          className="mt-6 space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            handleVerify();
          }}
        >
          <div className="space-y-2">
            <Label>Date of birth</Label>
            <div className="grid grid-cols-[1fr_1.4fr_1fr] gap-2">
              <Input
                placeholder="DD"
                inputMode="numeric"
                maxLength={2}
                value={day}
                onChange={(e) => setDay(e.target.value.replace(/\D/g, ""))}
              />
              <Select value={month} onValueChange={(v) => setMonth(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="YYYY"
                inputMode="numeric"
                maxLength={4}
                value={year}
                onChange={(e) => setYear(e.target.value.replace(/\D/g, ""))}
              />
            </div>
            {touched && !dobValid && (
              <p className="text-sm text-destructive">*Enter a valid date of birth</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="code">Recovery code</Label>
            <Input
              id="code"
              placeholder="27-character recovery code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            {touched && !codeValid && (
              <p className="text-sm text-destructive">*Please enter a valid recovery code</p>
            )}
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading && <Loader2 className="size-4 animate-spin" />}
            Verify
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
