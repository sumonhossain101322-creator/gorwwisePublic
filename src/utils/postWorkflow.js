import { getAuthSession } from "@/utils/auth";
import { cleanHtml } from "@/utils/cleanHtml";
import prisma from "@/utils/connect";
import { refreshPaths } from "@/utils/dashboard";
import {
  notifyAdminsOfReview,
  notifyApprovalDecision,
} from "@/utils/notifications";
import { NextResponse } from "next/server";
import sanitizeHtml from "sanitize-html";

const POST_STATUSES = ["DRAFT", "PENDING_APPROVAL", "PUBLISHED", "PENDING_DELETE"];
const ROLES = ["ADMIN", "WRITER", "USER"];

export async function currentAccount() {
  const session = await getAuthSession();
  if (!session?.user?.email) {
    return { error: NextResponse.json({ message: "Not authenticated." }, { status: 401 }) };
  }
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return { error: NextResponse.json({ message: "Not authenticated." }, { status: 401 }) };
  return { user };
}

export function assertRole(user, roles) {
  if (!roles.includes(user.role)) {
    return NextResponse.json({ message: "You do not have access to this action." }, { status: 403 });
  }
  return null;
}

function wantsDraft(body) {
  return body?.draft === true || body?.status === "DRAFT" || body?.intent === "draft" || body?.action === "draft";
}

function readingMinutes(html) {
  const plain = sanitizeHtml(html || "", { allowedTags: [], allowedAttributes: {} }).trim();
  const words = plain ? plain.split(/\s+/).filter(Boolean).length : 0;
  return Math.max(1, Math.ceil(words / 220));
}

function readImage(body) {
  if (!body || !Object.prototype.hasOwnProperty.call(body, "img")) return { omit: true };
  if (body.img === null || body.img === "") return { value: null };
  if (typeof body.img === "string" && body.img.length < 2048) return { value: body.img };
  return { error: "Image URL is too long." };
}

export function readPostInput(body, { slugRequired = false } = {}) {
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const slug = typeof body?.slug === "string" ? body.slug.trim() : "";
  const desc = typeof body?.desc === "string" ? cleanHtml(body.desc) : "";
  const catSlug = typeof body?.catSlug === "string" ? body.catSlug.trim() : "";
  const excerpt = typeof body?.excerpt === "string" ? body.excerpt.trim().slice(0, 300) : undefined;
  const image = readImage(body);
  if (image.error) return { error: image.error };

  const plainText = sanitizeHtml(desc, { allowedTags: [], allowedAttributes: {} }).trim();
  const hasImage = /<img\b/i.test(desc);
  const slugOk = slugRequired ? slug.length > 0 && slug.length <= 200 : slug.length <= 200;
  if (!title || title.length > 180 || !slugOk || (!plainText && !hasImage) || plainText.length > 50000 || !catSlug || catSlug.length > 80) {
    return { error: "Please provide a valid title, content, and category." };
  }

  return {
    value: {
      title,
      slug,
      desc,
      catSlug,
      excerpt,
      img: image.omit ? undefined : image.value,
      readTime: readingMinutes(desc),
      draft: wantsDraft(body),
    },
  };
}

export async function findPost(idOrSlug) {
  if (!idOrSlug) return null;
  const byId = await prisma.post.findUnique({ where: { id: idOrSlug } });
  if (byId) return byId;
  return prisma.post.findUnique({ where: { slug: idOrSlug } });
}

async function openRequest(postId, type) {
  return prisma.approvalRequest.findFirst({
    where: { targetPostId: postId, type, status: "PENDING" },
    orderBy: { createdAt: "desc" },
  });
}

async function saveRequest(user, post, type, payload) {
  const existing = await openRequest(post.id, type);
  if (existing) {
    return prisma.approvalRequest.update({
      where: { id: existing.id },
      data: { payload, requesterId: user.id },
    });
  }
  return prisma.approvalRequest.create({
    data: {
      type,
      requesterId: user.id,
      targetPostId: post.id,
      payload,
      status: "PENDING",
    },
  });
}

function contentPayload(input, post) {
  return {
    title: input.title,
    desc: input.desc,
    catSlug: input.catSlug,
    img: input.img === undefined ? post?.img ?? null : input.img,
    excerpt: input.excerpt === undefined ? post?.excerpt ?? null : input.excerpt,
    readTime: input.readTime,
  };
}

function refreshPost(slug) {
  const paths = ["/profile", "/", "/blog"];
  if (slug) paths.push(`/posts/${slug}`);
  refreshPaths(paths);
}

