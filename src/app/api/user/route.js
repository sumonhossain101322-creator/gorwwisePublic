import { getAuthSession } from "@/utils/auth";
import prisma from "@/utils/connect";
import { refreshPaths, toPublicUser } from "@/utils/dashboard";
import { applySettingsPatch, readSettings } from "@/utils/userSettings";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const profileSchema = z.object({
  firstName: z.string().trim().min(1, "Enter your first name.").max(40),
  lastName: z.string().trim().max(40).optional().default(""),
  username: z.string().trim().max(30).optional().default(""),
  role: z.string().trim().max(80).optional().default(""),
  location: z.string().trim().max(80).optional().default(""),
  bio: z.string().trim().max(500).optional().default(""),
  image: z.string().trim().max(2048).optional().nullable(),
});

async function currentUser() {
  const session = await getAuthSession();
  if (!session?.user?.email) return null;
  return prisma.user.findUnique({ where: { email: session.user.email } });
}

export const GET = async () => {
  const user = await currentUser();
  if (!user) return NextResponse.json({ message: "Not authenticated." }, { status: 401 });
  return NextResponse.json(toPublicUser(user));
};

export const PUT = async (req) => {
  const user = await currentUser();
  if (!user) return NextResponse.json({ message: "Not authenticated." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message || "Check the profile form." }, { status: 400 });
  }

  const data = parsed.data;
  const username = data.username.toLowerCase();
  if (username && !/^[a-z0-9_]{3,30}$/.test(username)) {
    return NextResponse.json({ message: "Username must be 3–30 letters, numbers, or underscores." }, { status: 400 });
  }
  if (username) {
    const taken = await prisma.user.findFirst({
      where: { username, NOT: { id: user.id } },
      select: { id: true },
    });
    if (taken) return NextResponse.json({ message: "That username is already taken." }, { status: 409 });
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      name: [data.firstName, data.lastName].filter(Boolean).join(" "),
      username: username || null,
      jobTitle: data.role || null,
      location: data.location || null,
      bio: data.bio || null,
      ...(data.image !== undefined ? { image: data.image || null } : {}),
    },
  });

  refreshPaths(["/profile"]);
  return NextResponse.json(toPublicUser(updated));
};

export const PATCH = async (req) => {
  const user = await currentUser();
  if (!user) return NextResponse.json({ message: "Not authenticated." }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ message: "Invalid settings." }, { status: 400 });
  }

  if ("image" in body && Object.keys(body).length === 1) {
    const image = body.image === null || body.image === "" ? null : String(body.image);
    if (image && image.length > 2048) return NextResponse.json({ message: "Image URL is too long." }, { status: 400 });
    const updated = await prisma.user.update({ where: { id: user.id }, data: { image } });
    refreshPaths(["/profile"]);
    return NextResponse.json(toPublicUser(updated));
  }

  const patched = applySettingsPatch(readSettings(user.settings), body);
  if (patched.error) return NextResponse.json({ message: patched.error }, { status: 400 });
  const updated = await prisma.user.update({ where: { id: user.id }, data: { settings: patched.settings } });
  refreshPaths(["/profile"]);
  return NextResponse.json(toPublicUser(updated));
};

export const DELETE = async () => {
  const user = await currentUser();
  if (!user) return NextResponse.json({ message: "Not authenticated." }, { status: 401 });

  const settings = { ...readSettings(user.settings), deactivated: true, visibleProfile: false };
  await prisma.user.update({
    where: { id: user.id },
    data: {
      settings,
      password: null,
      image: null,
      bio: null,
      username: null,
      jobTitle: null,
      location: null,
      name: "Former member",
    },
  });
  await prisma.session.deleteMany({ where: { userId: user.id } });
  await prisma.account.deleteMany({ where: { userId: user.id } });
  refreshPaths(["/profile"]);
  return NextResponse.json({ ok: true });
};
