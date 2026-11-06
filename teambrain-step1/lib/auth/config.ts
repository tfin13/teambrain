import type { NextAuthConfig } from "next-auth";

// Edge-safe part of the Auth.js config: no database, no bcrypt.
// Middleware imports only this file; lib/auth/index.ts adds the Credentials provider.

const AUTH_PAGES = ["/login", "/register"];

export const authConfig = {
  pages: { signIn: "/login" },
  // Credentials provider requires JWT sessions (no database sessions).
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    // Runs in middleware on every matched request.
    authorized({ auth, request: { nextUrl } }) {
      const signedIn = !!auth?.user;

      if (AUTH_PAGES.includes(nextUrl.pathname)) {
        // Signed-in users have no reason to see login/register.
        return signedIn ? Response.redirect(new URL("/documents", nextUrl)) : true;
      }

      // Everything else requires a session; false redirects to pages.signIn.
      return signedIn;
    },
    session({ session, token }) {
      // Expose the user id so server code can scope queries by it.
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
} satisfies NextAuthConfig;
