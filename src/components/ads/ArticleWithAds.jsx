import { Fragment } from "react";
import { splitInjectedArticle } from "@/lib/adInjector";
import AdSlot from "./AdSlot";
import styles from "./adSlot.module.css";

/**
 * Renders Quill HTML with real ad units after the 2nd and 5th paragraphs.
 * The injector writes a marker div; this component swaps each marker for <AdSlot />.
 */
export default function ArticleWithAds({ html, className = "", leadClassName = "" }) {
  const parts = splitInjectedArticle(html || "");

  return (
    <div className={className}>
      {parts.map((part, index) => (
        <Fragment key={index}>
          <div
            className={index === 0 ? leadClassName : undefined}
            dangerouslySetInnerHTML={{ __html: part }}
          />
          {index < parts.length - 1 ? (
            <div className="in-article-ad-slot" data-ad-slot="in-article">
              <AdSlot size="inArticle" slotKey="inArticle" className={styles.inFlow} />
            </div>
          ) : null}
        </Fragment>
      ))}
    </div>
  );
}
