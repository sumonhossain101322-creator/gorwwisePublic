import prisma from "@/utils/connect";
import { currentAccount, deletePostForUser, findPost, updatePostForUser } from "@/utils/postWorkflow";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export const GET = async (req, { params }) => {
  try {
    const existing = await findPost(params.id);
    if (!existing || existing.status !== "PUBLISHED") {
      return NextResponse.json({ message: "Post not found." }, { status: 404 });
    }
    const post = await prisma.post.update({
      where: { id: existing.id },
      data: { views: { increment: 1 } },
      include: { user: { select: { name: true, image: true } } },
    });
    return NextResponse.json(post);
  } catch (err) {
    console.error("Read post failed", err?.message || err);
    return NextResponse.json({ message: "Something went wrong!" }, { status: 500 });
  }
};

export const PUT = async (req, { params }) => {
  const account = await currentAccount();
  if (account.error) return account.error;
  const body = await req.json().catch(() => null);
  return updatePostForUser(account.user, params.id, body);
};

export const DELETE = async (req, { params }) => {
  const account = await currentAccount();
  if (account.error) return account.error;
  return deletePostForUser(account.user, params.id);
};
