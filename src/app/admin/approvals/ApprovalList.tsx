"use client";

import { useContext, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ThemeContext } from "@/context/ThemeContext";
import styles from "./page.module.css";

export type ApprovalItem = {
  id: string;
  type: "POST_CREATE" | "POST_UPDATE" | "POST_DELETE" | "ROLE_UPGRADE";
  createdAt: string;
  requesterName: string;
  requesterEmail: string;
  requesterImage: string;
  postTitle: string;
  summary: string;
  note: string;
  liveHref: string;
  preview: {
    title: string;
    excerpt: string;
    category: string;
    image: string;
    html: string;
  } | null;
  application: {
    bio: string;
    reason: string;
  } | null;
};

const TYPE_LABEL = {
  POST_CREATE: "New article",
  POST_UPDATE: "Edit",
  POST_DELETE: "Delete",
  ROLE_UPGRADE: "Writer application",
};

const FILTERS = [
  { id: "ALL", label: "All" },
  { id: "POST_CREATE", label: "New" },
  { id: "POST_UPDATE", label: "Edits" },
  { id: "POST_DELETE", label: "Deletes" },
  { id: "ROLE_UPGRADE", label: "Writers" },
] as const;

const whenLabel = (iso: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));

export default function ApprovalList({ requests }: { requests: ApprovalItem[] }) {
  const router = useRouter();
  const { theme } = useContext(ThemeContext) || { theme: "light" };
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [items, setItems] = useState(requests);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("ALL");
  const [openId, setOpenId] = useState("");
  const [busy, setBusy] = useState<{ id: string; action: "approve" | "reject" } | null>(null);
  const [error, setError] = useState("");

  const open = items.find((item) => item.id === openId) || null;
  const visible = filter === "ALL" ? items : items.filter((item) => item.type === filter);

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.activeElement;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) setOpenId("");
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, [open, busy]);

  const review = async (item: ApprovalItem, action: "approve" | "reject", confirmDelete = false) => {
    if (busy) return;
    if (confirmDelete && !window.confirm(`Permanently delete “${item.postTitle}”?`)) return;
    setBusy({ id: item.id, action });
    setError("");
    try {
      const res = await fetch(`/api/admin/approvals/${item.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || "Could not update that request.");
      setItems((current) => current.filter((row) => row.id !== item.id));
      setOpenId((current) => (current === item.id ? "" : current));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update that request.");
    } finally {
      setBusy(null);
    }
  };

  if (items.length === 0) {
    return (
      <section className={styles.emptyCard}>
        <h2>Nothing waiting</h2>
        <p>New articles, edits, delete requests, and writer applications will show up here.</p>
      </section>
    );
  }

  return (
    <div className={styles.list}>
      <div className={styles.filters} role="tablist" aria-label="Filter requests">
        {FILTERS.map((entry) => {
          const count = entry.id === "ALL" ? items.length : items.filter((item) => item.type === entry.id).length;
          if (entry.id !== "ALL" && count === 0) return null;
          return (
            <button
              key={entry.id}
              type="button"
              role="tab"
              aria-selected={filter === entry.id}
              className={filter === entry.id ? styles.filterOn : styles.filter}
              onClick={() => setFilter(entry.id)}
            >
              {entry.label}
              <span>{count}</span>
            </button>
          );
        })}
      </div>

      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}

      {visible.length === 0 ? <p className={styles.empty}>Nothing in this group.</p> : null}

      {visible.map((item) => {
        const working = busy?.id === item.id;
        return (
          <article key={item.id} className={styles.card} data-type={item.type}>
            <div className={styles.cardMain}>
              <header className={styles.cardHead}>
                <span className={styles.type} data-type={item.type}>{TYPE_LABEL[item.type]}</span>
                <time dateTime={item.createdAt}>{whenLabel(item.createdAt)}</time>
              </header>
              <h2>{item.preview?.title || item.requesterName}</h2>
              <p className={styles.meta}>
                {item.requesterName}
                {item.requesterEmail ? ` · ${item.requesterEmail}` : ""}
              </p>
              <p className={styles.summary}>{item.summary}</p>
            </div>
            <div className={styles.actions}>
              <button type="button" className={styles.view} onClick={() => setOpenId(item.id)} aria-haspopup="dialog">
                View
              </button>
              <button
                type="button"
                className={item.type === "POST_DELETE" ? styles.danger : styles.primary}
                disabled={Boolean(busy)}
                onClick={() => review(item, "approve", item.type === "POST_DELETE")}
              >
                {working && busy?.action === "approve" ? "Working..." : item.type === "POST_DELETE" ? "Approve delete" : "Approve"}
              </button>
              <button type="button" className={styles.secondary} disabled={Boolean(busy)} onClick={() => review(item, "reject")}>
                {working && busy?.action === "reject" ? "Working..." : "Reject"}
              </button>
            </div>
          </article>
        );
      })}

      {open
        ? createPortal(
            <div
              className={`${styles.backdrop} ${theme === "dark" ? "dark" : "light"}`}
              onMouseDown={(event) => {
                if (event.target === event.currentTarget && !busy) setOpenId("");
              }}
            >
              <div
                className={styles.dialog}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
              >
                <header className={styles.dialogHead}>
                  <div>
                    <span className={styles.type} data-type={open.type}>{TYPE_LABEL[open.type]}</span>
                    <p className={styles.dialogMeta}>
                      {open.requesterName}
                      {open.requesterEmail ? ` · ${open.requesterEmail}` : ""}
                      {" · "}
                      <time dateTime={open.createdAt}>{whenLabel(open.createdAt)}</time>
                    </p>
                  </div>
                  <button ref={closeRef} type="button" className={styles.close} onClick={() => setOpenId("")} disabled={Boolean(busy)}>
                    Close
                  </button>
                </header>

                <div className={styles.dialogBody}>
                  <p className={styles.note}>{open.note}</p>
                  {open.preview ? (
                    <article className={styles.article}>
                      {open.preview.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={open.preview.image} alt="" className={styles.cover} />
                      ) : null}
                      {open.preview.category ? <p className={styles.category}>{open.preview.category}</p> : null}
                      <h2 id={titleId}>{open.preview.title}</h2>
                      {open.preview.excerpt ? <p className={styles.excerpt}>{open.preview.excerpt}</p> : null}
                      {open.preview.html ? (
                        <div className={styles.html} dangerouslySetInnerHTML={{ __html: open.preview.html }} />
                      ) : (
                        <p className={styles.summary}>This request has no article body.</p>
                      )}
                      {open.liveHref ? (
                        <p className={styles.liveLink}>
                          <Link href={open.liveHref} target="_blank" rel="noreferrer">Open the live article</Link>
                        </p>
                      ) : null}
                    </article>
                  ) : (
                    <article className={styles.article}>
                      <h2 id={titleId}>{open.requesterName}</h2>
                      <h3>Why they want to write</h3>
                      <p>{open.application?.reason || "No reason given."}</p>
                      <h3>Bio</h3>
                      <p>{open.application?.bio || "No bio given."}</p>
                    </article>
                  )}
                </div>

                <footer className={styles.dialogFoot}>
                  <button type="button" className={styles.secondary} disabled={Boolean(busy)} onClick={() => review(open, "reject")}>
                    {busy?.id === open.id && busy.action === "reject" ? "Working..." : "Reject"}
                  </button>
                  <button
                    type="button"
                    className={open.type === "POST_DELETE" ? styles.danger : styles.primary}
                    disabled={Boolean(busy)}
                    onClick={() => review(open, "approve", false)}
                  >
                    {busy?.id === open.id && busy.action === "approve"
                      ? "Working..."
                      : open.type === "POST_DELETE"
                        ? "Approve delete"
                        : "Approve"}
                  </button>
                </footer>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
