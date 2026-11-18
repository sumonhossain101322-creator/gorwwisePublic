import { getAuthSession } from "@/utils/auth";
import { refreshPaths, toPublicUser } from "@/utils/dashboard";
import { applySettingsPatch, readSettings } from "@/utils/userSettings";
import prisma from "@/utils/connect";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export const PATCH = async (req) => {
  const session = await getAuthSession();
  if (!session?.user?.email) return NextResponse.json({ message: "Not authenticated." }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ message: "Invalid settings." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ message: "User not found." }, { status: 404 });

  const patched = applySettingsPatch(readSettings(user.settings), body);
  if (patched.error) return NextResponse.json({ message: patched.error }, { status: 400 });

  const updated = await prisma.user.update({ where: { id: user.id }, data: { settings: patched.settings } });
  refreshPaths(["/profile"]);
  return NextResponse.json({ settings: toPublicUser(updated).settings });
};
