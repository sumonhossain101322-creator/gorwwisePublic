"use client";

import { useEffect, useState } from "react";
import styles from "./ShareBar.module.css";

type Props = { title: string };

export default function ShareBar({ title }: Props) {
  const [toast, setToast] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  useEffect(() => { setShareUrl(window.location.href); }, []);
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(title);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setToast("Link copied");
    } catch {
      setToast("Could not copy link");
    }
    window.setTimeout(() => setToast(""), 2200);
  }

  async function nativeShare() {
    if (navigator.share) {
      try { await navigator.share({ title, url: window.location.href }); } catch { /* User cancelled share. */ }
    } else {
      await copyLink();
    }
  }

  return (
    <div className={styles.share} aria-label="Share this article">
      <button type="button" onClick={copyLink} aria-label="Copy article link">Copy link</button>
      <a href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`} target="_blank" rel="noopener noreferrer" aria-label="Share on X">X</a>
      <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`} target="_blank" rel="noopener noreferrer" aria-label="Share on Facebook">Facebook</a>
      <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`} target="_blank" rel="noopener noreferrer" aria-label="Share on LinkedIn">LinkedIn</a>
      <button type="button" onClick={nativeShare} aria-label="Share using your device">Share…</button>
      <span className={styles.toast} role="status" aria-live="polite">{toast}</span>
    </div>
  );
}
