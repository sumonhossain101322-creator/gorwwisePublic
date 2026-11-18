import Image from "next/image";
import styles from "./skeleton.module.css";

export const padSlots = (items, count) =>
  Array.from({ length: count }, (_, index) => items?.[index] ?? null);

export function Bone({ className = "" }) {
  return <span className={`${styles.bone} ${className}`} aria-hidden="true" />;
}

export function SkeletonText({ lines = 2, title = false }) {
  return (
    <span className={styles.stack} aria-hidden="true">
      {title && <Bone className={styles.title} />}
      {Array.from({ length: lines }, (_, index) => (
        <Bone key={index} className={index === lines - 1 ? styles.short : styles.line} />
      ))}
    </span>
  );
}

export function SkeletonHeader() {
  return <Bone className={styles.header} />;
}

export function Cover({ src, alt = "", className, sizes, priority = false, quality = 75 }) {
  if (!src) return <Bone className={styles.fill} />;
  return (
    <Image
      src={src}
      alt={alt}
      fill
      className={className}
      sizes={sizes}
      quality={quality}
      priority={priority}
      loading={priority ? undefined : "lazy"}
    />
  );
}
