
import styles from "./trending.module.css";
import Link from "next/link";
import { Cover, padSlots } from "@/components/skeleton/Skeleton";

export default function Trending({ stories = [] }) {
  const slots = padSlots(stories, 4);

  return (
    <section className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.heading}>Trending</h2>
        <div className={styles.line}></div>
      </div>

      <div className={styles.grid}>
        {slots.map((story, index) =>
          story ? (
            <Link
              href={`/posts/${story.slug}`}
              key={story.slug}
              className={styles.card}
            >
              {story.img ? (
                <Cover
                  src={story.img}
                  alt=""
                  className={styles.bgImage}
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority={index === 0}
                />
              ) : (
                <span className={styles.fallback} aria-hidden="true" />
              )}

              <div className={styles.overlay}></div>

              <div className={styles.content}>
                <div className={styles.meta}>
                  <span className={styles.category}>{story.category}</span>
                </div>

                <h3 className={styles.title}>{story.title}</h3>
                {story.desc ? <p className={styles.desc}>{story.desc}</p> : null}
              </div>
            </Link>
          ) : (
            <article key={`trending-${index}`} className={styles.card} aria-hidden="true">
              <Cover src="" />
            </article>
          )
        )}
      </div>
    </section>
  );
}
