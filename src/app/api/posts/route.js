import prisma from "@/utils/connect";
import { createPostForUser, currentAccount } from "@/utils/postWorkflow";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const POST_PER_PAGE = 2;

export const GET = async (req) => {
  const { searchParams } = new URL(req.url);
  const requestedPage = Number(searchParams.get("page") || 1);
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const cat = searchParams.get("cat")?.trim();

  const where = {
    status: "PUBLISHED",
    ...(cat && { catSlug: cat }),
  };

  try {
    const [posts, count] = await prisma.$transaction([
      prisma.post.findMany({
        where,
        take: POST_PER_PAGE,
        skip: POST_PER_PAGE * (page - 1),
        orderBy: { createdAt: "desc" },
      }),
      prisma.post.count({ where }),
    ]);
    return NextResponse.json({ posts, count });
  } catch (err) {
    console.error("List posts failed", err?.message || err);
    return NextResponse.json({ message: "Something went wrong!" }, { status: 500 });
  }
};

export const POST = async (req) => {
  const account = await currentAccount();
  if (account.error) return account.error;
  const body = await req.json().catch(() => null);
  return createPostForUser(account.user, body);
};
