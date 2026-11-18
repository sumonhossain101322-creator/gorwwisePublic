import prisma from "@/utils/connect";
import { labelFromSlug } from "@/utils/homeData";
import { mergeWriteCategories, WRITE_CATEGORY_SLUGS } from "@/utils/writeCategories";
import { publicAuthorName } from "@/utils/userSettings";

const TONE_BY_SLUG = {
  investing: "investing",
  "personal-finance": "personalFinance",
  "credit-cards": "creditCards",
  cryptocurrency: "cryptocurrency",
  crypto: "cryptocurrency",
  "real-estate": "realEstate",
  insurance: "insurance",
};

export function categoryTone(slug) {
  return TONE_BY_SLUG[slug] || "investing";
}

const postSelect = {
  slug: true,
  title: true,
  catSlug: true,
  img: true,
  publishedAt: true,
  createdAt: true,
  user: { select: { name: true, settings: true } },
};

function toMenuPost(post, categoryTitles) {
  if (!post) return null;
  return {
    slug: post.slug,
    title: post.title,
    category: categoryTitles.get(post.catSlug) || labelFromSlug(post.catSlug),
    tone: categoryTone(post.catSlug),
    author: publicAuthorName(post.user),
    img: post.img || "",
    date: post.publishedAt || post.createdAt,
  };
}

function orderCategories(categories, activeSlug) {
  if (!activeSlug || !WRITE_CATEGORY_SLUGS.includes(activeSlug)) {
    return categories.map((item) => ({ ...item, active: false }));
  }
  const current = categories.find((item) => item.slug === activeSlug);
  const rest = categories.filter((item) => item.slug !== activeSlug).map((item) => ({ ...item, active: false }));
  if (!current) return categories.map((item) => ({ ...item, active: false }));
  return [{ ...current, active: true }, ...rest];
}

export async function getSinglePostSidebar(excludeSlug, options = {}) {
  const { authorEmail, catSlug } = options;
  const notCurrent = excludeSlug ? { NOT: { slug: excludeSlug } } : {};
  const publishedWhere = { published: true, status: "PUBLISHED", ...notCurrent };
  const authorPicksWhere = authorEmail
    ? { published: true, userEmail: authorEmail, editorPick: true, ...notCurrent }
    : null;

  try {
    const [categoryRows, popularInCat, editorPickRows] = await Promise.all([
      prisma.category.findMany({ select: { slug: true, title: true } }),
      catSlug
        ? prisma.post.findMany({
            where: { ...publishedWhere, catSlug },
            orderBy: { views: "desc" },
            take: 4,
            select: postSelect,
          })
        : Promise.resolve([]),
      authorPicksWhere
        ? prisma.post.findMany({
            where: authorPicksWhere,
            orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
            take: 4,
            select: postSelect,
          })
        : Promise.resolve([]),
    ]);

    let popularRows = popularInCat;
    if (popularRows.length < 4) {
      const exclude = new Set([
        excludeSlug,
        ...popularRows.map((row) => row.slug),
      ].filter(Boolean));
      const backfill = await prisma.post.findMany({
        where: {
          ...publishedWhere,
          ...(exclude.size ? { slug: { notIn: [...exclude] } } : {}),
        },
        orderBy: { views: "desc" },
        take: 4 - popularRows.length,
        select: postSelect,
      });
      popularRows = [...popularRows, ...backfill];
    }

    // Editor's Pick: only posts the author starred (no site-wide fallback on article pages).
    let featuredRows = editorPickRows;
    if (featuredRows.length === 0 && !authorEmail) {
      featuredRows = await prisma.post.findMany({
        where: { ...publishedWhere, img: { not: null } },
        orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
        take: 4,
        select: postSelect,
      });
    }

    const titles = new Map(categoryRows.map((row) => [row.slug, row.title]));
    const categories = orderCategories(mergeWriteCategories(categoryRows), catSlug);

    return {
      popular: popularRows.map((post) => toMenuPost(post, titles)),
      featured: featuredRows.map((post) => toMenuPost(post, titles)),
      categories,
    };
  } catch (error) {
    console.error("Single post sidebar failed:", error?.message || error);
    return {
      popular: [],
      featured: [],
      categories: orderCategories(mergeWriteCategories(), catSlug),
    };
  }
}