"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";

import { AuthService } from "@/lib/api/auth";
import { isErr } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// Emails a one-hour, single-use reset link (POST /requestPasswordReset). The server
// answers identically whether or not the address has an account.
export default function ForgotPasswordPage() {
  const params = useParams<{ email: string }>();
  const email = decodeURIComponent(params.email ?? "");
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSend() {
    setLoading(true);
    const res = await AuthService.requestPasswordReset(email);
    setLoading(false);
    if (isErr(res)) {
      toast.error("Connection Error");
      return;
    }
    const data = res.data as { success?: boolean; msg?: string };
    if (data.success) setSent(true);
    else toast.error(data.msg ?? "Could not send the reset link");
  }

  if (sent) {
    return (
      <Card className="w-full max-w-md border-border/60 shadow-lg">
        <CardContent className="flex flex-col items-center p-6 text-center sm:p-8">
          <CheckCircle2 className="size-12 text-emerald-500" />
          <h2 className="mt-4 text-xl font-semibold">Check your email</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            If <strong className="break-all">{email}</strong> has an account, a reset link is on
            its way. It expires in 1 hour. Also check your spam folder.
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
      <CardContent className="p-6 sm:p-8">
        <button
          onClick={() => router.replace("/signin")}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back
        </button>

        <h2 className="text-2xl font-semibold tracking-tight">Reset your password</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          We&apos;ll email a reset link to <strong className="break-all">{email}</strong>.
        </p>

        <Button className="mt-6 w-full" size="lg" disabled={loading} onClick={handleSend}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
          Send reset link
        </Button>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          No email? Ask your admin to send you a new sign-in link.
        </p>
      </CardContent>
    </Card>
  );
}
