import crypto from "crypto";

export const OTP_TTL_MS = 10 * 60 * 1000;
export const RESEND_COOLDOWN_MS = 60 * 1000;
export const MAX_OTP_ATTEMPTS = 5;

function pepper() {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET is not set.");
  return secret;
}

export function generateOtp() {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function hashOtp(otp) {
  return crypto.createHmac("sha256", pepper()).update(String(otp)).digest("hex");
}

export function otpMatches(otp, storedHash) {
  if (typeof storedHash !== "string" || !/^\d{6}$/.test(otp)) return false;
  const next = Buffer.from(hashOtp(otp));
  const current = Buffer.from(storedHash);
  if (next.length !== current.length) return false;
  return crypto.timingSafeEqual(next, current);
}
