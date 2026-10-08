"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Lock, User } from "lucide-react";
import { toast } from "sonner";

import { AuthService } from "@/lib/api/auth";
import { isErr } from "@/lib/api/client";
import { setToken, bootstrapUser, OFFLINE } from "@/lib/auth";
import { homeFor } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

// Simple email check (replaces string_validator's isEmail used in signin_desktop.dart).
function isEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export default function SigninPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailValid, setEmailValid] = useState(true);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [loading, setLoading] = useState(false);

  const passwordTooShort = passwordTouched && password.length < 8;

  // Mirrors signin_desktop.dart onPressed: validate, login, set cookie, redirect.
  async function handleSignin() {
    // Phone keyboards add trailing spaces and capitalise the first letter.
    const cleanEmail = email.trim().toLowerCase();
    const validEmail = isEmail(cleanEmail);
    setEmailValid(validEmail);
    setPasswordTouched(true);
    if (!validEmail || password.length < 8) return;

    setLoading(true);
    const res = await AuthService.login(cleanEmail, password);
    if (isErr(res)) {
      setLoading(false);
      toast.error("Connection Error");
      return;
    }
    const data = res.data as { success?: boolean; token?: string; msg?: string };
    if (data.success && data.token) {
      setToken(String(data.token)); // cookie 't', 7-day default
      // Land on the role's home (faculty → /faculty, assets manager → /assets, …).
      const info = await bootstrapUser();
      router.replace(info && info !== OFFLINE ? homeFor(info) : "/dashboard");
    } else {
      setLoading(false);
      toast.error(`Failed to login\nERR: ${data.msg ?? "Unknown error"}`);
    }
  }

  return (
    <Card className="w-full max-w-md border-border/60 shadow-lg">
      <CardContent className="p-6 sm:p-8">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-semibold tracking-tight">Welcome back</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Log in to your Ed-Astra account
          </p>
        </div>

        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            handleSignin();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                placeholder="you@vonishafoundation.org"
                maxLength={254}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9"
                aria-invalid={!emailValid}
              />
            </div>
            {!emailValid && (
              <p className="text-sm text-destructive">*Enter a valid email address</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                maxLength={128}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setPasswordTouched(true)}
                className="px-9"
                aria-invalid={passwordTooShort}
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
            {passwordTooShort && (
              <p className="text-sm text-destructive">
                *Password must be at least 8 characters
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading && <Loader2 className="size-4 animate-spin" />}
            Sign in
          </Button>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => {
              const cleanEmail = email.trim().toLowerCase();
              const validEmail = isEmail(cleanEmail);
              setEmailValid(validEmail);
              if (validEmail) router.push(`/forgot-password/${encodeURIComponent(cleanEmail)}`);
            }}
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Forgot password?
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
