# Responsive blog article refactor

## Files
- `SinglePage.tsx` — Next.js App Router Server Component and `generateMetadata`.
- `singlePage.module.css` — responsive layout, theme tokens, reduced motion, focus states.
- `components/ShareBar`, `ReadingProgress`, `BackToTop` — small client components.
- `components/AuthorCard` — server component and CSS module.
- `components/TableOfContents` — generated TOC with active-section tracking via `IntersectionObserver`.
- `components/CommentsLoader.tsx` — client boundary for lazy comments loading.
- `components/JsonLd` and `lib/seo.ts` — structured data and SEO helpers.

## Install / assumptions
```bash
npm install isomorphic-dompurify
```
This implementation assumes the Next.js App Router, TypeScript, the existing `@/` alias,
and that the existing `Menu` and `Comments` components remain at their original paths.
`Comments` is dynamically imported with `ssr: false` from this server page. If your
Comments module uses a named export, adjust the import accordingly.

Set `NEXT_PUBLIC_SITE_URL` to the production origin, e.g. `https://www.example.com`.
The `/logo.png` and all `/p*.jpg` files must exist in `public/`. The hero uses
`next/image` with `priority`, `fill`, and `sizes="100vw"`; the existing rich-HTML gallery
images remain CMS HTML images and are lazy-loaded. For a fully optimized gallery,
store image records separately and render them as `next/image` components rather than
embedding arbitrary `<img>` tags in the HTML string.

## Important integration notes
- Replace `DUMMY_POST` with `await getPostBySlug(params.slug)` and make the page route
  accept the slug. Update `generateMetadata` to use the same database lookup.
- Ensure your CMS description uses semantic `<h2>` / `<h3>` hierarchy and meaningful
  image alt text. The sanitizer strips unsafe markup and attributes.
- The TOC links are generated from heading text. If duplicate headings are possible,
  generate unique heading IDs at content-authoring time and pass them through the sanitizer.
- The table scroll behavior is native overflow scrolling. If you want a visible fade/scroll
  hint, add a wrapper around each table in the CMS renderer; CSS cannot reliably wrap a
  raw table string without changing the HTML structure.
- Add the article URL to `sitemap.xml` (or your sitemap route), ensure category/author
  routes exist, and replace the placeholder category URL if your route differs.
- Verify actual contrast for your final brand palette and validate with Lighthouse,
  axe, and real devices. LCP/CLS/INP are performance targets, not guarantees.
- If your Next.js version disallows `ssr: false` in this Server Component context, move
  the dynamic import into a tiny `"use client"` CommentsLoader component.
