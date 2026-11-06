"use server";

import { AuthError } from "next-auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { signIn, signOut } from "@/lib/auth";
import { hashPassword, normalizeEmail, validateNewCredentials } from "@/lib/auth/credentials";

export type AuthFormState = { error: string; email: string } | undefined;

export async function login(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");
  return signInOrError(email, password, safeRedirect(formData.get("callbackUrl")));
}

export async function register(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");

  const invalid = validateNewCredentials(email, password);
  if (invalid) return { error: invalid, email };

  const created = await db
    .insert(users)
    .values({ email, passwordHash: await hashPassword(password) })
    .onConflictDoNothing({ target: users.email })
    .returning({ id: users.id });

  if (created.length === 0) return { error: "An account with that email already exists.", email };

  return signInOrError(email, password, "/documents");
}

export async function logout() {
  await signOut({ redirectTo: "/login" });
}

// On success signIn throws Next's redirect, which must propagate; only AuthError is a login failure.
async function signInOrError(email: string, password: string, redirectTo: string): Promise<AuthFormState> {
  try {
    await signIn("credentials", { email, password, redirectTo });
  } catch (error) {
    if (error instanceof AuthError) return { error: "Invalid email or password.", email };
    throw error;
  }
  return undefined;
}

// Only follow same-site paths, so ?callbackUrl= can't send users to another site.
function safeRedirect(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value) return "/documents";
  try {
    const url = new URL(value, "http://localhost");
    const path = `${url.pathname}${url.search}`;
    return path.startsWith("/") && !path.startsWith("//") && path !== "/login" ? path : "/documents";
  } catch {
    return "/documents";
  }
}
