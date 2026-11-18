import { getAuthSession } from "@/utils/auth";
import { getDashboard } from "@/utils/dashboard";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export const GET = async () => {
  const session = await getAuthSession();
  if (!session?.user?.email) return NextResponse.json({ message: "Not authenticated." }, { status: 401 });
  const data = await getDashboard(session.user.email);
  return NextResponse.json({ stats: data.stats });
};
