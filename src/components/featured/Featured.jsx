
import { Fragment } from "react";
import styles from "./featured.module.css";
import Link from "next/link";
import { Cover, SkeletonText, padSlots } from "@/components/skeleton/Skeleton";

/* ==========================================================================
   SUBCOMPONENTS
   Each article has exactly ONE <Link>, wrapping its heading. The link is
   stretched over the whole card (.cardLink::after), so image and card are
   still clickable without nesting or duplicating interactive elements.
   Images are decorative (alt="") because the heading already names the story.
   ========================================================================== */

function HeroPost({ post }) {
  if (!post) {
    return (
      <article className={styles.hero} aria-hidden="true">
        <div className={styles.heroImgWrapper}>
          <Cover src="" />
        </div>
        <div className={styles.heroContent}>
          <SkeletonText lines={3} title />
        </div>
      </article>
    );
  }
  return (
    <article className={styles.hero}>
      <div className={styles.heroImgWrapper}>
        <Cover
          src={post.img}
          alt={post.title || ""}
          className={styles.heroImg}
          sizes="(max-width: 900px) 100vw, 40vw"
          priority
        />
      </div>

      <div className={styles.heroContent}>
        <Link href={`/posts/${post.slug}`} className={styles.cardLink}>
          <h2 className={styles.heroTitle}>{post.title}</h2>
        </Link>
        {post.desc ? <p className={styles.heroDesc}>{post.desc}</p> : <SkeletonText lines={2} />}
        <span className={styles.readMore} aria-hidden="true">
          READ MORE
        </span>
      </div>
    </article>
  );

}
function SmallPost({ post }) {
  if (!post) {
    return (
      <article className={styles.smallPost} aria-hidden="true">
        <div className={styles.smallPostText}>
          <SkeletonText lines={2} title />
        </div>
        <div className={styles.smallPostImg}>
          <Cover src="" />
        </div>
      </article>
    );
  }
  return (
    <article className={styles.smallPost}>
      <div className={styles.smallPostText}>
        <Link href={`/posts/${post.slug}`} className={styles.cardLink}>
          <h3 className={styles.smallPostTitle}>{post.title}</h3>
        </Link>
        {post.desc ? <p className={styles.smallPostDesc}>{post.desc}</p> : null}
      </div>
      <div className={styles.smallPostImg}>
        <Cover src={post.img} className={styles.thumbImg} sizes="120px" />
      </div>
    </article>
  );

}
function MiddleCard({ post }) {
  if (!post) {
    return (
      <article className={styles.middleCard} aria-hidden="true">
        <div className={styles.middleImgWrapper}>
          <Cover src="" />
        </div>
        <SkeletonText lines={2} title />
      </article>
    );
  }
  return (
    <article className={styles.middleCard}>
      <div className={styles.middleImgWrapper}>
        <Cover src={post.img} className={styles.middleImg} sizes="(max-width: 900px) 100vw, 30vw" />
      </div>
      <div className={styles.middleCardContent}>
        <Link href={`/posts/${post.slug}`} className={styles.cardLink}>
          <h3 className={styles.middleTitle}>{post.title}</h3>
        </Link>
        {post.desc ? <p className={styles.middleDesc}>{post.desc}</p> : null}
      </div>
    </article>
  );

}
function TextOnlyPost({ post }) {
  if (!post) {
    return (
      <article className={styles.textOnly} aria-hidden="true">
        <SkeletonText lines={2} title />
      </article>
    );
  }
  return (
    <article className={styles.textOnly}>
      <Link href={`/posts/${post.slug}`} className={styles.cardLink}>
        <h3 className={styles.textOnlyTitle}>{post.title}</h3>
      </Link>
    </article>
  );

}
/* The analysis card shows only an image, so its heading is visually hidden
   (still read by assistive tech) to give the single link an accessible name. */
