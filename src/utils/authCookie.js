import { encode } from "next-auth/jwt";
import { NextResponse } from "next/server";

const MAX_AGE = 30 * 24 * 60 * 60;

export async function readBody(req) {
  try {
    return { ok: true, body: await req.json() };
  } catch {
    return { ok: false };
  }
}

export function jsonError(message, status, extra) {
  return NextResponse.json({ message, ...extra }, { status });
}

export function rejectCrossOrigin(req) {
  const origin = req.headers.get("origin");
  if (!origin) return null;

  let originUrl;
  try {
    originUrl = new URL(origin);
  } catch {
    return jsonError("Invalid request.", 403);
  }

  const host = req.headers.get("host");
  if (host && originUrl.host === host) return null;

  const configured = process.env.NEXTAUTH_URL?.trim();
  if (configured) {
    try {
      if (originUrl.origin === new URL(configured).origin) return null;
    } catch {
      return jsonError("Invalid request.", 403);
    }
  }

  return jsonError("Invalid request.", 403);
}

export async function withSessionCookie(body, user, status = 200) {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET is not set.");

  const secure = process.env.NEXTAUTH_URL?.startsWith("https://") ?? false;
  const cookieName = secure ? "__Secure-next-auth.session-token" : "next-auth.session-token";
  const token = {
    sub: user.id,
    id: user.id,
    email: user.email,
  };
  if (user.name) token.name = user.name;
  if (user.image) token.picture = user.image;
  token.role = user.role === "ADMIN" || user.role === "WRITER" || user.role === "USER" ? user.role : "USER";

  const sessionToken = await encode({ secret, maxAge: MAX_AGE, token });

  const response = NextResponse.json(body, { status });
  response.cookies.set(cookieName, sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure,
    maxAge: MAX_AGE,
  });
  return response;
}
