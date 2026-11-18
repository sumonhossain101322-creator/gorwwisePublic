import Link from "next/link";
import styles from "./menuCategories.module.css";
import { mergeWriteCategories } from "@/utils/writeCategories";

export default function MenuCategories({ categories }) {
  const items = categories?.length ? categories : mergeWriteCategories();

  return (
    <div className={styles.categoryList}>
      {items.map(({ slug, title, color, active }) => (
        <Link
          href={`/category?cat=${slug}`}
          className={`${styles.categoryItem} ${styles[color]} ${active ? styles.active : ""}`}
          key={slug}
          aria-current={active ? "page" : undefined}
        >
          {title}
        </Link>
      ))}
    </div>
  );
}