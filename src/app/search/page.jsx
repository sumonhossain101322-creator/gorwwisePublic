import AdSlot from "@/components/ads/AdSlot";
import JsonLd from "@/components/seo/JsonLd";
import { ADS } from "@/config/ads";
import { absoluteUrl } from "@/utils/site";
import { searchPublishedPosts } from "@/utils/searchPosts";
import { WRITE_CATEGORY_LABELS, WRITE_CATEGORY_SLUGS } from "@/utils/writeCategories";
import Image from "next/image";
import Link from "next/link";
import styles from "./search.module.css";

export const dynamic = "force-dynamic";

const TOPICS = WRITE_CATEGORY_SLUGS.map((slug) => ({
  slug,
  label: WRITE_CATEGORY_LABELS[slug],
}));

const formatDate = (value) => {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
};

const pageNumber = (value) => {
  const page = Number.parseInt(String(value || "1"), 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
};

const searchPath = (query, page) => {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/search?${qs}` : "/search";
};

function Highlight({ text, query }) {
  if (!text) return null;
  if (!query) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const wholeWord = /^[\p{L}\p{N}\s]+$/u.test(query);
  const parts = String(text).split(new RegExp(`(${wholeWord ? `\\b${escaped}\\b` : escaped})`, "ig"));
  const needle = query.toLowerCase();
  return parts.map((part, index) =>
    part.toLowerCase() === needle ? (
      <mark key={index} className={styles.mark}>
        {part}
      </mark>
    ) : (
      part
    ),
  );
}

function TopicRow() {
  return (
    <div className={styles.topics}>
      <p>Browse a topic</p>
      <ul>
        {TOPICS.map((topic) => (
          <li key={topic.slug}>
            <Link href={`/category?cat=${topic.slug}`}>{topic.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export async function generateMetadata({ searchParams }) {
  const q = String(searchParams?.q || "").trim().slice(0, 80);
  const requested = pageNumber(searchParams?.page);
  const title = q ? `“${q}” search results | GrowWise` : "Search articles | GrowWise";
  let description = q
    ? `Published GrowWise articles matching “${q}” on investing, credit, savings, and markets.`
    : "Search GrowWise for published guides on investing, credit cards, savings, and cryptocurrency.";

  if (q.length >= 2) {
    const { total } = await searchPublishedPosts(q, requested);
    description = total
      ? `${total} published GrowWise ${total === 1 ? "article" : "articles"} matching “${q}”.`
      : `No published GrowWise articles matched “${q}”. Browse investing, credit, and savings guides.`;
  }

  const { page } = q.length >= 2 ? await searchPublishedPosts(q, requested) : { page: 1 };
  const url = absoluteUrl(searchPath(q, page));

  return {
    title,
    description,
    robots: { index: false, follow: true },
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "website", siteName: "GrowWise" },
    twitter: { card: "summary", title, description },
  };
}

export default async function SearchPage({ searchParams }) {
  const q = String(searchParams?.q || "").trim().slice(0, 80);
  const requested = pageNumber(searchParams?.page);
  const ready = q.length >= 2;
  const { posts, total, page } = ready
    ? await searchPublishedPosts(q, requested)
    : { posts: [], total: 0, page: 1 };
  const pageCount = Math.max(1, Math.ceil(total / 10));
  const start = total ? (page - 1) * 10 + 1 : 0;
  const end = total ? start + posts.length - 1 : 0;
  const showFeedAd = posts.length >= 6;
  const url = absoluteUrl(searchPath(q, page));

  const crumbs = [
    { name: "Home", item: absoluteUrl("/") },
    { name: "Search", item: absoluteUrl("/search") },
  ];
  if (q) crumbs.push({ name: q, item: url });

  const itemList = posts.length
    ? {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: `Search results for ${q}`,
        numberOfItems: total,
        itemListElement: posts.map((post, index) => ({
          "@type": "ListItem",
          position: start + index,
          url: absoluteUrl(`/posts/${post.slug}`),
          name: post.title,
        })),
      }
    : null;

  return (
    <main className={styles.page}>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: crumbs.map((crumb, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: crumb.name,
            item: crumb.item,
          })),
        }}
      />
      {itemList ? <JsonLd data={itemList} /> : null}

      <header className={styles.header}>
        <nav className={styles.crumbs} aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span aria-hidden="true">/</span>
          {q ? <Link href="/search">Search</Link> : <span>Search</span>}
          {q ? (
            <>
              <span aria-hidden="true">/</span>
              <span>{q}</span>
            </>
          ) : null}
        </nav>
        <p className={styles.kicker}>Search</p>
        <h1 id="search-heading">{q ? `Results for “${q}”` : "Search GrowWise"}</h1>
        <p className={styles.dek}>
          {q
            ? "Published articles on investing, credit, savings, and markets."
            : "Find a guide by title, topic, or a phrase from the article."}
        </p>

        <form className={styles.form} action="/search" method="get" role="search">
          <label htmlFor="search-q" className={styles.label}>
            Search articles
          </label>
          <div className={styles.field}>
            <input
              id="search-q"
              name="q"
              type="search"
              defaultValue={q}
              minLength={2}
              maxLength={80}
              required
              placeholder='Try “credit score” or “index funds”'
              autoComplete="off"
            />
            <button type="submit">Search</button>
          </div>
        </form>
      </header>

      <div className={styles.layout}>
        <section className={styles.results} aria-labelledby="search-heading">
          {ready ? (
            <p className={styles.count}>
              {total
                ? `${start}–${end} of ${total} ${total === 1 ? "article" : "articles"}`
                : "No published articles matched that search."}
            </p>
          ) : (
            <p className={styles.count}>Type at least 2 characters.</p>
          )}

          {!ready || total === 0 ? <TopicRow /> : null}

          {posts.length ? (
            <ol className={styles.list} start={start}>
              {posts.map((post, index) => (
                <li key={post.slug} className={styles.item}>
                  <article className={styles.card}>
                    {post.img ? (
                      <Link href={`/posts/${post.slug}`} className={styles.thumb}>
                        <Image src={post.img} alt={post.title} fill sizes="(max-width: 700px) 96px, 168px" />
                      </Link>
                    ) : (
                      <span className={styles.thumbFallback} aria-hidden="true" />
                    )}
                    <div className={styles.body}>
                      <p className={styles.meta}>
                        {post.catSlug ? (
                          <Link href={`/category?cat=${post.catSlug}`}>{post.category}</Link>
                        ) : (
                          <span>{post.category}</span>
                        )}
                        <span aria-hidden="true">·</span>
                        <span>{post.author}</span>
                        {post.date ? (
                          <>
                            <span aria-hidden="true">·</span>
                            <time dateTime={new Date(post.date).toISOString()}>{formatDate(post.date)}</time>
                          </>
                        ) : null}
                      </p>
                      <h2 className={styles.cardTitle}>
                        <Link href={`/posts/${post.slug}`}>
                          <Highlight text={post.title} query={q} />
                        </Link>
                      </h2>
                      {post.excerpt ? (
                        <p className={styles.excerpt}>
                          <Highlight text={post.excerpt} query={q} />
                        </p>
                      ) : null}
                    </div>
                  </article>
                  {showFeedAd && index === 3 ? (
                    <div className={styles.feedAd}>
                      <AdSlot size="leaderboard" slotKey="inFeed" />
                    </div>
                  ) : null}
                </li>
              ))}
            </ol>
          ) : null}

          {pageCount > 1 ? (
            <nav className={styles.pager} aria-label="Search result pages">
              {page > 1 ? (
                <Link href={searchPath(q, page - 1)} rel="prev">
                  Previous
                </Link>
              ) : (
                <span className={styles.pagerDisabled}>Previous</span>
              )}
              <span>
                Page {page} of {pageCount}
              </span>
              {page < pageCount ? (
                <Link href={searchPath(q, page + 1)} rel="next">
                  Next
                </Link>
              ) : (
                <span className={styles.pagerDisabled}>Next</span>
              )}
            </nav>
          ) : null}
        </section>

        {ADS.SHOW_ADS ? (
          <aside className={styles.rail}>
            <AdSlot size="rectangle" slotKey="rectangle" sticky />
          </aside>
        ) : null}
      </div>
    </main>
  );
}
