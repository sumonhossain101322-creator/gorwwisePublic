import { getAuthSession } from "@/utils/auth";
import { getOwnedPost } from "@/utils/dashboard";
import {
  currentAccount,
  deletePostForUser,
  setEditorPickForUser,
  updatePostForUser,
} from "@/utils/postWorkflow";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export const GET = async (req, { params }) => {
  const session = await getAuthSession();
  if (!session?.user?.email) return NextResponse.json({ message: "Not authenticated." }, { status: 401 });
  const post = await getOwnedPost(params.slug, session.user.email);
  if (!post) return NextResponse.json({ message: "Post not found." }, { status: 404 });
  return NextResponse.json({
    id: post.id,
    slug: post.slug,
    title: post.title,
    desc: post.desc,
    img: post.img,
    excerpt: post.excerpt || "",
    readTime: post.readTime,
    catSlug: post.catSlug,
    status: post.status,
    published: post.published,
    editorPick: Boolean(post.editorPick),
  });
};

export const PATCH = async (req, { params }) => {
  const account = await currentAccount();
  if (account.error) return account.error;
  const body = await req.json().catch(() => null);
  if (
    body &&
    typeof body === "object" &&
    Object.keys(body).length === 1 &&
    Object.prototype.hasOwnProperty.call(body, "editorPick")
  ) {
    return setEditorPickForUser(account.user, params.slug, Boolean(body.editorPick));
  }
  return updatePostForUser(account.user, params.slug, body);
};

export const DELETE = async (req, { params }) => {
  const account = await currentAccount();
  if (account.error) return account.error;
  return deletePostForUser(account.user, params.slug);
};