function jsonError(message, status) {
  return NextResponse.json({ message }, { status });
}

export async function createPostForUser(user, body) {
  const denied = assertRole(user, ["ADMIN", "WRITER"]);
  if (denied) return denied;

  const parsed = readPostInput(body, { slugRequired: true });
  if (parsed.error) return jsonError(parsed.error, 400);
  const input = parsed.value;
  const isAdmin = user.role === "ADMIN";
  const draft = Boolean(input.draft);
  const status = draft ? "DRAFT" : isAdmin ? "PUBLISHED" : "PENDING_APPROVAL";

  try {
    const post = await prisma.post.create({
      data: {
        title: input.title,
        slug: input.slug,
        desc: input.desc,
        catSlug: input.catSlug,
        excerpt: input.excerpt || null,
        img: input.img === undefined ? null : input.img,
        readTime: input.readTime,
        published: status === "PUBLISHED",
        publishedAt: status === "PUBLISHED" ? new Date() : null,
        status,
        userEmail: user.email,
      },
    });

    let approval = null;
    if (status === "PENDING_APPROVAL") {
      approval = await saveRequest(user, post, "POST_CREATE", contentPayload(input, post));
      await notifyAdminsOfReview(user, post, "POST_CREATE");
    }
    refreshPost(post.slug);
    return NextResponse.json(
      {
        ...post,
        approvalId: approval?.id || null,
        message: status === "PUBLISHED" ? "Published." : draft ? "Draft saved." : "Submitted for approval.",
      },
      { status: 201 }
    );
  } catch (err) {
    if (err?.code === "P2002") return jsonError("A post with this title already exists. Please change the title.", 409);
    if (err?.code === "P2003") return jsonError("That category does not exist.", 400);
    console.error("Create post failed", err?.message || err);
    return jsonError("Something went wrong!", 500);
  }
}

export async function updatePostForUser(user, idOrSlug, body) {
  const denied = assertRole(user, ["ADMIN", "WRITER"]);
  if (denied) return denied;

  const post = await findPost(idOrSlug);
  if (!post || (user.role !== "ADMIN" && post.userEmail !== user.email)) {
    return jsonError("Post not found.", 404);
  }

  const parsed = readPostInput(body);
  if (parsed.error) return jsonError(parsed.error, 400);
  const input = parsed.value;

  if (user.role === "WRITER" && post.status === "PENDING_DELETE") {
    return jsonError("This post is already waiting to be deleted.", 409);
  }

  if (user.role === "WRITER" && post.status === "PUBLISHED") {
    const blocking = await openRequest(post.id, "POST_DELETE");
    if (blocking) return jsonError("This post is already waiting to be deleted.", 409);
    const approval = await saveRequest(user, post, "POST_UPDATE", contentPayload(input, post));
    await notifyAdminsOfReview(user, post, "POST_UPDATE");
    return NextResponse.json({
      ...post,
      pending: true,
      approvalId: approval.id,
      message: "Edit submitted for approval. The live post is unchanged.",
    });
  }

  const nextStatus = user.role === "ADMIN"
    ? (input.draft ? "DRAFT" : "PUBLISHED")
    : (input.draft ? "DRAFT" : "PENDING_APPROVAL");

  try {
    const updated = await prisma.post.update({
      where: { id: post.id },
      data: {
        title: input.title,
        desc: input.desc,
        catSlug: input.catSlug,
        excerpt: input.excerpt === undefined ? post.excerpt : input.excerpt || null,
        readTime: input.readTime,
        ...(input.img !== undefined ? { img: input.img } : {}),
        status: nextStatus,
        published: nextStatus === "PUBLISHED",
        publishedAt: nextStatus === "PUBLISHED" ? post.publishedAt || new Date() : post.publishedAt,
      },
    });

    let approval = null;
    if (nextStatus === "PENDING_APPROVAL") {
      approval = await saveRequest(user, updated, "POST_CREATE", contentPayload(input, updated));
      await notifyAdminsOfReview(user, updated, "POST_CREATE");
    } else if (nextStatus === "DRAFT") {
      await prisma.approvalRequest.deleteMany({
        where: { targetPostId: post.id, type: "POST_CREATE", status: "PENDING" },
      });
    }

    refreshPost(updated.slug);
    return NextResponse.json({
      ...updated,
      approvalId: approval?.id || null,
      message: nextStatus === "PUBLISHED" ? "Published." : nextStatus === "DRAFT" ? "Draft saved." : "Submitted for approval.",
    });
  } catch (err) {
    if (err?.code === "P2002") return jsonError("A post with this title already exists. Please change the title.", 409);
    if (err?.code === "P2003") return jsonError("That category does not exist.", 400);
    console.error("Update post failed", err?.message || err);
    return jsonError("Something went wrong!", 500);
  }
}

