'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaUser, FaComment, FaBell } from 'react-icons/fa';
import styles from './NoticeBoard.module.css';

const TYPES = {
  user: { icon: FaUser, bg: '#fef3c7', color: '#d97706' },
  comment: { icon: FaComment, bg: '#d1fae5', color: '#059669' },
  bell: { icon: FaBell, bg: '#fee2e2', color: '#dc2626' },
};

function timeAgo(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const minutes = Math.max(0, Math.round((Date.now() - date.getTime()) / 60000));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour ago`;
  const days = Math.round(hours / 24);
  return `${days} day ago`;
}

async function markRead(id) {
  try {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
  } catch {
    // ignore
  }
}

export default function NoticeBoard({ notices = [] }) {
  const router = useRouter();
  const unread = notices.filter((n) => !n.isRead).length;

  const onOpen = (notice) => {
    if (!notice.isRead && notice.id) markRead(notice.id);
    router.refresh();
  };

  const markAll = async () => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true }),
    });
    router.refresh();
  };

  return (
    <div className={styles.card} id="notice-board">
      <div className={styles.headerRow}>
        <h3 className={styles.header}>
          Notice board
          {unread > 0 && <span className={styles.badge}>{unread}</span>}
        </h3>
        {unread > 0 && (
          <button type="button" className={styles.markAll} onClick={markAll}>
            Mark all read
          </button>
        )}
      </div>
      <div className={styles.list}>
        {notices.length === 0 && <p className={styles.desc}>No notices yet.</p>}
        {notices.map((notice) => {
          const theme = TYPES[notice.type] || TYPES.bell;
          const Icon = theme.icon;
          const time = timeAgo(notice.time);
          const href = notice.link || '/profile';
          return (
            <Link
              key={notice.id}
              href={href}
              className={`${styles.item} ${notice.isRead ? '' : styles.unread}`}
              onClick={() => onOpen(notice)}
            >
              <div className={styles.iconBox} style={{ backgroundColor: theme.bg }}>
                <Icon color={theme.color} size={16} />
              </div>
              <div className={styles.content}>
                <div className={styles.title}>{notice.title}</div>
                {notice.desc && <div className={styles.desc}>{notice.desc}</div>}
                {time && <div className={styles.time}>{time}</div>}
              </div>
            </Link>
          );
        })}
      </div>
      <div className={styles.footer}>
        <Link href="/notifications" className={styles.viewAll}>
          View all notifications
        </Link>
      </div>
    </div>
  );
}