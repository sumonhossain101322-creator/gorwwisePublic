/**
 * Central ad network config.
 * Set NEXT_PUBLIC_SHOW_ADS=false to hide every slot.
 * Slot IDs come from AdSense; leave blank to keep the reserved placeholder.
 */

export const AD_SIZES = {
  leaderboard: { width: 728, height: 90 },
  rectangle: { width: 300, height: 250 },
  skyscraper: { width: 300, height: 600 },
  mobileBanner: { width: 320, height: 50 },
  inArticle: { width: 336, height: 280 },
} as const;

export type AdSize = keyof typeof AD_SIZES;

export type AdSlotKey =
  | "leaderboard"
  | "rectangle"
  | "skyscraper"
  | "mobileBanner"
  | "inArticle"
  | "inFeed";

const env = (name: string) => process.env[name]?.trim() || "";

export const ADS = {
  SHOW_ADS: env("NEXT_PUBLIC_SHOW_ADS") !== "false",
  client: env("NEXT_PUBLIC_ADSENSE_CLIENT"),
  slots: {
    leaderboard: env("NEXT_PUBLIC_ADSENSE_SLOT_LEADERBOARD") || env("NEXT_PUBLIC_ADSENSE_SLOT"),
    rectangle: env("NEXT_PUBLIC_ADSENSE_SLOT_RECTANGLE") || env("NEXT_PUBLIC_ADSENSE_SLOT"),
    skyscraper: env("NEXT_PUBLIC_ADSENSE_SLOT_SKYSCRAPER") || env("NEXT_PUBLIC_ADSENSE_SLOT"),
    mobileBanner: env("NEXT_PUBLIC_ADSENSE_SLOT_MOBILE") || env("NEXT_PUBLIC_ADSENSE_SLOT"),
    inArticle: env("NEXT_PUBLIC_ADSENSE_SLOT_INARTICLE") || env("NEXT_PUBLIC_ADSENSE_SLOT"),
    inFeed: env("NEXT_PUBLIC_ADSENSE_SLOT_INFEED") || env("NEXT_PUBLIC_ADSENSE_SLOT"),
  } satisfies Record<AdSlotKey, string>,
};
