import { getAuthSession } from "@/utils/auth";
import prisma from "@/utils/connect";
import Link from "next/link";
import { redirect } from "next/navigation";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

const STATUS_LABEL = {
  DRAFT: "Draft",
  PENDING_APPROVAL: "Pending Approval",
  PUBLISHED: "Published",
  PENDING_DELETE: "Pending Delete",
};

const dateLabel = (value) =>
  new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));

export default async function WriterDashboardPage() {
  const session = await getAuthSession();
  if (!session?.user?.email) redirect("/login");

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user || (user.role !== "WRITER" && user.role !== "ADMIN")) redirect("/");

  const posts = await prisma.post.findMany({
    where: { userEmail: user.email },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, slug: true, status: true, updatedAt: true },
  });

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>My posts</h1>
          <p>Drafts stay private. Submitted posts wait for an admin before they go live.</p>
        </div>
        <Link href="/write" className={styles.writeLink}>
          Write
        </Link>
      </header>

      {posts.length === 0 ? (
        <p className={styles.empty}>No posts yet.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Title</th>
                <th scope="col">Status</th>
                <th scope="col">Updated</th>
                <th scope="col">
                  <span className={styles.srOnly}>Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id}>
                  <td>{post.title}</td>
                  <td>
                    <span className={styles.status} data-status={post.status}>
                      {STATUS_LABEL[post.status] || post.status}
                    </span>
                  </td>
                  <td>{dateLabel(post.updatedAt)}</td>
                  <td>
                    {post.status === "PENDING_DELETE" ? (
                      <span className={styles.waiting}>Waiting for admin</span>
                    ) : (
                      <Link href={`/write?slug=${post.slug}`} className={styles.edit}>
                        Edit
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
