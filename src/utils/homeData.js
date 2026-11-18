import prisma from "@/utils/connect";

const pad = (items, count) => Array.from({ length: count }, (_, index) => items[index] ?? null);

export function plainExcerpt(html, max = 160) {
  const text = String(html || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max).trim()}...`;
}

export function labelFromSlug(slug) {
  return String(slug || "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

const toCard = (post, titles) => ({
  title: post.title,
  desc: plainExcerpt(post.desc),
  img: typeof post.img === "string" ? post.img : "",
  slug: post.slug,
  catSlug: post.catSlug,
  category: titles.get(post.catSlug) || labelFromSlug(post.catSlug),
});

const emptyColumn = () => ({ title: "", main: null, list: pad([], 3) });

export async function getHomeContent() {
  const empty = {
    featured: { hero: null, leftBottom: pad([], 2), middle: pad([], 3), analysis: null, latest: pad([], 4) },
    sports: { main: null, side: pad([], 2), bottom: pad([], 3) },
    politics: { main: null, list: pad([], 4) },
    business: { main: null, list: pad([], 6) },
    categories: [emptyColumn(), emptyColumn(), emptyColumn(), emptyColumn()],
    trending: pad([], 4),
  };

  try {
    const [posts, categories] = await Promise.all([
      prisma.post.findMany({
        where: { published: true },
        orderBy: { createdAt: "desc" },
        take: 48,
        select: { title: true, desc: true, img: true, slug: true, catSlug: true },
      }),
      prisma.category.findMany({ select: { slug: true, title: true } }),
    ]);

    const titles = new Map(categories.map((category) => [category.slug, category.title]));
    const cards = posts.map((post) => toCard(post, titles));
    const pick = (pattern) => cards.filter((card) => pattern.test(card.catSlug || ""));

    const groups = new Map();
    for (const card of cards) {
      const key = card.catSlug || "other";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(card);
    }
    const columns = [...groups.values()].slice(0, 4).map((items) => ({
      title: items[0].category,
      main: items[0],
      list: pad(items.slice(1), 3),
    }));
    while (columns.length < 4) columns.push(emptyColumn());

    const sports = pick(/credit|card|crypto|insurance/i);
    const politics = pick(/personal|saving|budget/i);
    const business = pick(/invest|real.?estate/i);

    return {
      featured: {
        hero: cards[0] ?? null,
        leftBottom: pad(cards.slice(1), 2),
        middle: pad(cards.slice(3), 3),
        analysis: cards[6] ?? null,
        latest: pad(cards, 4),
      },
      sports: { main: sports[0] ?? null, side: pad(sports.slice(1), 2), bottom: pad(sports.slice(3), 3) },
      politics: { main: politics[0] ?? null, list: pad(politics.slice(1), 4) },
      business: { main: business[0] ?? null, list: pad(business.slice(1), 6) },
      categories: columns,
      trending: pad(cards, 4),
    };
  } catch (err) {
    console.error("Home content failed:", err);
    return empty;
  }
}