function AnalysisPost({ post }) {
  if (!post) {
    return (
      <article className={styles.analysisCard} aria-hidden="true">
        <div className={styles.analysisImgWrapper}>
          <Cover src="" />
        </div>
      </article>
    );
  }
  return (
    <article className={styles.analysisCard}>
      <Link href={`/posts/${post.slug}`} className={styles.cardLink}>
        <h3 className={styles.srOnly}>{post.title}</h3>
      </Link>
      <div className={styles.analysisImgWrapper}>
        <Cover src={post.img} className={styles.analysisImg} sizes="(max-width: 900px) 100vw, 30vw" />
      </div>
    </article>
  );

}
function LatestItem({ post }) {
  if (!post) {
    return (
      <article className={styles.latestItem} aria-hidden="true">
        <div className={styles.latestText}>
          <SkeletonText lines={2} title />
        </div>
        <div className={styles.latestImg}>
          <Cover src="" />
        </div>
      </article>
    );
  }
  return (
    <article className={styles.latestItem}>
      <div className={styles.latestText}>
        <Link href={`/posts/${post.slug}`} className={styles.cardLink}>
          <h4 className={styles.latestTitle}>{post.title}</h4>
        </Link>
      </div>
      <div className={styles.latestImg}>
        <Cover src={post.img} className={styles.thumbImg} sizes="(min-width: 1200px) 320px, 90px" />
      </div>
    </article>
  );

}
function SectionHeader({ label }) {
  return (
    <div className={styles.sectionHeader}>
      <span className={styles.dot} aria-hidden="true"></span>
      <span className={styles.sectionLabel}>{label}</span>
      <div className={styles.sectionLine}></div>
    </div>
  );

}
const AD_VARIANT_CLASS = {
  inline: styles.adInline,
  native: styles.adNative,
  sidebar: styles.adSidebar,
};

/* device: "desktop" -> hidden at <=900px, "mobile" -> shown only at <=900px */
function AdSlot({ variant = "inline", device }) {
  const deviceClass =
    device === "mobile"
      ? styles.mobileOnly
      : device === "desktop"
        ? styles.desktopOnly
        : "";
  const className = [styles.adSlot, AD_VARIANT_CLASS[variant], deviceClass]
    .filter(Boolean)
    .join(" ");

  return (
    <aside role="complementary" aria-label="Advertisement" className={className}>
      <span className={styles.adLabel}>SPONSORED</span>
      <div className={styles.adBody}>placeholder</div>
    </aside>
  );

}
/* ==========================================================================
   MAIN COMPONENT
   ========================================================================== */
const Featured = ({ hero = null, leftBottom = [], middle = [], analysis = null, latest = [] }) => {
  const leftSlots = padSlots(leftBottom, 2);
  const middleSlots = padSlots(middle, 3);
  const latestSlots = padSlots(latest, 4);

  return (
    <section className={styles.container} aria-label="Featured stories">
      {/* ========== LEFT COLUMN ========== */}
      <div className={styles.column}>
        <HeroPost post={hero} />

        {/* Desktop: native ad between hero and left-bottom posts */}
        <AdSlot variant="native" device="desktop" />
        {/* <=900px: the single inline ad, right after the hero */}
        <AdSlot variant="inline" device="mobile" />

        <div className={styles.leftBottom}>
          {leftSlots.map((post, index) => (
            <SmallPost key={post?.slug || `left-${index}`} post={post} />
          ))}
        </div>
      </div>

      {/* ========== MIDDLE COLUMN ========== */}
      <div className={styles.column}>
        {middleSlots.map((post, i) => (
          <Fragment key={post?.slug || `middle-${i}`}>
            {i === 0 ? (
              <MiddleCard post={post} />
            ) : (
              <TextOnlyPost post={post} />
            )}
            {/* Inline ad after the first middle card */}
            {i === 0 && <AdSlot variant="inline" device="desktop" />}
          </Fragment>
        ))}

        <SectionHeader label="ANALYSIS" />
        <AnalysisPost post={analysis} />
      </div>

      {/* ========== RIGHT COLUMN ========== */}
      <div className={styles.column}>
        <SectionHeader label="LATEST" />

        <div className={styles.latestList}>
          {latestSlots.map((post, index) => (
            <LatestItem key={post?.slug || `latest-${index}`} post={post} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Featured;