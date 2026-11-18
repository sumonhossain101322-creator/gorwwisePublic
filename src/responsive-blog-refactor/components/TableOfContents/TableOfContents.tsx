"use client";

import { useEffect, useState } from "react";
import styles from "./TableOfContents.module.css";

type Item = { id: string; text: string; level: 2 | 3 };
export default function TableOfContents({ items }: { items: Item[] }) {
  const [activeId, setActiveId] = useState("");
  useEffect(() => {
    const nodes = items.map(({ id }) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    if (!nodes.length || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible[0]) setActiveId(visible[0].target.id);
    }, { rootMargin: "-12% 0px -72% 0px", threshold: 0 });
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [items]);
  if (!items.length) return null;
  return (
    <aside className={styles.toc} aria-label="Table of contents">
      <details>
        <summary>On this page</summary>
        <nav aria-label="Article contents">
          <ol>{items.map((item) => (
            <li key={item.id} className={item.level === 3 ? styles.nested : undefined}>
              <a className={activeId === item.id ? styles.active : undefined} href={`#${item.id}`} aria-current={activeId === item.id ? "location" : undefined}>{item.text}</a>
            </li>
          ))}</ol>
        </nav>
      </details>
    </aside>
  );
}
