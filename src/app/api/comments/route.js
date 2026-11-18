import { getAuthSession } from "@/utils/auth";
import prisma from "@/utils/connect";
import { notifyNewComment } from "@/utils/notifications";
import { readSettings } from "@/utils/userSettings";

function hidePrivateProfile(comment) {
  const user = comment?.user;
  if (!user) return comment;
  const visible = readSettings(user.settings).visibleProfile;
  return {
    ...comment,
    user: visible
      ? { name: user.name, image: user.image }
      : { name: "GrowWise member", image: null },
  };
}
import { NextResponse } from "next/server";

// GET ALL COMMENTS OF A POST
export const GET = async (req) => {
  const { searchParams } = new URL(req.url);

  const postSlug = searchParams.get("postSlug")?.trim();
  if (!postSlug) return NextResponse.json({ message: "postSlug is required." }, { status: 400 });

  try {
    const comments = await prisma.comment.findMany({
      where: {
        postSlug,
      },
      include: { user: { select: { name: true, image: true, settings: true } } },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(comments.map(hidePrivateProfile));
  } catch (err) {
    // console.log(err);
    return NextResponse.json({ message: "Something went wrong!" }, { status: 500 });
  }
};

// CREATE A COMMENT
export const POST = async (req) => {
  const session = await getAuthSession();

  if (!session?.user?.email) return NextResponse.json({ message: "Not authenticated." }, { status: 401 });

  try {
    const body = await req.json();
    const desc = typeof body.desc === "string" ? body.desc.trim() : "";
    const postSlug = typeof body.postSlug === "string" ? body.postSlug.trim() : "";
    const parentId = typeof body.parentId === "string" ? body.parentId.trim() : "";
    if (!desc || desc.length > 2000 || !postSlug || postSlug.length > 200) {
      return NextResponse.json({ message: "A comment and post are required; comments must be under 2,000 characters." }, { status: 400 });
    }

    if (parentId) {
      const parent = await prisma.comment.findUnique({
        where: { id: parentId },
        select: { id: true, postSlug: true },
      });
      if (!parent || parent.postSlug !== postSlug) {
        return NextResponse.json({ message: "That reply target is not valid." }, { status: 400 });
      }
    }

    const comment = await prisma.comment.create({
      data: {
        desc,
        postSlug,
        userEmail: session.user.email,
        ...(parentId ? { parentId } : {}),
      },
      include: { user: { select: { name: true, image: true, settings: true } } },
    });

    const [post, commenter, parentComment] = await Promise.all([
      prisma.post.findUnique({
        where: { slug: postSlug },
        select: { slug: true, title: true, userEmail: true },
      }),
      prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, name: true, email: true },
      }),
      parentId
        ? prisma.comment.findUnique({
            where: { id: parentId },
            select: { userEmail: true },
          })
        : null,
    ]);

    if (post && commenter) {
      await notifyNewComment({
        commenter,
        post,
        commentText: desc,
        parentComment,
      });
    }

    return NextResponse.json(hidePrivateProfile(comment), { status: 201 });
  } catch (err) {
    console.log(err);
    if (err?.code === "P2003") return NextResponse.json({ message: "That post does not exist." }, { status: 404 });
    return NextResponse.json({ message: "Something went wrong!" }, { status: 500 });
  }
};