async function removePost(post) {
  await prisma.comment.deleteMany({ where: { postSlug: post.slug } });
  await prisma.approvalRequest.updateMany({
    where: { targetPostId: post.id, status: "PENDING" },
    data: { status: "REJECTED" },
  });
  await prisma.approvalRequest.updateMany({
    where: { targetPostId: post.id },
    data: { targetPostId: null },
  });
  await prisma.post.delete({ where: { id: post.id } });
  refreshPost(post.slug);
}

export async function deletePostForUser(user, idOrSlug) {
  const denied = assertRole(user, ["ADMIN", "WRITER"]);
  if (denied) return denied;

  const post = await findPost(idOrSlug);
  if (!post || (user.role !== "ADMIN" && post.userEmail !== user.email)) {
    return jsonError("Post not found.", 404);
  }

  if (user.role === "ADMIN") {
    await removePost(post);
    return NextResponse.json({ ok: true, message: "Post deleted." });
  }

  const existing = await openRequest(post.id, "POST_DELETE");
  if (existing) {
    return NextResponse.json({
      ...post,
      pending: true,
      approvalId: existing.id,
      message: "Delete submitted for approval.",
    });
  }

  const pendingEdit = await openRequest(post.id, "POST_UPDATE");
  if (pendingEdit) return jsonError("Resolve the pending edit before requesting deletion.", 409);

  const updated = await prisma.post.update({
    where: { id: post.id },
    data: { status: "PENDING_DELETE", published: false },
  });
  const approval = await saveRequest(user, updated, "POST_DELETE", {
    previousStatus: post.status,
    previousPublished: post.published,
  });
  await notifyAdminsOfReview(user, updated, "POST_DELETE");
  refreshPost(post.slug);
  return NextResponse.json({
    ...updated,
    pending: true,
    approvalId: approval.id,
    message: "Delete submitted for approval.",
  });
}

function restoreStatus(payload) {
  const status = POST_STATUSES.includes(payload?.previousStatus) && payload.previousStatus !== "PENDING_DELETE"
    ? payload.previousStatus
    : "PUBLISHED";
  const published = typeof payload?.previousPublished === "boolean" ? payload.previousPublished : status === "PUBLISHED";
  return { status, published };
}

function applyPayload(post, payload) {
  const title = typeof payload?.title === "string" ? payload.title.trim() : "";
  const desc = typeof payload?.desc === "string" ? payload.desc : "";
  const catSlug = typeof payload?.catSlug === "string" ? payload.catSlug.trim() : "";
  if (!title || title.length > 180 || !desc || !catSlug || catSlug.length > 80) return null;
  return {
    title,
    desc,
    catSlug,
    img: payload.img === null || typeof payload.img === "string" ? payload.img : post.img,
    excerpt: typeof payload.excerpt === "string" ? payload.excerpt.slice(0, 300) : post.excerpt,
    readTime: Number.isInteger(payload?.readTime) && payload.readTime > 0 ? payload.readTime : post.readTime,
    status: "PUBLISHED",
    published: true,
    publishedAt: post.publishedAt || new Date(),
  };
}

export async function listPendingApprovals(status = "PENDING") {
  const where = status && status !== "ALL" ? { status } : {};
  const [requests, count] = await prisma.$transaction([
    prisma.approvalRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        requester: { select: { id: true, name: true, email: true, role: true } },
        targetPost: { select: { id: true, title: true, slug: true, status: true } },
      },
    }),
    prisma.approvalRequest.count({ where }),
  ]);
  return { requests, count };
}

