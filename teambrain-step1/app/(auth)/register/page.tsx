import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = { title: "Create account · TeamBrain" };

export default function RegisterPage() {
  const githubEnabled = Boolean(process.env.GITHUB_ID && process.env.GITHUB_SECRET);
  return <AuthForm mode="register" githubEnabled={githubEnabled} />;
}
