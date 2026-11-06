import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth/config";

// Protects every page via authConfig.callbacks.authorized.
// Uses the edge-safe config only; the DB-backed Credentials provider lives in lib/auth.
export default NextAuth(authConfig).auth;

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
