import { authOptions } from "@/utils/auth";
import { requestOrigin } from "@/utils/authCookie";
import NextAuth from "next-auth";

const nextAuth = NextAuth(authOptions);

async function handler(req, context) {
  const origin = requestOrigin(req);
  if (origin) process.env.NEXTAUTH_URL = origin;
  return nextAuth(req, context);
}

export { handler as GET, handler as POST };