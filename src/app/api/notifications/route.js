import { getAuthSession } from "@/utils/auth";
import prisma from "@/utils/connect";
import { refreshPaths } from "@/utils/dashboard";
import { readSettings } from "@/utils/userSettings";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export const GET = async (req) => {
  const session = await getAuthSession();
  if (!session?.user?.email) {
    return NextResponse.json({ message: "Not authenticated." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, settings: true },
  });
  if (!user) return NextResponse.json({ message: "Not authenticated." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 20, 1), 50);
  const unreadOnly = searchParams.get("unread") === "1";

  try {
    const [items, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { recipientId: user.id, ...(unreadOnly ? { isRead: false } : {}) },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.notification.count({ where: { recipientId: user.id, isRead: false } }),
    ]);
    const preferences = readSettings(user.settings);
    return NextResponse.json({
      items,
      unreadCount,
      preferences: {
        notifyDesktop: preferences.notifyDesktop === true,
      },
    });
  } catch (err) {
    console.error("List notifications failed:", err?.message || err);
    return NextResponse.json({ message: "Something went wrong!" }, { status: 500 });
  }
};

export const PATCH = async (req) => {
  const session = await getAuthSession();
  if (!session?.user?.email) {
    return NextResponse.json({ message: "Not authenticated." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
  if (!user) return NextResponse.json({ message: "Not authenticated." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const markAll = body?.all === true;
  const id = typeof body?.id === "string" ? body.id.trim() : "";

  try {
    if (markAll) {
      await prisma.notification.updateMany({
        where: { recipientId: user.id, isRead: false },
        data: { isRead: true },
      });
    } else if (id) {
      const row = await prisma.notification.findFirst({
        where: { id, recipientId: user.id },
      });
      if (!row) return NextResponse.json({ message: "Notification not found." }, { status: 404 });
      await prisma.notification.update({ where: { id }, data: { isRead: true } });
    } else {
      return NextResponse.json({ message: "Provide id or { all: true }." }, { status: 400 });
    }

    refreshPaths(["/profile", "/notifications"]);
    const unreadCount = await prisma.notification.count({
      where: { recipientId: user.id, isRead: false },
    });
    return NextResponse.json({ ok: true, unreadCount });
  } catch (err) {
    console.error("Update notifications failed:", err?.message || err);
    return NextResponse.json({ message: "Something went wrong!" }, { status: 500 });
  }
};