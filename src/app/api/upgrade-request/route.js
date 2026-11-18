import prisma from "@/utils/connect";
import { refreshPaths } from "@/utils/dashboard";
import { notifyRoleUpgradeRequest } from "@/utils/notifications";
import { currentAccount } from "@/utils/postWorkflow";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export const GET = async () => {
  const account = await currentAccount();
  if (account.error) return account.error;
  const pending = await prisma.approvalRequest.findFirst({
    where: { requesterId: account.user.id, type: "ROLE_UPGRADE", status: "PENDING" },
    select: { id: true },
  });
  return NextResponse.json({ pending: Boolean(pending) });
};

export const POST = async (req) => {
  const account = await currentAccount();
  if (account.error) return account.error;
  if (account.user.role !== "USER") {
    return NextResponse.json({ message: "Only readers can apply to write." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const bio = typeof body?.bio === "string" ? body.bio.trim() : "";
  const reason = typeof body?.reason === "string" ? body.reason.trim() : "";
  if (bio.length < 10 || bio.length > 500) {
    return NextResponse.json({ message: "Enter a short bio (10–500 characters)." }, { status: 400 });
  }
  if (reason.length < 10 || reason.length > 1000) {
    return NextResponse.json({ message: "Tell us why you want to write (10–1000 characters)." }, { status: 400 });
  }

  const existing = await prisma.approvalRequest.findFirst({
    where: { requesterId: account.user.id, type: "ROLE_UPGRADE", status: "PENDING" },
  });
  if (existing) {
    return NextResponse.json({ message: "You already have an application under review." }, { status: 409 });
  }

  await prisma.approvalRequest.create({
    data: {
      type: "ROLE_UPGRADE",
      requesterId: account.user.id,
      payload: { bio, reason },
      status: "PENDING",
    },
  });

  await prisma.user.update({
    where: { id: account.user.id },
    data: { bio },
  });

  await notifyRoleUpgradeRequest(account.user);

  refreshPaths(["/profile", "/admin/approvals"]);
  return NextResponse.json({ ok: true, message: "Application submitted." });
};