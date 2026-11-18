import { cache } from "react";
import JsonLd from "@/components/seo/JsonLd";
import { labelFromSlug, plainExcerpt } from "@/utils/homeData";
import { absoluteUrl } from "@/utils/site";
import { WRITE_CATEGORY_LABELS, WRITE_CATEGORY_SLUGS } from "@/utils/writeCategories";
import { publicAuthorName } from "@/utils/userSettings";
import prisma from "@/utils/connect";
import AdSlot from "@/components/ads/AdSlot";
import Image from "next/image";
import Link from "next/link";
import styles from "./category.module.css";

const DEKS = {
  investing: "Markets, funds, and long-term strategy for readers in the US and Europe.",
  "personal-finance": "Savings, budgets, and everyday money decisions that compound over time.",
  "credit-cards": "Rewards, fees, and the cards worth carrying on either side of the Atlantic.",
  cryptocurrency: "A clear look at digital assets, risk, and where they fit in a real portfolio.",
  "real-estate": "Housing markets, mortgages, and what buyers and owners should watch.",
  insurance: "Coverage, claims, and the policies that actually protect your money.",
};

const categoryName = cache(async (slug) => {
  if (!slug) return "Finance";
  const row = await prisma.category.findUnique({ where: { slug }, select: { title: true } });
  return row?.title || WRITE_CATEGORY_LABELS[slug] || labelFromSlug(slug);
});

async function loadPosts(slug) {
  const posts = await prisma.post.findMany({
    where: {
      published: true,
      ...(slug ? { catSlug: slug } : {}),
    },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: 13,
    select: {
      title: true,
      slug: true,
      img: true,
      excerpt: true,
      desc: true,
      catSlug: true,
      publishedAt: true,
      createdAt: true,
      user: { select: { name: true, settings: true } },
    },
  });

  return posts.map((post) => ({
    title: post.title,
    slug: post.slug,
    img: typeof post.img === "string" ? post.img : "",
    excerpt: post.excerpt?.trim() || plainExcerpt(post.desc, 160),
    category: WRITE_CATEGORY_LABELS[post.catSlug] || labelFromSlug(post.catSlug),
    author: publicAuthorName(post.user),
    date: post.publishedAt || post.createdAt,
  }));
}

const formatDate = (value) => {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
};

export async function generateMetadata({ searchParams }) {
  const name = await categoryName(searchParams?.cat || "");
  const description = DEKS[searchParams?.cat] || `Read ${name} stories on GrowWise.`;
  return {
    title: `${name} | GrowWise`,
    description,
    openGraph: { title: name, description, type: "website" },
  };
}

function StoryCard({ post }) {
  return (
    <article className={styles.card}>
      {post.img ? (
        <Link href={`/posts/${post.slug}`} className={styles.cardMedia}>
          <Image src={post.img} alt="" fill sizes="(max-width: 700px) 100vw, 30vw" />
        </Link>
      ) : null}
      <StoryMeta post={post} />
      <h3 className={styles.cardTitle}>
        <Link href={`/posts/${post.slug}`}>{post.title}</Link>
      </h3>
      {post.excerpt ? <p className={styles.cardExcerpt}>{post.excerpt}</p> : null}
    </article>
  );
}

function StoryMeta({ post }) {
  return (
    <p className={styles.meta}>
      <span>{post.category}</span>
      <span aria-hidden="true">·</span>
      <span>{post.author}</span>
      {post.date ? (
        <>
          <span aria-hidden="true">·</span>
          <time dateTime={new Date(post.date).toISOString()}>{formatDate(post.date)}</time>
        </>
      ) : null}
    </p>
  );
}

export default async function CategoryPage({ searchParams }) {
  const slug = searchParams?.cat || "";
  const name = await categoryName(slug);
  const posts = await loadPosts(slug);
  const [hero, ...rest] = posts;
  const side = rest.slice(0, 2);
  const grid = rest.slice(2);
  const categoryUrl = absoluteUrl(slug ? `/category?cat=${encodeURIComponent(slug)}` : "/category");
  const dek = DEKS[slug] || "Guides and reporting on money, markets, and the decisions that shape a financial life.";

  return (
    <div className={styles.page}>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
            { "@type": "ListItem", position: 2, name, item: categoryUrl },
          ],
        }}
      />

      <header className={styles.intro}>
        <div className={styles.introMain}>
          <nav className={styles.crumbs} aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span aria-hidden="true">/</span>
            <span>{name}</span>
          </nav>
          <p className={styles.kicker}>GrowWise</p>
          <h1 className={styles.heading}>{name}</h1>
        </div>
        <p className={styles.dek}>{dek}</p>
        <nav className={styles.topics} aria-label="Finance topics">
          <Link href="/category" className={!slug ? styles.topicActive : styles.topic}>
            All
          </Link>
          {WRITE_CATEGORY_SLUGS.map((topic) => (
            <Link
              key={topic}
              href={`/category?cat=${topic}`}
              className={topic === slug ? styles.topicActive : styles.topic}
            >
              {WRITE_CATEGORY_LABELS[topic]}
            </Link>
          ))}
        </nav>
      </header>

      {posts.length === 0 ? (
        <p className={styles.empty}>No published stories in this topic yet.</p>
      ) : (
        <>
          <section className={styles.feature} aria-label="Featured stories">
            <article className={styles.hero}>
              {hero.img ? (
                <Link href={`/posts/${hero.slug}`} className={styles.heroMedia}>
                  <Image src={hero.img} alt={hero.title} fill priority sizes="(max-width: 900px) 100vw, 62vw" />
                </Link>
              ) : (
                <div className={styles.heroMedia} />
              )}
              <div className={styles.heroCopy}>
                <StoryMeta post={hero} />
                <h2 className={styles.heroTitle}>
                  <Link href={`/posts/${hero.slug}`}>{hero.title}</Link>
                </h2>
                {hero.excerpt ? <p className={styles.heroExcerpt}>{hero.excerpt}</p> : null}
              </div>
            </article>

            {side.length > 0 ? (
              <div className={styles.side}>
                {side.map((post) => (
                  <article key={post.slug} className={styles.sideCard}>
                    {post.img ? (
                      <Link href={`/posts/${post.slug}`} className={styles.sideMedia}>
                        <Image src={post.img} alt="" fill sizes="280px" />
                      </Link>
                    ) : null}
                    <div className={styles.sideCopy}>
                      <StoryMeta post={post} />
                      <h2 className={styles.sideTitle}>
                        <Link href={`/posts/${post.slug}`}>{post.title}</Link>
                      </h2>
                    </div>
                  </article>
                ))}
              </div>
            ) : null}
          </section>

          <div className={styles.adBreak}>
            <AdSlot size="leaderboard" slotKey="leaderboard" />
          </div>

          {grid.length > 0 ? (
            <section className={styles.latest} aria-labelledby="latest-heading">
              <div className={styles.latestHead}>
                <h2 id="latest-heading">Latest in {name}</h2>
              </div>
              <div className={styles.grid}>
                {grid.slice(0, 3).map((post) => (
                  <StoryCard key={post.slug} post={post} />
                ))}
                {grid.length > 3 ? (
                  <div className={styles.adSpan}>
                    <AdSlot size="leaderboard" slotKey="inFeed" />
                  </div>
                ) : null}
                {grid.slice(3).map((post) => (
                  <StoryCard key={post.slug} post={post} />
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
