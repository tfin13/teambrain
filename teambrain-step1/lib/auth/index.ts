import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { authConfig } from "./config";
import { normalizeEmail, verifyPassword } from "./credentials";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = typeof credentials?.email === "string" ? normalizeEmail(credentials.email) : "";
        const password = typeof credentials?.password === "string" ? credentials.password : "";
        if (!email || !password) return null;

        const [user] = await db
          .select({ id: users.id, email: users.email, passwordHash: users.passwordHash })
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (!user || !(await verifyPassword(password, user.passwordHash))) return null;
        return { id: user.id, email: user.email };
      },
    }),
  ],
});

/**
 * The signed-in user, or a redirect to /login.
 * Use this id (never one from request input) to scope every documents/chunks query.
 */
export async function requireUser() {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) redirect("/login");
  return { id, email: session.user?.email ?? "" };
}
