"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { FaBell } from "react-icons/fa";
import { NOTICE_TITLE, timeAgo } from "./notificationCopy";
import styles from "./NotificationBell.module.css";

async function fetchNotifications() {
  const res = await fetch("/api/notifications?limit=10");
  if (res.status === 401) return null;
  if (!res.ok) throw new Error("Failed to load notifications");
  return res.json();
}

export default function NotificationBell() {
  const { status } = useSession();
  const pathname = usePathname();
  const wrapRef = useRef(null);
  const btnRef = useRef(null);
  const seenIdsRef = useRef(new Set());
  const desktopInitRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [data, setData] = useState({ items: [], unreadCount: 0, preferences: { notifyDesktop: false } });
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (status !== "authenticated") return;
    try {
      setLoading(true);
      const json = await fetchNotifications();
      if (!json) return;

      if (json.preferences?.notifyDesktop && typeof window !== "undefined" && "Notification" in window) {
        if (Notification.permission === "granted") {
          for (const item of json.items) {
            if (!desktopInitRef.current) {
              seenIdsRef.current.add(item.id);
              continue;
            }
            if (item.isRead || seenIdsRef.current.has(item.id)) continue;
            seenIdsRef.current.add(item.id);
            const title = NOTICE_TITLE[item.type] || "Notification";
            try {
              new Notification(title, { body: item.message, tag: item.id });
            } catch {
              // ignore
            }
          }
          desktopInitRef.current = true;
        }
      }

      setData(json);
    } catch {
      // ignore poll errors
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    load();
    if (status !== "authenticated") return undefined;
    const id = setInterval(load, 45000);
    return () => clearInterval(id);
  }, [status, load]);

  useEffect(() => {
    if (!open) return;
    load();
    const onDown = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, load]);

  if (status !== "authenticated") return null;

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

  const requestDesktop = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    await Notification.requestPermission();
  };

  const unread = data.unreadCount || 0;

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <button
        ref={btnRef}
        type="button"
        className={styles.bellBtn}
        aria-label={unread ? `${unread} unread notifications` : "Notifications"}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <FaBell size={17} aria-hidden="true" />
        {unread > 0 && <span className={styles.badge}>{unread > 9 ? "9+" : unread}</span>}
      </button>

      {open && (
        <div className={styles.panel} role="dialog" aria-label="Notifications">
          <div className={styles.panelHead}>
            <span className={styles.panelTitle}>Notifications</span>
            {unread > 0 && (
              <button type="button" className={styles.markAll} onClick={markAll}>
                Mark all read
              </button>
            )}
          </div>

          <ul className={styles.list}>
            {loading && data.items.length === 0 && <li className={styles.empty}>Loading…</li>}
            {!loading && data.items.length === 0 && <li className={styles.empty}>You&apos;re all caught up.</li>}
            {data.items.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.link || "/profile"}
                  className={`${styles.item} ${item.isRead ? "" : styles.unread}`}
                  onClick={() => {
                    if (!item.isRead) markRead(item.id);
                    setOpen(false);
                  }}
                >
                  <span className={styles.itemTitle}>{NOTICE_TITLE[item.type] || "Notification"}</span>
                  <span className={styles.itemMsg}>{item.message}</span>
                  <span className={styles.itemTime}>{timeAgo(item.createdAt)}</span>
                </Link>
              </li>
            ))}
          </ul>

          <div className={styles.panelFoot}>
            <Link href="/notifications" className={styles.viewAll} onClick={() => setOpen(false)}>
              View all
            </Link>
            {data.preferences?.notifyDesktop && typeof window !== "undefined" && "Notification" in window && Notification.permission === "default" && (
              <button type="button" className={styles.enableDesktop} onClick={requestDesktop}>
                Enable desktop alerts
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}