import sanitizeHtml from "sanitize-html";

const isCloudinaryImage = (src) => {
  if (typeof src !== "string" || src.length > 2048) return false;
  try {
    const url = new URL(src);
    return url.protocol === "https:" && url.hostname === "res.cloudinary.com";
  } catch {
    return false;
  }
};

export const cleanHtml = (html) => sanitizeHtml(html, {
  allowedTags: ["p", "br", "strong", "b", "em", "i", "u", "s", "blockquote", "ol", "ul", "li", "h1", "h2", "h3", "a", "img"],
  allowedAttributes: { a: ["href", "target", "rel"], img: ["src", "alt"] },
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesByTag: { img: ["https"] },
  exclusiveFilter: (frame) => frame.tag === "img" && !isCloudinaryImage(frame.attribs?.src),
  transformTags: {
    h1: sanitizeHtml.simpleTransform("h2"),
    a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }),
    img: (tagName, attribs) => ({
      tagName,
      attribs: {
        src: attribs.src,
        alt: typeof attribs.alt === "string" ? attribs.alt.slice(0, 180) : "",
      },
    }),
  },
});
