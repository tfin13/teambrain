import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = { title: "Sign in · TeamBrain" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string | string[] }>;
}) {
  const { callbackUrl } = await searchParams;
  const githubEnabled = Boolean(process.env.GITHUB_ID && process.env.GITHUB_SECRET);

  return (
    <AuthForm
      mode="login"
      callbackUrl={typeof callbackUrl === "string" ? callbackUrl : undefined}
      githubEnabled={githubEnabled}
    />
  );
}
