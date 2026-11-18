'use client';

import styles from './RecentComments.module.css';

export default function RecentComments({ comments = [] }) {
  return (
    <div className={styles.card}>
      <h3 className={styles.header}>Recent comments</h3>
      <div className={styles.list}>
        {comments.length === 0 && <p className={styles.author}>No comments yet.</p>}
        {comments.map((comment) => (
          <div key={comment.id} className={styles.item}>
            {comment.avatar ? (
              <img src={comment.avatar} alt="" className={styles.avatar} />
            ) : (
              <span className={styles.avatar} aria-hidden="true" />
            )}
            <div className={styles.content}>
              <div className={styles.text}>{comment.text}</div>
              <div className={styles.author}>by {comment.author}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
