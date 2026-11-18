import { cache } from "react";
import prisma from "@/utils/connect";
import { labelFromSlug, plainExcerpt } from "@/utils/homeData";
import { publicAuthorName } from "@/utils/userSettings";

export const SEARCH_PAGE_SIZE = 10;

export const searchPublishedPosts = cache(async (rawQuery, rawPage = 1) => {
  const query = String(rawQuery || "").trim().slice(0, 80);
  const requested = Number.isFinite(Number(rawPage)) ? Math.floor(Number(rawPage)) : 1;
  const empty = { query, posts: [], total: 0, page: 1, pageSize: SEARCH_PAGE_SIZE };

  if (query.length < 2) return empty;

  const text = { contains: query, mode: "insensitive" };
  const categories = await prisma.category.findMany({
    where: { title: text },
    select: { slug: true, title: true },
  });
  const titles = new Map(categories.map((category) => [category.slug, category.title]));
  const slugs = categories.map((category) => category.slug);
  const where = {
    published: true,
    OR: [
      { title: text },
      { excerpt: text },
      { desc: text },
      ...(slugs.length ? [{ catSlug: { in: slugs } }] : []),
    ],
  };

  const total = await prisma.post.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / SEARCH_PAGE_SIZE));
  const page = Math.min(Math.max(requested, 1), pageCount);
  const posts = total
    ? await prisma.post.findMany({
        where,
        orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
        skip: (page - 1) * SEARCH_PAGE_SIZE,
        take: SEARCH_PAGE_SIZE,
        select: {
          title: true,
          excerpt: true,
          desc: true,
          img: true,
          slug: true,
          catSlug: true,
          publishedAt: true,
          createdAt: true,
          user: { select: { name: true, settings: true } },
        },
      })
    : [];

  const missing = [...new Set(posts.map((post) => post.catSlug).filter((slug) => slug && !titles.has(slug)))];
  if (missing.length) {
    const rows = await prisma.category.findMany({
      where: { slug: { in: missing } },
      select: { slug: true, title: true },
    });
    rows.forEach((row) => titles.set(row.slug, row.title));
  }

  return {
    query,
    total,
    page,
    pageSize: SEARCH_PAGE_SIZE,
    posts: posts.map((post) => ({
      title: post.title,
      slug: post.slug,
      img: typeof post.img === "string" ? post.img : "",
      excerpt: post.excerpt?.trim() || plainExcerpt(post.desc, 180),
      catSlug: post.catSlug || "",
      category: titles.get(post.catSlug) || labelFromSlug(post.catSlug),
      author: publicAuthorName(post.user),
      date: post.publishedAt || post.createdAt,
    })),
  };
});
