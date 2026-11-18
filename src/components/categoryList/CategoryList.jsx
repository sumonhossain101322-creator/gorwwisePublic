
import { Fragment } from "react";
import styles from "./categoryList.module.css";
import Link from "next/link";
import { Cover, SkeletonHeader, SkeletonText, padSlots } from "@/components/skeleton/Skeleton";

/* Ads render AFTER this column index (1 = TECHNOLOGY): between columns on
   desktop, and as a full-width row / single block on tablet / mobile. */
const AD_AFTER_INDEX = 1;

/* ==========================================================================
   SUBCOMPONENTS
   ========================================================================== */

function CategoryHeader({ title }) {
  return (
    <div className={styles.categoryHeader}>
      {title ? <h3 className={styles.categoryTitle}>{title}</h3> : <SkeletonHeader />}
      <div className={styles.categoryLine}></div>
    </div>
  );

}
/* ONE link wraps image + heading. The image is decorative (alt="") because the
   heading already names the story. */
function MainStory({ post }) {
  if (!post) {
    return (
      <article className={styles.mainStory} aria-hidden="true">
        <div className={styles.mainImgWrapper}>
          <Cover src="" />
        </div>
        <SkeletonText lines={2} title />
      </article>
    );
  }
  return (
    <article className={styles.mainStory}>
      <Link href={`/posts/${post.slug}`}>
        <div className={styles.mainImgWrapper}>
          <Cover src={post.img} className={styles.mainImg} sizes="(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 20vw" />
        </div>
        <h4 className={styles.mainTitle}>{post.title}</h4>
      </Link>
    </article>
  );

}
function ListItem({ item }) {
  if (!item) {
    return (
      <article className={styles.listItem} aria-hidden="true">
        <SkeletonText lines={2} />
      </article>
    );
  }
  return (
    <article className={styles.listItem}>
      <Link href={`/posts/${item.slug}`}>
        <h5 className={styles.listTitle}>{item.title}</h5>
      </Link>
    </article>
  );

}
function CategoryColumn({ category }) {
  const list = padSlots(category.list, 3);
  return (
    <div className={styles.column}>
      <CategoryHeader title={category.title} />
      <MainStory post={category.main} />
      <div className={styles.list}>
        {list.map((item, index) => (
          <ListItem key={item?.slug || `item-${index}`} item={item} />
        ))}
      </div>
    </div>
  );

}
/* variant: "sidebar" (desktop rail) | "inline" (tablet / mobile full-width).
   "native" is accepted and renders with the inline styling.
   device: "tablet" | "mobile" toggles visibility for inline ads; the sidebar
   is hidden by its .adRail wrapper (desktopOnly). */
function AdSlot({ variant = "inline", device }) {
  const deviceClass =
    device === "tablet"
      ? styles.tabletOnly
      : device === "mobile"
        ? styles.mobileOnly
        : "";
  const className = [styles.adSlot, styles[variant] ?? styles.inline, deviceClass]
    .filter(Boolean)
    .join(" ");

  return (
    <aside role="complementary" aria-label="Advertisement" className={className}>
      <span className={styles.adLabel}>SPONSORED</span>
      <div className={styles.adBody}>Advertisement</div>
    </aside>
  );

}
/* ==========================================================================
   MAIN COMPONENT
   ========================================================================== */
export default function CategoryGrid({ columns = [] }) {
  const slots = padSlots(columns, 4);
  return (
    <section className={styles.container} aria-label="Category stories">
      {slots.map((category, i) => (
        <Fragment key={category?.title || `category-${i}`}>
          <CategoryColumn category={category || { title: "", main: null, list: [] }} />

          {i === AD_AFTER_INDEX && (
            <>
              {/* Desktop (>=1101px): 5th grid cell, between TECHNOLOGY and FEATURES */}
              <div className={`${styles.adRail} ${styles.desktopOnly}`}>
                <AdSlot variant="sidebar" />
              </div>
              {/* Tablet (641-1100px): full-width row after TECHNOLOGY */}
              <AdSlot variant="inline" device="tablet" />
              {/* Mobile (<=640px): single block after TECHNOLOGY */}
              <AdSlot variant="inline" device="mobile" />
            </>
          )}
        </Fragment>
      ))}
    </section>
  );
}