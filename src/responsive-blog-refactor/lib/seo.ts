export function stripHtml(input: string): string {
  return input
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function estimateReadTime(htmlOrText: string, wordsPerMinute = 220): number {
  const words = stripHtml(htmlOrText).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

type ArticleJsonLdInput = {
  title: string; description: string; image: string; datePublished: string;
  dateModified: string; author: string; publisher: string; publisherLogo: string;
  canonical: string; section: string; wordCount: number;
};

export function buildArticleJsonLd(input: ArticleJsonLdInput) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: input.title,
    description: input.description,
    image: [input.image],
    datePublished: input.datePublished,
    dateModified: input.dateModified,
    author: { "@type": "Person", name: input.author },
    publisher: { "@type": "Organization", name: input.publisher, logo: { "@type": "ImageObject", url: input.publisherLogo } },
    mainEntityOfPage: { "@type": "WebPage", "@id": input.canonical },
    articleSection: input.section,
    wordCount: input.wordCount,
  };
}

export function buildBreadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem", position: index + 1, name: item.name, item: item.url,
    })),
  };
}
