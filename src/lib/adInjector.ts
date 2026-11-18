/** Placeholder inserted into Quill HTML. Rendered as <AdSlot /> by ArticleWithAds. */
export const IN_ARTICLE_AD_HTML =
  '<div class="in-article-ad-slot" data-ad-slot="in-article"></div>';

const PARAGRAPH = /<p\b[^>]*>[\s\S]*?<\/p>/gi;

/**
 * Insert an in-article ad marker after the 2nd and 5th paragraphs.
 * Paragraphs are counted from Quill `<p>` blocks only.
 */
export function injectInArticleAds(htmlString: string): string {
  const html = typeof htmlString === "string" ? htmlString : "";
  if (!html.trim()) return "";

  let index = 0;
  return html.replace(PARAGRAPH, (paragraph) => {
    index += 1;
    if (index === 2 || index === 5) {
      return `${paragraph}${IN_ARTICLE_AD_HTML}`;
    }
    return paragraph;
  });
}

export function splitInjectedArticle(htmlString: string): string[] {
  const injected = injectInArticleAds(htmlString);
  return injected.split(IN_ARTICLE_AD_HTML);
}
