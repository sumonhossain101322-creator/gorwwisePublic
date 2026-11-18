
import styles from "./sports.module.css";
import Link from "next/link";
import { Cover, SkeletonText, padSlots } from "@/components/skeleton/Skeleton";

const sponsorAd = {
  brand: "VANGUARD",
  headline: "VANGUARD AML BD FINANCE MUTUAL FUND ONE",
  subline:
    "3rd QUARTER (Q3) QUARTERLY FINANCIAL STATEMENTS AS ON 30 SEPTEMBER 2026",
};

/* ==========================================================================
   SUBCOMPONENTS
   One <Link> per article, wrapping the heading and stretched over the card
   (.cardLink::after). Images are decorative (alt="") since the heading names
   the story.
   ========================================================================== */

function SectionHeader({ label }) {
  return (
    <div className={styles.sectionHeader}>
      <span className={styles.dot} aria-hidden="true"></span>
      <span className={styles.sectionLabel}>{label}</span>
      <div className={styles.sectionLine}></div>
    </div>
  );

}
function AdSlot({ ad }) {
  return (
    <div className={styles.adBanner}>
      <aside
        role="complementary"
        aria-label="Advertisement"
        className={`${styles.adSlot} ${styles.adInline}`}
      >
        <span className={styles.adLabel}>SPONSORED</span>
        <div className={styles.adBody}>
          <div className={styles.adContent}>
            <span className={styles.adBrand}>{ad.brand}</span>
            <div className={styles.adText}>
              <strong>{ad.headline}</strong>
              <span>{ad.subline}</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );

}
/* Text + image live inside ONE article so a single link covers both */
function MainStory({ story }) {
  if (!story) {
    return (
      <article className={styles.mainStory} aria-hidden="true">
        <div className={styles.mainText}>
          <SkeletonText lines={3} title />
        </div>
        <div className={styles.mainImgWrapper}>
          <Cover src="" />
        </div>
      </article>
    );
  }
  return (
    <article className={styles.mainStory}>
      <div className={styles.mainText}>
        <Link href={`/posts/${story.slug}`} className={styles.cardLink}>
          <h2 className={styles.mainTitle}>{story.title}</h2>
        </Link>
        {story.desc ? <p className={styles.mainDesc}>{story.desc}</p> : null}
      </div>

      <div className={styles.mainImgWrapper}>
        <Cover src={story.img} className={styles.mainImg} sizes="(max-width: 900px) 100vw, 40vw" priority />
      </div>
    </article>
  );

}
function SideStory({ story }) {
  if (!story) {
    return (
      <article className={styles.sideItem} aria-hidden="true">
        <div className={styles.sideText}>
          <SkeletonText lines={2} title />
        </div>
        <div className={styles.sideImg}>
          <Cover src="" />
        </div>
      </article>
    );
  }
  return (
    <article className={styles.sideItem}>
      <div className={styles.sideText}>
        <Link href={`/posts/${story.slug}`} className={styles.cardLink}>
          <h3 className={styles.sideTitle}>{story.title}</h3>
        </Link>
      </div>
      <div className={styles.sideImg}>
        <Cover src={story.img} className={styles.thumbImg} sizes="90px" />
      </div>
    </article>
  );

}
function BottomStory({ story }) {
  if (!story) {
    return (
      <article className={styles.bottomItem} aria-hidden="true">
        <SkeletonText lines={3} title />
      </article>
    );
  }
  return (
    <article className={styles.bottomItem}>
      <Link href={`/posts/${story.slug}`} className={styles.cardLink}>
        <h3 className={styles.bottomTitle}>{story.title}</h3>
      </Link>
      {story.desc ? <p className={styles.bottomDesc}>{story.desc}</p> : null}
    </article>
  );

}
/* ==========================================================================
   MAIN COMPONENT
   ========================================================================== */
/* Stories come from published finance and investing posts. */
const Sports = ({ main = null, side = [], bottom = [] }) => {
  const sideSlots = padSlots(side, 2);
  const bottomSlots = padSlots(bottom, 3);

  return (
    <section className={styles.container} aria-label="Credit card and crypto stories">
      <SectionHeader label="CREDIT CARDS & CRYPTO" />

      {/* Reserved-height ad, sits above the stories (never between a headline and its image) */}
      <AdSlot ad={sponsorAd} />

      <div className={styles.topGrid}>
        <MainStory story={main} />

        <div className={styles.sideStories}>
          {sideSlots.map((story, index) => (
            <SideStory key={story?.slug || `sports-side-${index}`} story={story} />
          ))}
        </div>
      </div>

      <div className={styles.bottomGrid}>
        {bottomSlots.map((story, index) => (
          <BottomStory key={story?.slug || `sports-bottom-${index}`} story={story} />
        ))}
      </div>
    </section>
  );
};

export default Sports;
