'use client';

import Link from 'next/link';
import styles from './LatestPostCard.module.css';

export default function LatestPostCard({ posts = [] }) {
  return (
    <div className={styles.card}>
      <h3 className={styles.header}>Latest post</h3>
      <div className={styles.list}>
        {posts.length === 0 && <p className={styles.date}>No posts yet.</p>}
        {posts.map((post) => (
          <Link key={post.slug} href={`/posts/${post.slug}`} className={styles.item}>
            {post.image ? (
              <img src={post.image} alt="" className={styles.thumbnail} />
            ) : (
              <span className={styles.thumbnail} aria-hidden="true" />
            )}
            <div className={styles.content}>
              <div className={styles.title}>{post.title}</div>
              {post.date && <div className={styles.date}>{post.date}</div>}
            </div>
          </Link>
        ))}
      </div>
      <div className={styles.footer}>
        <a href="#blog-list" className={styles.viewAll}>View all Posts</a>
      </div>
    </div>
  );
}
