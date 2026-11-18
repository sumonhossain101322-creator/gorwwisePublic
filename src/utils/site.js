export function siteOrigin() {
  const base = process.env.NEXTAUTH_URL?.trim() || process.env.VERCEL_URL?.trim() || "http://localhost:3000";
  return (base.startsWith("http") ? base : `https://${base}`).replace(/\/$/, "");
}

export function absoluteUrl(path = "/") {
  if (typeof path === "string" && /^https?:\/\//i.test(path)) return path;
  const normalized = path?.startsWith("/") ? path : `/${path || ""}`;
  return `${siteOrigin()}${normalized}`;
}
