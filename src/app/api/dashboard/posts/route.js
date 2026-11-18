import { getAuthSession } from "@/utils/auth";
import { listPosts } from "@/utils/dashboard";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export const GET = async (req) => {
  const session = await getAuthSession();
  if (!session?.user?.email) return NextResponse.json({ message: "Not authenticated." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get("page") || 1);
  const q = searchParams.get("q") || "";
  const sort = searchParams.get("sort") === "name" ? "name" : "date";
  const posts = await listPosts({ email: session.user.email, page, q, sort });
  return NextResponse.json(posts);
};
