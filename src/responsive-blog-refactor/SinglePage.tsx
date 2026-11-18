import type { Metadata } from "next";
import Image from "next/image";
import DOMPurify from "isomorphic-dompurify";
import Menu from "@/components/Menu/Menu";
import AuthorCard from "@/components/AuthorCard/AuthorCard";
import ShareBar from "@/components/ShareBar/ShareBar";
import ReadingProgress from "@/components/ReadingProgress/ReadingProgress";
import BackToTop from "@/components/BackToTop/BackToTop";
import JsonLd from "@/components/JsonLd/JsonLd";
import TableOfContents from "./components/TableOfContents/TableOfContents";
import CommentsLoader from "./components/CommentsLoader";
import { buildArticleJsonLd, buildBreadcrumbJsonLd, estimateReadTime, stripHtml } from "@/lib/seo";
import styles from "./singlePage.module.css";
import { DUMMY_POST } from "./financeDummyPost";

/**
 * Blog post data contract. Replace DUMMY_POST with Prisma getPostBySlug(slug).
 * `desc` must be HTML produced by a trusted CMS/editor and is sanitized below.
 */
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://example.com").replace(/\/$/, "");
const canonical = `${siteUrl}/blog/${DUMMY_POST.slug}`;
const plainDescription = stripHtml(DUMMY_POST.description).slice(0, 155);

export async function generateMetadata(): Promise<Metadata> {
  const absoluteImage = new URL(DUMMY_POST.img, siteUrl).toString();
  return {
    title: DUMMY_POST.title,
    description: plainDescription,
    keywords: DUMMY_POST.keywords,
    alternates: { canonical },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
    authors: [{ name: DUMMY_POST.author.name }],
    openGraph: {
      type: "article",
      url: canonical,
      title: DUMMY_POST.title,
      description: plainDescription,
      siteName: "GrowWise",
      images: [{ url: absoluteImage, width: 1200, height: 630, alt: DUMMY_POST.imgAlt || DUMMY_POST.title }],
      publishedTime: DUMMY_POST.datePublished,
      modifiedTime: DUMMY_POST.dateModified,
      authors: [DUMMY_POST.author.name],
      section: DUMMY_POST.category,
    },
    twitter: { card: "summary_large_image", title: DUMMY_POST.title, description: plainDescription, images: [absoluteImage] },
  };
}

function getTableOfContents(html: string) {
  const headings: { id: string; text: string; level: 2 | 3 }[] = [];
  const matches = html.matchAll(/<h([23])(?:\s[^>]*)?>([\s\S]*?)<\/h\1>/gi);
  for (const match of matches) {
    const text = stripHtml(match[2]).trim();
    if (!text) continue;
    const id = text.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-");
    headings.push({ id, text, level: Number(match[1]) as 2 | 3 });
  }
  return headings;
}

export default function SinglePage() {
  const data = DUMMY_POST;
  const readTime = estimateReadTime(data.desc);
  const toc = getTableOfContents(data.desc);

  // Server-side sanitization: never pass CMS HTML directly to dangerouslySetInnerHTML.
  // Install `isomorphic-dompurify` and keep this import on the server component path.
  const sanitizedHtml = DOMPurify.sanitize(data.desc, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ["data-columns", "colspan", "rowspan", "loading"],
  });
  // Assign stable, matching IDs for TOC anchors, including duplicate headings.
  const usedIds = new Map<string, number>();
  const htmlWithHeadingIds = sanitizedHtml.replace(/<h([23])([^>]*)>([\s\S]*?)<\/h\1>/gi, (_match, level, attrs, inner) => {
    const headingText = stripHtml(inner).trim();
    const base = headingText.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-") || "section";
    const count = usedIds.get(base) || 0;
    usedIds.set(base, count + 1);
    const id = count ? `${base}-${count + 1}` : base;
    return `<h${level}${attrs} id="${id}">${inner}</h${level}>`;
  });
  const safeHtml = htmlWithHeadingIds.replace(/<table(\s[^>]*)?>/gi, '<div class="articleTableScroll" role="region" aria-label="Scrollable data table" tabindex="0"><table$1>')
    .replace(/<\/table>/gi, "</table></div>");

  const articleJsonLd = buildArticleJsonLd({
    title: data.title, description: plainDescription, image: new URL(data.img, siteUrl).toString(),
    datePublished: data.datePublished, dateModified: data.dateModified, author: data.author.name,
    publisher: "GrowWise", publisherLogo: new URL("/logo.png", siteUrl).toString(),
    canonical, section: data.category, wordCount: stripHtml(data.desc).split(/\s+/).filter(Boolean).length,
  });
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Home", url: siteUrl }, { name: data.category, url: `${siteUrl}/category/${encodeURIComponent(data.category.toLowerCase())}` },
    { name: data.title, url: canonical },
  ]);

  return (
    <div className={styles.container}>
      <JsonLd data={[articleJsonLd, breadcrumbJsonLd]} />
      <ReadingProgress />
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <ol>
          <li><a href="/">Home</a></li><li aria-hidden="true">/</li>
          <li><a href={`/category/${encodeURIComponent(data.category.toLowerCase())}`}>{data.category}</a></li>
          <li aria-hidden="true">/</li><li aria-current="page">{data.title}</li>
        </ol>
      </nav>

      <header className={styles.hero}>
        <Image src={data.img} alt={data.imgAlt || data.title} fill priority sizes="100vw" className={styles.heroImage} />
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <span className={styles.category}><span className={styles.categoryDot} aria-hidden="true" />{data.category}</span>
          <h1 className={styles.title}>{data.title}</h1>
          <div className={styles.user}>
            {data.user.image && <span className={styles.userImageContainer}>
              <Image src={data.user.image} alt="" fill sizes="40px" className={styles.avatar} />
            </span>}
            <span className={styles.username}>by {data.user.name}</span>
            <span className={styles.separator} aria-hidden="true" />
            <time className={styles.meta} dateTime={data.datePublished}>{new Date(data.datePublished).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</time>
            <span className={styles.separator} aria-hidden="true" />
            <span className={styles.meta}>{readTime} min read</span>
          </div>
        </div>
      </header>

      <div className={styles.content}>
        <main className={styles.post}>
          <article className={styles.article} aria-label={data.title}>
            <div className={styles.articleMeta}>
              <span>Updated <time dateTime={data.dateModified}>{new Date(data.dateModified).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</time></span>
              <ShareBar title={data.title} />
            </div>
            <div className={styles.articleLayout}>
              <TableOfContents items={toc.map((item) => ({ ...item, id: item.id }))} />
              <div className={styles.description} dangerouslySetInnerHTML={{ __html: safeHtml }} />
            </div>
          </article>

          <AuthorCard author={data.author} />
          <section className={styles.comment} aria-labelledby="comments-heading">
            <h2 id="comments-heading" className={styles.commentsTitle}>Comments</h2>
            <CommentsLoader postSlug={data.slug} />
          </section>
        </main>

        <aside className={styles.sidebar} aria-label="More articles and navigation"><Menu /></aside>
      </div>
      <BackToTop />
    </div>
  );
}
