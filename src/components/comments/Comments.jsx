"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./comments.module.css";

const indentFor = (depth) => (depth === 0 ? 0 : 20 + (depth - 1) * 40);

const formatDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

function depthFor(row, byId) {
  let depth = 0;
  let parentId = row.parentId;
  const seen = new Set();
  while (parentId && !seen.has(parentId)) {
    seen.add(parentId);
    depth += 1;
    parentId = byId.get(parentId)?.parentId ?? null;
    if (depth > 8) break;
  }
  return depth;
}

function mapComments(rows) {
  const byId = new Map(rows.map((row) => [row.id, row]));
  return rows.map((row) => {
    const name = row.user?.name?.trim() || "Reader";
    return {
      id: row.id,
      parentId: row.parentId || null,
      depth: depthFor(row, byId),
      name,
      image: row.user?.image || "",
      initial: name.charAt(0).toUpperCase(),
      date: formatDate(row.createdAt),
      desc: row.desc,
    };
  });
}

const Comments = ({ postSlug }) => {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [desc, setDesc] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState(null);

  const load = useCallback(async () => {
    if (!postSlug) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/comments?postSlug=${encodeURIComponent(postSlug)}`);
      const data = await res.json().catch(() => []);
      if (!res.ok) throw new Error(data.message || "Could not load comments.");
      setComments(mapComments(Array.isArray(data) ? data : []));
    } catch (err) {
      setError(err.message || "Could not load comments.");
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [postSlug]);

  useEffect(() => {
    load();
  }, [load]);

  const replyLabel = useMemo(() => {
    if (!replyTo) return null;
    const target = comments.find((item) => item.id === replyTo);
    return target ? `Replying to ${target.name}` : "Replying to comment";
  }, [replyTo, comments]);

  const signedIn = status === "authenticated" && Boolean(session?.user);
  const loginHref = `/login?callbackUrl=${encodeURIComponent(pathname || `/posts/${postSlug}`)}`;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!signedIn) {
      setError("Sign in to post a comment.");
      return;
    }

    const text = desc.trim();
    if (!text) {
      setError("Write your comment before posting.");
      return;
    }
    if (text.length > 2000) {
      setError("Write a comment up to 2,000 characters.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postSlug,
          desc: text,
          ...(replyTo ? { parentId: replyTo } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Could not post your comment.");
      setDesc("");
      setReplyTo(null);
      await load();
    } catch (err) {
      setError(err.message || "Could not post your comment.");
    } finally {
      setSubmitting(false);
    }
  };

  const count = comments.length;

  return (
    <section id="comments" className={styles.container} aria-label="Comments">
      <h2 className={styles.title}>
        {loading ? "Comments" : `${count} ${count === 1 ? "comment" : "comments"}`}
      </h2>

      {loading ? (
        <p className={styles.muted}>Loading comments…</p>
      ) : comments.length === 0 ? (
        <p className={styles.muted}>No comments yet. Be the first to reply.</p>
      ) : (
        <div className={styles.comments}>
          {comments.map((item) => (
            <article
              className={styles.comment}
              key={item.id}
              style={{ marginLeft: indentFor(item.depth) }}
            >
              <div className={styles.avatarContainer}>
                {item.image ? (
                  <Image
                    src={item.image}
                    alt=""
                    fill
                    unoptimized
                    className={styles.image}
                  />
                ) : (
                  <div className={styles.avatarFallback} aria-hidden="true">
                    {item.initial}
                  </div>
                )}
              </div>
              <div className={styles.body}>
                <h3 className={styles.username}>{item.name}</h3>
                <div className={styles.metaRow}>
                  <time className={styles.date} dateTime={item.date}>
                    {item.date}
                  </time>
                  {signedIn ? (
                    <button
                      type="button"
                      className={styles.reply}
                      onClick={() => {
                        setReplyTo(item.id);
                        setError("");
                      }}
                    >
                      Reply
                    </button>
                  ) : null}
                </div>
                <p className={styles.desc}>{item.desc}</p>
              </div>
            </article>
          ))}
        </div>
      )}

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <h2 className={styles.formTitle}>Leave a reply</h2>
        {!signedIn ? (
          <p className={styles.note}>
            <Link href={loginHref} className={styles.signInLink}>
              Sign in
            </Link>{" "}
            to join the discussion.
          </p>
        ) : (
          <p className={styles.note}>
            Posting as <strong>{session.user.name || session.user.email}</strong>.
          </p>
        )}

        {replyLabel ? (
          <div className={styles.replyBanner}>
            <span>{replyLabel}</span>
            <button type="button" className={styles.cancelReply} onClick={() => setReplyTo(null)}>
              Cancel
            </button>
          </div>
        ) : null}

        <div className={styles.field}>
          <label htmlFor="comment-text">Your comment {signedIn ? "*" : ""}</label>
          <textarea
            id="comment-text"
            className={`${styles.input} ${styles.textarea}`}
            value={desc}
            maxLength={2000}
            disabled={!signedIn || submitting}
            placeholder={signedIn ? "Share your thoughts…" : "Sign in to comment"}
            onChange={(event) => {
              setDesc(event.target.value);
              setError("");
            }}
          />
        </div>

        {error ? (
          <p role="alert" className={styles.error}>
            {error}
          </p>
        ) : null}

        <button type="submit" className={styles.button} disabled={!signedIn || submitting}>
          {submitting ? "Posting…" : "Post comment"}
        </button>
      </form>
    </section>
  );
};

export default Comments;