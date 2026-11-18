import { labelFromSlug } from "@/utils/homeData";

/** Canonical slugs shown on the write page category dropdown. */
export const WRITE_CATEGORY_SLUGS = [
  "investing",
  "personal-finance",
  "credit-cards",
  "cryptocurrency",
  "real-estate",
  "insurance",
];

export const WRITE_CATEGORY_LABELS = {
  investing: "Investing",
  "personal-finance": "Personal Finance",
  "credit-cards": "Credit Cards",
  cryptocurrency: "Cryptocurrency",
  "real-estate": "Real Estate",
  insurance: "Insurance",
};

const CATEGORY_COLORS = ["blue", "emerald", "navy", "gold", "teal", "slate"];

export function writeCategoryTitle(slug, dbTitle) {
  if (dbTitle?.trim()) return dbTitle.trim();
  if (WRITE_CATEGORY_LABELS[slug]) return WRITE_CATEGORY_LABELS[slug];
  return labelFromSlug(slug);
}

/**
 * Build the same category list as the write editor (DB title when present, else labels above).
 */
export function mergeWriteCategories(dbRows = []) {
  const titles = new Map(
    (Array.isArray(dbRows) ? dbRows : [])
      .filter((row) => row?.slug && WRITE_CATEGORY_SLUGS.includes(row.slug))
      .map((row) => [row.slug, row.title]),
  );

  return WRITE_CATEGORY_SLUGS.map((slug, index) => ({
    slug,
    title: writeCategoryTitle(slug, titles.get(slug)),
    color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
  }));
}