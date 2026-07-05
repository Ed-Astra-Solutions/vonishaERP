"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";

import { AuthService } from "@/lib/api/auth";
import { isErr } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

// Ports reset_password_desk.dart: validateToken on mount, then resetPassword(p, token).
export default function ResetPasswordPage() {
  const params = useParams<{ token: string }>();
  const token = decodeURIComponent(params.token ?? "");
  const router = useRouter();

  const [name, setName] = useState<string | null>(null);
  const [validating, setValidating] = useState(true);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    let active = true;
    AuthService.validateToken(token).then((res) => {
      if (!active) return;
      if (isErr(res)) {
        setValidating(false);
        return;
      }
      const data = res.data as { success?: boolean; msg?: string };
      if (data.success) setName(data.msg ?? "");
      setValidating(false);
    });
    return () => {
      active = false;
    };
  }, [token]);

  const tooShort = touched && password.length < 8;
  const mismatch = touched && confirm.length > 0 && password !== confirm;

  async function handleReset() {
    setTouched(true);
    if (password.length < 8 || password !== confirm) return;

    setLoading(true);
    const res = await AuthService.resetPassword(password, token);
    if (isErr(res)) {
      setLoading(false);
      toast.error("Connection Error");
      return;
    }
    const data = res.data as { success?: boolean; msg?: string };
    if (data.success) {
      setDone(true);
    } else {
      setLoading(false);
      toast.error(data.msg ?? "Failed to reset password");
    }
  }

  if (validating) {
    return (
      <Card className="w-full max-w-md border-border/60 shadow-lg">
        <CardContent className="flex items-center justify-center gap-2 p-12 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" /> Validating link…
        </CardContent>
      </Card>
    );
  }

  if (done) {
    return (
      <Card className="w-full max-w-md border-border/60 shadow-lg">
        <CardContent className="flex flex-col items-center p-8 text-center">
          <CheckCircle2 className="size-12 text-emerald-500" />
          <h2 className="mt-4 text-xl font-semibold">Password updated</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            You can now sign in with your new password.
          </p>
          <Button className="mt-6" onClick={() => router.replace("/signin")}>
            Go to sign in
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md border-border/60 shadow-lg">
      <CardContent className="p-8">
        <h2 className="text-2xl font-semibold tracking-tight">Set a new password</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {name ? `Hi ${name}, choose a new password.` : "Choose a new password."}
        </p>

        <form
          className="mt-6 space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            handleReset();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                maxLength={40}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="px-9"
                aria-invalid={tooShort}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {tooShort && (
              <p className="text-sm text-destructive">
                *Password must be at least 8 characters
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm">Confirm password</Label>
            <Input
              id="confirm"
              type={showPassword ? "text" : "password"}
              maxLength={40}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              aria-invalid={mismatch}
            />
            {mismatch && <p className="text-sm text-destructive">*Passwords do not match</p>}
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading && <Loader2 className="size-4 animate-spin" />}
            Reset password
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
