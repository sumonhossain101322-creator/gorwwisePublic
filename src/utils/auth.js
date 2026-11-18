import { PrismaAdapter } from "@auth/prisma-adapter";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { getServerSession } from "next-auth";
import prisma from "./connect";
import { authenticateWithPassword } from "./password";
import { readSettings } from "./userSettings";

// Email/password joins the existing NextAuth session instead of a second cookie.
// Credentials requires the JWT strategy. Signup stays a separate route because
// the account is created only after the email code is verified.
export const authOptions = {
  adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/login" },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    GithubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const result = await authenticateWithPassword(credentials?.email, credentials?.password);
        if (!result.ok) return null;
        return result.user;
      },
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user?.email) return true;
      const dbUser = await prisma.user.findUnique({
        where: { email: user.email },
        select: { settings: true },
      });
      if (dbUser && readSettings(dbUser.settings).deactivated) return false;
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id ?? token.sub;
        token.id = user.id ?? token.id;
        token.name = user.name ?? token.name;
        token.email = user.email ?? token.email;
        token.picture = user.image ?? user.picture ?? token.picture;
        if (user.role) token.role = user.role;
      }
      if (token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
          select: { id: true, role: true, settings: true },
        });
        if (!dbUser || readSettings(dbUser.settings).deactivated) {
          token.deactivated = true;
        } else {
          token.deactivated = false;
          token.role = dbUser.role;
          token.id = token.id ?? dbUser.id;
        }
      }
      delete token.password;
      delete token.passwordHash;
      return token;
    },
    async session({ session, token }) {
      if (token.deactivated) {
        return { ...session, user: undefined };
      }
      if (session.user) {
        session.user.id = token.id ?? token.sub;
        session.user.name = token.name ?? session.user.name;
        session.user.email = token.email ?? session.user.email;
        session.user.image = token.picture ?? session.user.image;
        session.user.role = token.role || "USER";
      }
      return session;
    },
  },
};

export const getAuthSession = () => getServerSession(authOptions);
