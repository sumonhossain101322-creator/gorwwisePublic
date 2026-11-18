import ApprovalList, { ApprovalItem } from "./ApprovalList";
import { getAuthSession } from "@/utils/auth";
import { cleanHtml } from "@/utils/cleanHtml";
import prisma from "@/utils/connect";
import { plainExcerpt, labelFromSlug } from "@/utils/homeData";
import { WRITE_CATEGORY_LABELS } from "@/utils/writeCategories";
import { redirect } from "next/navigation";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

type Payload = {
  title?: unknown;
  desc?: unknown;
  excerpt?: unknown;
  catSlug?: unknown;
  img?: unknown;
  bio?: unknown;
  reason?: unknown;
  message?: unknown;
};

const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");

const categoryName = (slug: string) =>
  WRITE_CATEGORY_LABELS[slug as keyof typeof WRITE_CATEGORY_LABELS] || (slug ? labelFromSlug(slug) : "");

export default async function AdminApprovalsPage() {
  const session = await getAuthSession();
  if (!session?.user?.email) redirect("/login");

  const admin = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { role: true },
  });
  if (admin?.role !== "ADMIN") redirect("/");

  const rows = await prisma.approvalRequest.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "desc" },
    include: {
      requester: { select: { name: true, email: true, image: true } },
      targetPost: {
        select: { title: true, slug: true, desc: true, img: true, excerpt: true, catSlug: true, status: true },
      },
    },
  });

  const requests: ApprovalItem[] = rows.map((row) => {
    const payload = (row.payload && typeof row.payload === "object" ? row.payload : {}) as Payload;
    const fromPost = row.type === "POST_DELETE";
    const title = fromPost ? row.targetPost?.title || "Untitled" : text(payload.title) || row.targetPost?.title || "Untitled";
    const htmlSource = fromPost ? row.targetPost?.desc || "" : text(payload.desc) || row.targetPost?.desc || "";
    const html = htmlSource ? cleanHtml(htmlSource) : "";
    const excerpt = fromPost
      ? row.targetPost?.excerpt?.trim() || plainExcerpt(html, 220)
      : text(payload.excerpt) || plainExcerpt(html, 220);
    const category = categoryName(fromPost ? row.targetPost?.catSlug || "" : text(payload.catSlug) || row.targetPost?.catSlug || "");
    const image = fromPost ? row.targetPost?.img || "" : text(payload.img) || row.targetPost?.img || "";
    const reason = text(payload.reason) || text(payload.message);
    const bio = text(payload.bio);
    const isRole = row.type === "ROLE_UPGRADE";
    const note =
      row.type === "POST_DELETE"
        ? "Approving permanently deletes this article and its comments."
        : row.type === "POST_UPDATE"
          ? "Approving replaces the live article with this version."
          : row.type === "POST_CREATE"
            ? "Approving publishes this article."
            : "Approving lets this reader publish from the Write page.";

    return {
      id: row.id,
      type: row.type,
      createdAt: row.createdAt.toISOString(),
      requesterName: row.requester?.name || row.requester?.email || "A writer",
      requesterEmail: row.requester?.email || "",
      requesterImage: row.requester?.image || "",
      postTitle: row.targetPost?.title || title,
      summary: isRole ? reason || bio || "No reason given." : excerpt || "No summary yet.",
      note,
      liveHref: row.targetPost?.status === "PUBLISHED" && row.targetPost.slug ? `/posts/${row.targetPost.slug}` : "",
      preview: isRole
        ? null
        : { title, excerpt, category, image, html },
      application: isRole ? { bio, reason } : null,
    };
  });

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>Queue</p>
          <h1>Approvals</h1>
          <p>Read the full piece before you publish, replace, or remove it.</p>
        </div>
        <span className={styles.count}>{requests.length} waiting</span>
      </header>
      <ApprovalList requests={requests} />
    </main>
  );
}
