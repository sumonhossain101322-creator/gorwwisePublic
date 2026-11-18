import { assertRole, currentAccount, listPendingApprovals } from "@/utils/postWorkflow";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const STATUSES = ["PENDING", "APPROVED", "REJECTED", "ALL"];

export const GET = async (req) => {
  const account = await currentAccount();
  if (account.error) return account.error;
  const denied = assertRole(account.user, ["ADMIN"]);
  if (denied) return denied;

  const requested = new URL(req.url).searchParams.get("status") || "PENDING";
  if (!STATUSES.includes(requested)) {
    return NextResponse.json({ message: "Unknown approval status." }, { status: 400 });
  }

  try {
    const result = await listPendingApprovals(requested);
    return NextResponse.json(result);
  } catch (err) {
    console.error("List approvals failed", err?.message || err);
    return NextResponse.json({ message: "Something went wrong!" }, { status: 500 });
  }
};
