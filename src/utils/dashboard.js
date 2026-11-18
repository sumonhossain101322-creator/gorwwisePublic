import prisma from "@/utils/connect";
import { NOTICE_TITLE, noticeBoardType } from "@/utils/notificationLabels";
import { DEFAULT_SETTINGS, readSettings } from "@/utils/userSettings";
import { revalidatePath } from "next/cache";

export { DEFAULT_SETTINGS, readSettings } from "@/utils/userSettings";

export const PAGE_SIZE = 6;

export function refreshPaths(paths) {
  for (const path of paths) {
    try {
      revalidatePath(path);
    } catch {
      // Next 13 route handlers can run without a static generation store.
    }
  }
}

const STATUS_LABEL = {
  PUBLISHED: "Live",
  DRAFT: "Draft",
  PENDING_APPROVAL: "Pending",
  PENDING_DELETE: "Removed",
  Live: "Live",
  Draft: "Draft",
  Removed: "Removed",
};

export function postStatus(post) {
  if (post?.status && STATUS_LABEL[post.status]) return STATUS_LABEL[post.status];
  return post?.published === false ? "Draft" : "Live";
}

export function formatCount(value) {
  const number = Number(value) || 0;
  if (number >= 1_000_000) return `${trimNumber(number / 1_000_000)}M`;
  if (number >= 1_000) return `${trimNumber(number / 1_000)}K`;
  return String(number);
}

const trimNumber = (value) => value.toFixed(1).replace(/\.0$/, "");

export function splitName(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  return { firstName: parts[0] || "", lastName: parts.slice(1).join(" ") };
}

export function labelFromSlug(slug) {
  return String(slug || "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

const dateLabel = (value) => {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
};

export function toPublicUser(user) {
  if (!user) return null;
  const name = splitName(user.name);
  return {
    id: user.id,
    email: user.email,
    name: user.name || "",
    firstName: name.firstName,
    lastName: name.lastName,
    username: user.username || "",
    role: user.jobTitle || "",
    location: user.location || "",
    bio: user.bio || "",
    image: user.image || "",
    coverImage: user.coverImage || "",
    verified: Boolean(user.emailVerified),
    joined: dateLabel(user.createdAt),
    settings: readSettings(user.settings),
  };
}

export function toTablePost(post) {
  return {
    id: post.id,
    slug: post.slug,
    name: post.title,
    author: post.user?.name || post.userEmail,
    date: dateLabel(post.publishedAt || post.createdAt),
    category: post.cat?.title || labelFromSlug(post.catSlug),
    status: postStatus(post),
    image: post.img || "",
    editorPick: Boolean(post.editorPick),
  };
}

export async function getOwnedPost(slug, email) {
  if (!slug || !email) return null;
  const post = await prisma.post.findUnique({ where: { slug } });
  if (!post || post.userEmail !== email) return null;
  return post;
}

export async function getDashboard(email) {
  const empty = {
    user: null,
    stats: [
      { key: "views", value: "0", label: "Pageviews" },
      { key: "posts", value: "0", label: "Posts" },
      { key: "likes", value: "0", label: "Likes" },
      { key: "visitors", value: "0", label: "Visitors" },
    ],
    traffic: [],
    sources: [],
    latest: [],
    comments: [],
    notices: [],
    posts: { items: [], total: 0, page: 1, pageSize: PAGE_SIZE },
  };
  if (!email) return empty;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return empty;

    const [postStats, traffic, sources, latest, comments, notices, table] = await Promise.all([
      prisma.post.aggregate({ where: { userEmail: email }, _sum: { views: true }, _count: true }),
      prisma.trafficStat.findMany({ where: { userEmail: email }, orderBy: { sortOrder: "asc" } }),
      prisma.trafficSource.findMany({ where: { userEmail: email }, orderBy: { value: "desc" } }),
      prisma.post.findMany({
        where: { userEmail: email },
        orderBy: { createdAt: "desc" },
        take: 3,
        select: { id: true, slug: true, title: true, img: true, createdAt: true, publishedAt: true },
      }),
      prisma.comment.findMany({
        where: { post: { userEmail: email } },
        orderBy: { createdAt: "desc" },
        take: 4,
        include: { user: { select: { name: true, image: true } } },
      }),
      prisma.notification.findMany({
        where: { recipientId: user.id },
        orderBy: { createdAt: "desc" },
        take: 12,
      }),
      listPosts({ email, page: 1 }),
    ]);

    const views = postStats._sum.views || 0;
    const visitors = sources.reduce((sum, source) => sum + (source.value || 0), 0);

    return {
      user: toPublicUser(user),
      stats: [
        { key: "views", value: formatCount(views), label: "Pageviews" },
        { key: "posts", value: formatCount(postStats._count), label: "Posts" },
        { key: "likes", value: "0", label: "Likes" },
        { key: "visitors", value: formatCount(visitors), label: "Visitors" },
      ],
      traffic: traffic.map((item) => ({ month: item.month, value: item.views })),
      sources: sources.map((item) => ({ name: item.sourceName, value: item.value })),
      latest: latest.map((post) => ({
        slug: post.slug,
        title: post.title,
        date: dateLabel(post.publishedAt || post.createdAt),
        image: post.img || "",
      })),
      comments: comments.map((comment) => ({
        id: comment.id,
        text: comment.desc,
        author: comment.user?.name || "Reader",
        avatar: comment.user?.image || "",
      })),
      notices: notices.map((notice) => ({
        id: notice.id,
        title: NOTICE_TITLE[notice.type] || "Notification",
        desc: notice.message,
        type: noticeBoardType(notice.type),
        time: notice.createdAt.toISOString(),
        link: notice.link || "/profile",
        isRead: notice.isRead,
      })),
      posts: table,
    };
  } catch (err) {
    console.error("Dashboard load failed:", err);
    return empty;
  }
}

export async function listPosts({ email, page = 1, q = "", sort = "date" }) {
  const currentPage = Number.isInteger(page) && page > 0 ? page : 1;
  const query = q.trim();
  const where = {
    userEmail: email,
    ...(query ? { title: { contains: query, mode: "insensitive" } } : {}),
  };
  const orderBy = sort === "name" ? { title: "asc" } : { createdAt: "desc" };
  const [items, total, categories] = await prisma.$transaction([
    prisma.post.findMany({
      where,
      orderBy,
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { user: { select: { name: true } } },
    }),
    prisma.post.count({ where }),
    prisma.category.findMany({ select: { slug: true, title: true } }),
  ]);
  const categoryTitles = new Map(categories.map((row) => [row.slug, row.title]));
  return {
    items: items.map((post) =>
      toTablePost({
        ...post,
        cat: post.catSlug ? { title: categoryTitles.get(post.catSlug) || labelFromSlug(post.catSlug) } : null,
      }),
    ),
    total,
    page: currentPage,
    pageSize: PAGE_SIZE,
  };
}
