import bcrypt from "bcryptjs";
import prisma from "./connect";
import { readSettings } from "./userSettings";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

let dummyHash;

async function getDummyHash() {
  if (!dummyHash) {
    dummyHash = await bcrypt.hash("invalid-password-placeholder", 12);
  }
  return dummyHash;
}

export function normalizeEmail(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function validateEmail(email) {
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    return "Enter a valid email address.";
  }
  return null;
}

export function validateNewPassword(password) {
  if (typeof password !== "string" || password.length < 8) {
    return "Password must be at least 8 characters.";
  }
  if (password.length > 72) {
    return "Password must be 72 characters or fewer.";
  }
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return "Password must include at least one letter and one number.";
  }
  return null;
}

export function validateLoginPassword(password) {
  if (typeof password !== "string" || password.length === 0) {
    return "Enter your password.";
  }
  if (password.length > 72) {
    return "Password must be 72 characters or fewer.";
  }
  return null;
}

export function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

export function toPublicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    role: user.role || "USER",
  };
}

export function displayNameFromEmail(email) {
  const local = email.split("@")[0].replace(/[^a-zA-Z0-9._ -]/g, "").trim();
  return local.slice(0, 40) || "Reader";
}

export async function authenticateWithPassword(rawEmail, rawPassword) {
  const email = normalizeEmail(rawEmail);
  const emailError = validateEmail(email);
  const passwordError = validateLoginPassword(rawPassword);
  if (emailError || passwordError) {
    return {
      ok: false,
      status: 400,
      message: emailError || passwordError,
    };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  const hash = user?.password || (await getDummyHash());
  const valid = await bcrypt.compare(rawPassword, hash);

  if (user && !user.password) {
    return {
      ok: false,
      status: 401,
      message: "This email is registered with Google. Please continue with Google.",
    };
  }

  if (!user || !valid) {
    return {
      ok: false,
      status: 401,
      message: "Invalid email or password.",
    };
  }

  if (readSettings(user.settings).deactivated) {
    return {
      ok: false,
      status: 403,
      message: "This account has been deactivated.",
    };
  }

  return { ok: true, user: toPublicUser(user) };
}
