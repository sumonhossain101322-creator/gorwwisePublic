import prisma from "@/utils/connect";
import { jsonError, readBody, rejectCrossOrigin, withSessionCookie } from "@/utils/authCookie";
import { MAX_OTP_ATTEMPTS, otpMatches } from "@/utils/otp";
import { displayNameFromEmail, normalizeEmail, toPublicUser, validateEmail } from "@/utils/password";

export const runtime = "nodejs";

export async function POST(req) {
  const forbidden = rejectCrossOrigin(req);
  if (forbidden) return forbidden;

  const parsed = await readBody(req);
  if (!parsed.ok) return jsonError("Invalid request.", 400);

  const email = normalizeEmail(parsed.body?.email);
  const otp = typeof parsed.body?.otp === "string" ? parsed.body.otp.replace(/\s/g, "") : "";
  const emailError = validateEmail(email);
  if (emailError) return jsonError(emailError, 400);
  if (!/^\d{6}$/.test(otp)) return jsonError("Enter the 6-digit code.", 400);

  try {
    const pending = await prisma.otp.findUnique({ where: { email } });
    if (!pending) return jsonError("That code is invalid or has expired.", 400);

    if (pending.expiresAt.getTime() <= Date.now() || pending.attempts >= MAX_OTP_ATTEMPTS) {
      await prisma.otp.delete({ where: { email } }).catch(() => {});
      return jsonError(
        pending.expiresAt.getTime() <= Date.now()
          ? "That code has expired. Request a new one."
          : "Too many attempts. Request a new code.",
        400
      );
    }

    if (!otpMatches(otp, pending.otp)) {
      const updated = await prisma.otp.update({
        where: { email },
        data: { attempts: { increment: 1 } },
      });
      if (updated.attempts >= MAX_OTP_ATTEMPTS) {
        await prisma.otp.delete({ where: { email } }).catch(() => {});
        return jsonError("Too many attempts. Request a new code.", 400);
      }
      return jsonError("That code is incorrect.", 400);
    }

    const existingUser = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existingUser) {
      await prisma.otp.delete({ where: { email } }).catch(() => {});
      return jsonError("User already exists, please sign in", 409);
    }

    const user = await prisma.user.create({
      data: {
        email,
        name: displayNameFromEmail(email),
        password: pending.passwordHash,
        emailVerified: new Date(),
      },
    });
    await prisma.otp.delete({ where: { email } }).catch(() => {});

    const publicUser = toPublicUser(user);
    return withSessionCookie({ user: publicUser }, publicUser, 201);
  } catch (error) {
    if (error?.code === "P2002") return jsonError("User already exists, please sign in", 409);
    console.error("OTP verification failed", error?.message || error);
    return jsonError("Something went wrong. Please try again.", 500);
  }
}
