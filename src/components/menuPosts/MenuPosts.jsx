import Image from "next/image";
import Link from "next/link";
import styles from "./menuPosts.module.css";
import { Bone, padSlots } from "@/components/skeleton/Skeleton";

export default function MenuPosts({
  posts = [],
  withImage = false,
  skeletonCount = 4,
  emptyMessage = "",
}) {
  const real = posts.filter((post) => post?.slug);
  const slots = real.length > 0 ? real : skeletonCount > 0 ? padSlots([], skeletonCount) : [];

  if (real.length === 0 && emptyMessage) {
    return <p className={styles.empty}>{emptyMessage}</p>;
  }

  return (
    <div className={styles.items}>
      {slots.map((post, index) => {
        if (!post?.slug) {
          return (
            <div className={styles.item} key={`menu-skeleton-${index}`} aria-hidden="true">
              {withImage ? (
                <div className={styles.imageContainer}>
                  <Bone className={styles.skeletonImage} />
                </div>
              ) : null}
              <CardSkeleton />
            </div>
          );
        }

        return (
          <Link href={`/posts/${post.slug}`} className={styles.item} key={post.slug}>
            {withImage && post.img ? (
              <div className={styles.imageContainer}>
                <Image src={post.img} alt="" fill className={styles.image} sizes="80px" />
              </div>
            ) : withImage ? (
              <div className={styles.imageContainer}>
                <Bone className={styles.skeletonImage} />
              </div>
            ) : null}
            <div className={styles.textContainer}>
              <span className={`${styles.category} ${styles[post.tone] || styles.investing}`}>{post.category}</span>
              <h3 className={styles.postTitle}>{post.title}</h3>
              <div className={styles.detail}>
                <span className={styles.username}>{post.author}</span>
                <span className={styles.date}> · GrowWise</span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className={styles.textContainer}>
      <Bone className={styles.skeletonChip} />
      <Bone className={styles.skeletonTitle} />
      <Bone className={styles.skeletonLine} />
    </div>
  );
}