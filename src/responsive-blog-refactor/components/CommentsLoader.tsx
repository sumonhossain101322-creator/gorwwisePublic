"use client";

import dynamic from "next/dynamic";
import styles from "../singlePage.module.css";

const Comments = dynamic(() => import("@/components/comments/Comments"), {
  ssr: false,
  loading: () => <div className={styles.commentsSkeleton} aria-label="Loading comments"><span /></div>,
});

export default function CommentsLoader({ postSlug }: { postSlug: string }) {
  return <Comments postSlug={postSlug} />;
}
