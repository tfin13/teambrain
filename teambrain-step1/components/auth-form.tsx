"use client";

import Link from "next/link";
import { Github } from "lucide-react";
import { useActionState } from "react";
import { githubLogin, login, register } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const copy = {
  login: {
    title: "Sign in",
    description: "Welcome back to TeamBrain.",
    submit: "Sign in",
    pending: "Signing in…",
    switchText: "No account yet?",
    switchLink: { href: "/register", label: "Create one" },
  },
  register: {
    title: "Create your account",
    description: "Your documents stay private to your account.",
    submit: "Create account",
    pending: "Creating account…",
    switchText: "Already have an account?",
    switchLink: { href: "/login", label: "Sign in" },
  },
};

export function AuthForm({
  mode,
  callbackUrl,
  githubEnabled = false,
}: {
  mode: "login" | "register";
  callbackUrl?: string;
  githubEnabled?: boolean;
}) {
  const [state, formAction, pending] = useActionState(mode === "login" ? login : register, undefined);
  const t = copy[mode];

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-xl">{t.title}</CardTitle>
        <CardDescription>{t.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          {githubEnabled && (
            <>
              <form action={githubLogin}>
                {callbackUrl && <input type="hidden" name="callbackUrl" value={callbackUrl} />}
                <Button type="submit" variant="outline" className="w-full">
                  <Github className="mr-2 size-4" />
                  Continue with GitHub
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  <span className="bg-background px-2">or</span>
                </div>
              </div>
            </>
          )}

          <form action={formAction} className="flex flex-col gap-4">
            {callbackUrl && <input type="hidden" name="callbackUrl" value={callbackUrl} />}

            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                defaultValue={state?.email}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                minLength={mode === "register" ? 8 : undefined}
                required
              />
              {mode === "register" && <p className="text-xs text-muted-foreground">At least 8 characters.</p>}
            </div>

            {state?.error && (
              <p role="alert" className="text-sm text-destructive">
                {state.error}
              </p>
            )}

            <Button type="submit" disabled={pending}>
              {pending ? t.pending : t.submit}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t.switchText}{" "}
          <Link href={t.switchLink.href} className="font-medium text-foreground underline-offset-4 hover:underline">
            {t.switchLink.label}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