export async function decideApproval(requestId, decision, reviewerId = null) {
  const request = await prisma.approvalRequest.findUnique({
    where: { id: requestId },
    include: { targetPost: true },
  });
  if (!request) return jsonError("Approval request not found.", 404);
  if (request.status !== "PENDING") return jsonError("This request has already been reviewed.", 409);

  if (decision === "REJECTED") {
    if (request.type === "POST_DELETE" && request.targetPost) {
      const restored = restoreStatus(request.payload);
      await prisma.post.update({ where: { id: request.targetPost.id }, data: restored });
    }
    if (request.type === "POST_CREATE" && request.targetPost) {
      await prisma.post.update({
        where: { id: request.targetPost.id },
        data: { status: "DRAFT", published: false },
      });
    }
    const updated = await prisma.approvalRequest.update({
      where: { id: request.id },
      data: { status: "REJECTED" },
    });
    await notifyApprovalDecision(request, false, reviewerId);
    refreshPost(request.targetPost?.slug);
    refreshPaths(["/profile", "/admin/approvals"]);
    return NextResponse.json({ ...updated, message: "Request rejected." });
  }

  if (request.type === "POST_UPDATE") {
    if (!request.targetPost) return jsonError("The post no longer exists.", 404);
    const data = applyPayload(request.targetPost, request.payload);
    if (!data) return jsonError("The proposed edit is not valid.", 400);
    const post = await prisma.post.update({ where: { id: request.targetPost.id }, data });
    const updated = await prisma.approvalRequest.update({
      where: { id: request.id },
      data: { status: "APPROVED" },
    });
    await notifyApprovalDecision(request, true, reviewerId);
    refreshPost(post.slug);
    refreshPaths(["/profile", "/admin/approvals"]);
    return NextResponse.json({ ...updated, post, message: "Edit approved." });
  }

  if (request.type === "POST_CREATE") {
    if (!request.targetPost) return jsonError("The post no longer exists.", 404);
    const post = await prisma.post.update({
      where: { id: request.targetPost.id },
      data: { status: "PUBLISHED", published: true, publishedAt: request.targetPost.publishedAt || new Date() },
    });
    const updated = await prisma.approvalRequest.update({
      where: { id: request.id },
      data: { status: "APPROVED" },
    });
    await notifyApprovalDecision(request, true, reviewerId);
    refreshPost(post.slug);
    refreshPaths(["/profile", "/admin/approvals"]);
    return NextResponse.json({ ...updated, post, message: "Post approved." });
  }

  if (request.type === "POST_DELETE") {
    if (request.targetPost) await removePost(request.targetPost);
    const updated = await prisma.approvalRequest.update({
      where: { id: request.id },
      data: { status: "APPROVED", targetPostId: null },
    });
    await notifyApprovalDecision(request, true, reviewerId);
    refreshPaths(["/profile", "/admin/approvals"]);
    return NextResponse.json({ ...updated, message: "Delete approved." });
  }

  if (request.type === "ROLE_UPGRADE") {
    const role = request.payload?.role;
    if (!ROLES.includes(role)) return jsonError("The requested role is not valid.", 400);
    await prisma.user.update({ where: { id: request.requesterId }, data: { role } });
    const updated = await prisma.approvalRequest.update({
      where: { id: request.id },
      data: { status: "APPROVED" },
    });
    await notifyApprovalDecision(request, true, reviewerId);
    refreshPaths(["/profile", "/admin/approvals"]);
    return NextResponse.json({ ...updated, message: "Role approved." });
  }

  return jsonError("This request type is not supported.", 400);
}

const EDITOR_PICK_LIMIT = 4;

export async function setEditorPickForUser(user, slug, picked) {
  const denied = assertRole(user, ["ADMIN", "WRITER"]);
  if (denied) return denied;

  const post = await prisma.post.findUnique({ where: { slug } });
  if (!post || (user.role !== "ADMIN" && post.userEmail !== user.email)) {
    return jsonError("Post not found.", 404);
  }
  if (!post.published || post.status !== "PUBLISHED") {
    return jsonError("Only published posts can be featured.", 400);
  }

  if (picked) {
    const count = await prisma.post.count({
      where: {
        userEmail: post.userEmail,
        editorPick: true,
        NOT: { id: post.id },
      },
    });
    if (count >= EDITOR_PICK_LIMIT) {
      return jsonError(`You can feature up to ${EDITOR_PICK_LIMIT} posts.`, 409);
    }
  }

  const updated = await prisma.post.update({
    where: { id: post.id },
    data: { editorPick: Boolean(picked) },
  });
  refreshPaths([
    "/profile",
    `/posts/${post.slug}`,
    ...(post.userEmail
      ? (
          await prisma.post.findMany({
            where: { userEmail: post.userEmail, editorPick: true },
            select: { slug: true },
          })
        ).map((row) => `/posts/${row.slug}`)
      : []),
  ]);
  return NextResponse.json({
    ok: true,
    slug: updated.slug,
    editorPick: updated.editorPick,
    message: picked ? "Added to Editor's Pick." : "Removed from Editor's Pick.",
  });
}
