
import { Fragment } from "react";
import styles from "./politicsBusiness.module.css";
import Link from "next/link";
import { Cover, SkeletonText, padSlots } from "@/components/skeleton/Skeleton";

/* ==========================================================================
   SUBCOMPONENTS
   One <Link> per article, wrapping the heading and stretched over the card
   (.cardLink::after). Images are decorative (alt="") since the heading names
   the story. Heading levels: section label = h2, every story heading = h3.
   ========================================================================== */

function SectionHeader({ label }) {
  return (
    <div className={styles.sectionHeader}>
      <span className={styles.dot} aria-hidden="true"></span>
      <h2 className={styles.sectionLabel}>{label}</h2>
      <div className={styles.sectionLine}></div>
    </div>
  );

}
const AD_VARIANT_CLASS = {
  inline: styles.adInline,
  native: styles.adNative,
  sidebar: styles.adSidebar,
};

/* device: "desktop" -> hidden at <=960px, "mobile" -> shown only at <=960px */
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
function PoliticsMain({ post }) {
  if (!post) {
    return (
      <article className={styles.politicsMain} aria-hidden="true">
        <div className={styles.politicsMainImg}>
          <Cover src="" />
        </div>
        <SkeletonText lines={3} title />
      </article>
    );
  }
  return (
    <article className={styles.politicsMain}>
      <div className={styles.politicsMainImg}>
        <Cover src={post.img} className={styles.mainImg} sizes="(max-width: 960px) 100vw, 45vw" priority />
      </div>

      <div className={styles.politicsMainContent}>
        <Link href={`/posts/${post.slug}`} className={styles.cardLink}>
          <h3 className={styles.politicsTitle}>{post.title}</h3>
        </Link>
        {post.desc ? <p className={styles.politicsDesc}>{post.desc}</p> : null}
      </div>
    </article>
  );

}
function PoliticsItem({ post }) {
  if (!post) {
    return (
      <article className={styles.politicsItem} aria-hidden="true">
        <div className={styles.politicsItemImg}>
          <Cover src="" />
        </div>
        <SkeletonText lines={2} title />
      </article>
    );
  }
  return (
    <article className={styles.politicsItem}>
      <div className={styles.politicsItemImg}>
        <Cover src={post.img} className={styles.thumbImg} sizes="90px" />
      </div>
      <Link href={`/posts/${post.slug}`} className={styles.cardLink}>
        <h3 className={styles.politicsItemTitle}>{post.title}</h3>
      </Link>
    </article>
  );

}
function InvestingMain({ post }) {
  if (!post) {
    return (
      <article className={styles.businessMain} aria-hidden="true">
        <div className={styles.businessMainImg}>
          <Cover src="" />
        </div>
        <SkeletonText lines={2} title />
      </article>
    );
  }
  return (
    <article className={styles.businessMain}>
      <div className={styles.businessMainImg}>
        <Cover src={post.img} className={styles.mainImg} sizes="(max-width: 960px) 100vw, 30vw" />
      </div>
      <Link href={`/posts/${post.slug}`} className={styles.cardLink}>
        <h3 className={styles.businessMainTitle}>{post.title}</h3>
      </Link>
    </article>
  );

}
function InvestingItem({ post }) {
  if (!post) {
    return (
      <article className={styles.businessItem} aria-hidden="true">
        <SkeletonText lines={2} title />
      </article>
    );
  }
  return (
    <article className={styles.businessItem}>
      <Link href={`/posts/${post.slug}`} className={styles.cardLink}>
        <h3 className={styles.businessItemTitle}>{post.title}</h3>
      </Link>
    </article>
  );

}
/* ==========================================================================
   MAIN COMPONENT
   ========================================================================== */
export default function PoliticsBusiness({ politics = {}, business = {} }) {
  const politicsList = padSlots(politics.list, 4);
  const businessList = padSlots(business.list, 6);

  return (
    <section className={styles.container} aria-label="Personal finance and investing stories">
      {/* ==================== PERSONAL FINANCE ==================== */}
      <div className={styles.politics}>
        <SectionHeader label="PERSONAL FINANCE" />
        <PoliticsMain post={politics.main || null} />

        {/* Desktop: native ad between the main story and the list */}
        <AdSlot variant="native" device="desktop" />
        {/* <=960px (single column): the one inline ad, right after the main story */}
        <AdSlot variant="inline" device="mobile" />

        <div className={styles.politicsList}>
          {politicsList.map((item, index) => (
            <PoliticsItem key={item?.slug || `politics-${index}`} post={item} />
          ))}
        </div>
      </div>

      {/* ==================== INVESTING ==================== */}
      <div className={styles.business}>
        <SectionHeader label="INVESTING" />
        <InvestingMain post={business.main || null} />

        <div className={styles.businessList}>
          {businessList.map((item, i) => (
            <Fragment key={item?.slug || `business-${i}`}>
              <InvestingItem post={item} />
              {/* Desktop: inline ad after the 3rd item */}
              {i === 2 && <AdSlot variant="inline" device="desktop" />}
            </Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}
