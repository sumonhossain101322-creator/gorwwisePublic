"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { NOTICE_TITLE, timeAgo } from "./notificationCopy";
import styles from "./NotificationsPanel.module.css";

export default function NotificationsPanel() {
  const { status } = useSession();
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch("/api/notifications?limit=50");
    if (res.status === 401) {
      router.replace("/login?callbackUrl=/notifications");
      return;
    }
    if (!res.ok) return;
    const json = await res.json();
    setItems(json.items || []);
    setUnreadCount(json.unreadCount || 0);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login?callbackUrl=/notifications");
    if (status === "authenticated") load();
  }, [status, load, router]);

  const markRead = async (id) => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  };

  const markAll = async () => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    load();
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Notifications</h1>
        {unreadCount > 0 && (
          <button type="button" className={styles.markAll} onClick={markAll}>
            Mark all as read ({unreadCount})
          </button>
        )}
      </div>

      {loading ? (
        <p className={styles.muted}>Loading notifications…</p>
      ) : items.length === 0 ? (
        <p className={styles.muted}>No notifications yet. Comments, approvals, and role updates will show up here.</p>
      ) : (
        <ul className={styles.list}>
          {items.map((item) => (
            <li key={item.id} className={item.isRead ? styles.row : `${styles.row} ${styles.unread}`}>
              <Link
                href={item.link || "/profile"}
                className={styles.link}
                onClick={() => {
                  if (!item.isRead) markRead(item.id);
                }}
              >
                <span className={styles.rowTitle}>{NOTICE_TITLE[item.type] || "Notification"}</span>
                <span className={styles.rowMsg}>{item.message}</span>
                <time className={styles.rowTime} dateTime={item.createdAt}>
                  {timeAgo(item.createdAt)}
                </time>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <p className={styles.hint}>
        Manage email and desktop alerts in{" "}
        <Link href="/profile">Profile settings</Link>.
      </p>
    </div>
  );
}