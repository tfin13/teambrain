import { randomUUID } from "node:crypto";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { authConfig } from "./config";
import { hashPassword, normalizeEmail, verifyPassword } from "./credentials";

const githubEnabled = Boolean(process.env.GITHUB_ID && process.env.GITHUB_SECRET);

async function ensureGithubUser(email: string) {
  const normalizedEmail = normalizeEmail(email);
  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (existingUser) return existingUser.id;

  const passwordHash = await hashPassword(`github-oauth-${randomUUID()}`);
  const [createdUser] = await db
    .insert(users)
    .values({ email: normalizedEmail, passwordHash })
    .onConflictDoNothing({ target: users.email })
    .returning({ id: users.id });

  return createdUser?.id ?? (await db.select({ id: users.id }).from(users).where(eq(users.email, normalizedEmail)).limit(1))[0]?.id;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (account?.provider !== "github" || !user?.email) return true;
      await ensureGithubUser(user.email);
      return true;
    },
    async jwt({ token, user }) {
      if (!user?.email) return token;

      const [dbUser] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, normalizeEmail(user.email)))
        .limit(1);

      if (dbUser) token.sub = dbUser.id;
      return token;
    },
  },
  providers: [
    ...(githubEnabled
      ? [
          GitHub({
            clientId: process.env.GITHUB_ID!,
            clientSecret: process.env.GITHUB_SECRET!,
            profile(profile) {
              return {
                id: String(profile.id),
                name: profile.name ?? profile.login,
                email: profile.email ?? `${profile.login}@users.noreply.github.com`,
                image: profile.avatar_url,
              };
            },
          }),
        ]
      : []),
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
