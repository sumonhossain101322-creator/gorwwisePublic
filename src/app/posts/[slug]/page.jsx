import Menu from "@/components/Menu/Menu";
import Comments from "@/components/comments/Comments";
import { getPublishedPost } from "@/utils/getPost";
import { getSinglePostSidebar } from "@/utils/singlePostData";
import prisma from "@/utils/connect";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import SidebarAside from "./SidebarAside";
import ArticleWithAds from "@/components/ads/ArticleWithAds";
import AdSlot from "@/components/ads/AdSlot";
import JsonLd from "@/components/seo/JsonLd";
import { cleanHtml } from "@/utils/cleanHtml";
import { plainExcerpt } from "@/utils/homeData";
import { absoluteUrl } from "@/utils/site";
import styles from "./singlePage.module.css";

export const dynamic = "force-dynamic";

const readTimeLabel = (html) => {
  const words = html.replace(/<[^>]*>/g, " ").trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 220));
  return `${minutes} min read`;
};

const formatDate = (value) =>
  new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" }).format(value);

export async function generateMetadata({ params }) {
  const post = await getPublishedPost(params.slug);
  if (!post) return { title: "Post" };

  const description = plainExcerpt(post.desc, 160);
  const url = absoluteUrl(`/posts/${post.slug}`);
  const image = post.img ? absoluteUrl(post.img) : undefined;
  const authorName = post.user?.name?.trim() || "GrowWise";

  return {
    title: post.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: post.title,
      description,
      url,
      publishedTime: (post.publishedAt || post.createdAt)?.toISOString?.(),
      authors: [authorName],
      images: image ? [{ url: image, alt: post.title }] : [],
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: post.title,
      description,
      images: image ? [image] : [],
    },
  };
}

const SinglePage = async ({ params }) => {
  const post = await getPublishedPost(params.slug);
  if (!post) notFound();

  const sidebar = await getSinglePostSidebar(params.slug, {
    authorEmail: post.userEmail || post.user?.email,
    catSlug: post.catSlug,
  });

  await prisma.post.update({
    where: { slug: post.slug },
    data: { views: { increment: 1 } },
  });

  const authorName = post.user?.name?.trim() || "Author";
  const publishedOn = post.publishedAt || post.createdAt;
  const categoryTitle = post.categoryTitle;
  const categoryHref = `/category?cat=${encodeURIComponent(post.catSlug)}`;
  const canonical = absoluteUrl(`/posts/${post.slug}`);
  const image = post.img ? absoluteUrl(post.img) : undefined;
  const description = plainExcerpt(post.desc, 160);
  const bodyHtml = cleanHtml(post.desc || "");

  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description,
      image: image ? [image] : undefined,
      datePublished: publishedOn?.toISOString?.(),
      dateModified: post.updatedAt?.toISOString?.() || publishedOn?.toISOString?.(),
      author: { "@type": "Person", name: authorName },
      publisher: { "@type": "Organization", name: "GrowWise", url: absoluteUrl("/") },
      mainEntityOfPage: canonical,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
        { "@type": "ListItem", position: 2, name: categoryTitle, item: absoluteUrl(categoryHref) },
        { "@type": "ListItem", position: 3, name: post.title, item: canonical },
      ],
    },
  ];

  return (
    <article className={styles.container}>
      <JsonLd data={structuredData} />
      <nav className={styles.crumbs} aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <Link href={categoryHref}>{categoryTitle}</Link>
        <span aria-hidden="true">/</span>
        <span>{post.title}</span>
      </nav>
      <header className={styles.hero}>
        {post.img && (
          <Image
            src={post.img}
            alt={post.title}
            fill
            priority
            className={styles.heroImage}
          />
        )}
        <div className={styles.heroOverlay} />

        <div className={styles.heroContent}>
          <Link href={categoryHref} className={styles.category}>
            <span className={styles.categoryDot} />
            {categoryTitle}
          </Link>

          <h1 className={styles.title}>{post.title}</h1>

          <div className={styles.user}>
            {post.user?.image && (
              <div className={styles.userImageContainer}>
                <Image
                  src={post.user.image}
                  alt=""
                  fill
                  className={styles.avatar}
                />
              </div>
            )}
            <span className={styles.username}>by {authorName}</span>
            <span className={styles.separator} aria-hidden="true" />
            <time className={styles.meta} dateTime={publishedOn?.toISOString?.()}>
              {formatDate(publishedOn)}
            </time>
            <span className={styles.separator} aria-hidden="true" />
            <span className={styles.meta}>{readTimeLabel(post.desc)}</span>
          </div>
        </div>
      </header>

      <div className={styles.content}>
        <main className={styles.post}>
          <AdSlot size="leaderboard" slotKey="leaderboard" />
          <ArticleWithAds
            html={bodyHtml}
            className={styles.description}
            leadClassName={styles.lead}
          />
          <AdSlot size="leaderboard" slotKey="leaderboard" />
          <section className={styles.author}>
            {post.user?.image && (
              <div className={styles.authorImageContainer}>
                <Image
                  src={post.user.image}
                  alt={authorName}
                  fill
                  className={styles.authorImage}
                />
              </div>
            )}
            <div className={styles.authorBody}>
              <div className={styles.authorHeader}>
                <h3 className={styles.authorName}>{authorName}</h3>
                <Link href={categoryHref} className={styles.authorLink}>
                  More in {categoryTitle}
                </Link>
              </div>
              {post.user?.jobTitle ? (
                <p className={styles.authorRole}>{post.user.jobTitle}</p>
              ) : null}
              {post.user?.bio?.trim() ? (
                <p className={styles.authorBio}>{post.user.bio.trim()}</p>
              ) : (
                <p className={styles.authorBioMuted}>This author has not added a bio yet.</p>
              )}
            </div>
          </section>
          <div className={styles.comment}>
            <Comments postSlug={post.slug} />
          </div>
        </main>

        <aside className={styles.sidebar}>
          <SidebarAside>
            <Menu
              popular={sidebar.popular}
              featured={sidebar.featured}
              categories={sidebar.categories}
              editorsPickCaption={authorName}
              showTopicsForArticle
            />
          </SidebarAside>
        </aside>
      </div>
    </article>
  );
};

export default SinglePage;