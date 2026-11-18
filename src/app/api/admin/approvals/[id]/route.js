import { assertRole, currentAccount, decideApproval } from "@/utils/postWorkflow";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export const POST = async (req, { params }) => {
  const account = await currentAccount();
  if (account.error) return account.error;
  const denied = assertRole(account.user, ["ADMIN"]);
  if (denied) return denied;

  const body = await req.json().catch(() => null);
  const action = body?.action || body?.status;
  const decision = action === "approve" || action === "APPROVED"
    ? "APPROVED"
    : action === "reject" || action === "REJECTED"
      ? "REJECTED"
      : null;
  if (!decision) {
    return NextResponse.json({ message: "Send action approve or reject." }, { status: 400 });
  }

  try {
    return await decideApproval(params.id, decision, account.user.id);
  } catch (err) {
    console.error("Review approval failed", err?.message || err);
    return NextResponse.json({ message: "Something went wrong!" }, { status: 500 });
  }
};
