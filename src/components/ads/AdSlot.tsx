"use client";

import { useEffect, useRef } from "react";
import { ADS, AD_SIZES, type AdSize, type AdSlotKey } from "@/config/ads";
import styles from "./adSlot.module.css";

const SIZE_CLASS: Record<AdSize, string> = {
  leaderboard: styles.sizeLeaderboard,
  rectangle: styles.sizeRectangle,
  skyscraper: styles.sizeSkyscraper,
  mobileBanner: styles.sizeMobileBanner,
  inArticle: styles.sizeInArticle,
};

const VARIANT_SIZE: Record<string, AdSize> = {
  inline: "leaderboard",
  native: "inArticle",
  sidebar: "rectangle",
  article: "inArticle",
};

type AdSlotProps = {
  size?: AdSize;
  variant?: "inline" | "native" | "sidebar" | "article";
  slotKey?: AdSlotKey;
  adSlot?: string;
  className?: string;
  sticky?: boolean;
};

export default function AdSlot({
  size,
  variant = "inline",
  slotKey,
  adSlot,
  className = "",
  sticky = false,
}: AdSlotProps) {
  const ref = useRef<HTMLDivElement>(null);
  const resolvedSize = size || VARIANT_SIZE[variant] || "leaderboard";
  const dimensions = AD_SIZES[resolvedSize] || AD_SIZES.leaderboard;
  const slotId = adSlot || (slotKey ? ADS.slots[slotKey] : "") || ADS.slots.leaderboard;
  const client = ADS.client;

  useEffect(() => {
    if (!ADS.SHOW_ADS || !client || !slotId || !ref.current) return;
    try {
      const ads = ((window as Window & { adsbygoogle?: unknown[] }).adsbygoogle =
        (window as Window & { adsbygoogle?: unknown[] }).adsbygoogle || []);
      ads.push({});
    } catch {
      // Script not ready yet, or this unit was already pushed.
    }
  }, [client, slotId]);

  if (!ADS.SHOW_ADS) return null;

  const sizeClass = SIZE_CLASS[resolvedSize] || styles.sizeLeaderboard;

  return (
    <aside
      className={`${styles.adSlot} ${sizeClass} ${sticky ? styles.sticky : ""} ${className}`.trim()}
      style={{
        ["--ad-width" as string]: `${dimensions.width}px`,
        ["--ad-height" as string]: `${dimensions.height}px`,
      }}
      aria-label="Advertisement"
      data-ad-size={resolvedSize}
    >
      <span className={styles.adLabel}>Advertisement</span>
      <div className={styles.adBody} ref={ref}>
        {client && slotId ? (
          <ins
            className="adsbygoogle"
            style={{ display: "block", width: "100%", height: "100%" }}
            data-ad-client={client}
            data-ad-slot={slotId}
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        ) : (
          <p className={styles.placeholder}>
            {dimensions.width}×{dimensions.height}
          </p>
        )}
      </div>
    </aside>
  );
}
