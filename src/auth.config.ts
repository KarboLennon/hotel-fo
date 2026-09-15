import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const loggedIn = !!auth?.user;
      const onLogin = request.nextUrl.pathname.startsWith("/login");
      if (onLogin) return loggedIn ? Response.redirect(new URL("/", request.nextUrl)) : true;
      return loggedIn;
    },
    jwt({ token, user }) {
      if (user) { token.id = user.id; token.role = user.role; token.name = user.name; }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as "ADMIN" | "RECEPTIONIST";
      session.user.name = token.name as string;
      return session;
    },
  },
} satisfies NextAuthConfig;
