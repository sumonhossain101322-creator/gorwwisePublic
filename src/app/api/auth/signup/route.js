import prisma from "@/utils/connect";
import { jsonError, readBody, rejectCrossOrigin } from "@/utils/authCookie";
import { sendOtpEmail } from "@/utils/mail";
import { OTP_TTL_MS, RESEND_COOLDOWN_MS, generateOtp, hashOtp } from "@/utils/otp";
import { hashPassword, normalizeEmail, validateEmail, validateNewPassword } from "@/utils/password";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req) {
  const forbidden = rejectCrossOrigin(req);
  if (forbidden) return forbidden;

  const parsed = await readBody(req);
  if (!parsed.ok) return jsonError("Invalid request.", 400);

  const email = normalizeEmail(parsed.body?.email);
  const password = parsed.body?.password;
  const emailError = validateEmail(email);
  const passwordError = validateNewPassword(password);
  if (emailError || passwordError) return jsonError(emailError || passwordError, 400);

  try {
    const existingUser = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existingUser) return jsonError("User already exists, please sign in", 409);

    const pending = await prisma.otp.findUnique({ where: { email } });
    if (pending) {
      const elapsed = Date.now() - new Date(pending.createdAt).getTime();
      if (elapsed < RESEND_COOLDOWN_MS) {
        const retryAfter = Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000);
        return jsonError("Please wait before requesting another code.", 429, { retryAfter });
      }
    }

    const otp = generateOtp();
    const passwordHash = await hashPassword(password);
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);
    const data = {
      otp: hashOtp(otp),
      passwordHash,
      expiresAt,
      attempts: 0,
      createdAt: new Date(),
    };

    await prisma.otp.upsert({
      where: { email },
      update: data,
      create: { email, ...data },
    });

    try {
      const delivery = await sendOtpEmail({ to: email, otp });
      return NextResponse.json({
        message: "Verification code sent.",
        ...(delivery.mocked && process.env.NODE_ENV !== "production" ? { devCode: otp } : {}),
      });
    } catch (error) {
      await prisma.otp.delete({ where: { email } }).catch(() => {});
      console.error("Failed to send verification email", error?.message || error);
      return jsonError("Could not send the verification email. Try again.", 500);
    }
  } catch (error) {
    console.error("Signup failed", error?.message || error);
    return jsonError("Something went wrong. Please try again.", 500);
  }
}
