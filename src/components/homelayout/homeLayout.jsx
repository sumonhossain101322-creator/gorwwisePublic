
import styles from "./homeLayout.module.css";
import Image from "next/image";
import Link from "next/link";

const CategoryBadge = ({ label, color }) => (
  <span className={`${styles.badge} ${styles[color]}`}>
    <span className={styles.badgeDot}></span>
    {label}
  </span>
);

export default function HomeLayout() {
  // ========== DUMMY DATA ==========
  const highlightPosts = [
    { title: "The Ultimate Guide to Building Wealth in Your 30s", excerpt: "Build a resilient financial foundation with a clear savings plan, diversified investments, and habits that compound over time.", category: "Personal Finance", categoryColor: "green", author: "Sarah Jenkins, CFP", avatar: "/p1.jpg", date: "Jun 10, 2024", img: "/p1.jpg", slug: "building-wealth-in-your-30s" },
    { title: "How to Start Investing in UCITS ETFs in Europe", excerpt: "Understand fund costs, diversification, account choices, and the first practical steps for a long-term portfolio.", category: "Investing", categoryColor: "blue", author: "Amelia Hart, CFA", avatar: "/p2.jpg", date: "Jun 08, 2024", img: "/p2.jpg", slug: "ucits-etfs-europe" },
  ];
  const regularPosts = [
    { title: "Best Travel Credit Cards for US Citizens", excerpt: "Compare annual fees, travel protections, and rewards to find a card that suits your spending.", category: "Credit Cards", categoryColor: "blue", author: "Michael Chen", avatar: "/p3.jpg", date: "Jun 06, 2024", img: "/p3.jpg", slug: "best-travel-credit-cards" },
    { title: "Is Bitcoin a Good Hedge Against Inflation?", excerpt: "A balanced look at Bitcoin's volatility, inflation history, and the role digital assets may play in a portfolio.", category: "Cryptocurrency", categoryColor: "yellow", author: "David Brooks", avatar: "/p4.jpg", date: "Jun 04, 2024", img: "/p4.jpg", slug: "bitcoin-inflation-hedge" },
    { title: "The 50/30/20 Rule: Does It Still Work in 2024?", excerpt: "Adapt a familiar budgeting framework to today's housing costs, income, and financial priorities.", category: "Personal Finance", categoryColor: "green", author: "Sarah Jenkins, CFP", avatar: "/p5.jpg", date: "Jun 02, 2024", img: "/p5.jpg", slug: "50-30-20-rule" },
    { title: "Buying Your First Rental Property: A Numbers-First Guide", excerpt: "Estimate cash flow, financing costs, and ongoing expenses before you make an offer.", category: "Real Estate", categoryColor: "green", author: "Daniel Foster", avatar: "/p6.jpg", date: "May 30, 2024", img: "/p6.jpg", slug: "first-rental-property" },
  ];
  const trendingTopics = [
    { name: "Investing", img: "/p1.jpg" }, { name: "Personal Finance", img: "/p2.jpg" }, { name: "Credit Cards", img: "/p3.jpg" }, { name: "Cryptocurrency", img: "/p4.jpg" }, { name: "Real Estate", img: "/p5.jpg" }, { name: "Insurance", img: "/p6.jpg" },
  ];
  const recentPosts = [
    { title: "Best Travel Credit Cards for US Citizens", date: "Jun 06, 2024", img: "/p1.jpg", slug: "best-travel-credit-cards" },
    { title: "How to Start Investing in UCITS ETFs in Europe", date: "Jun 08, 2024", img: "/p2.jpg", slug: "ucits-etfs-europe" },
    { title: "Is Bitcoin a Good Hedge Against Inflation?", date: "Jun 04, 2024", img: "/p3.jpg", slug: "bitcoin-inflation-hedge" },
    { title: "Build an Emergency Fund That Fits Your Life", date: "May 28, 2024", img: "/p4.jpg", slug: "emergency-fund" },
  ];

  return (
    <div className={styles.container}>
      {/* ================= MAIN CONTENT ================= */}
      <main className={styles.main}>
        {/* Today's Top Highlights */}
        <section className={styles.highlights}>
          <div className={styles.sectionHeader}>
            <div className={styles.headerIcon}>â³</div>
            <div>
              <h2 className={styles.sectionTitle}>Today&apos;s top highlights</h2>
              <p className={styles.sectionSubtitle}>
                Latest breaking news, pictures, videos, and special reports
              </p>
            </div>
          </div>

          <div className={styles.postsGrid}>
            {highlightPosts.map((post) => (
              <article key={post.slug} className={styles.postCard}>
                <Link href={`/posts/${post.slug}`} className={styles.postImageWrapper}>
                  <Image
                    src={post.img}
                    alt={post.title}
                    fill
                    className={styles.postImage}
                    sizes="(max-width: 900px) 100vw, 35vw"
                  />
                  <CategoryBadge label={post.category} color={post.categoryColor} />
                </Link>

                <Link href={`/posts/${post.slug}`}>
                  <h3 className={styles.postTitle}>{post.title}</h3>
                </Link>
                <p className={styles.postExcerpt}>{post.excerpt}</p>

                <div className={styles.author}>
                  <Image
                    src={post.avatar}
                    alt={post.author}
                    width={32}
                    height={32}
                    className={styles.avatar}
                  />
                  <span className={styles.authorName}>by {post.author}</span>
                  <span className={styles.dot}>â€¢</span>
                  <span className={styles.date}>{post.date}</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Regular Posts Grid */}
        <section className={styles.regularPosts}>
          <div className={styles.postsGrid}>
            {regularPosts.map((post) => (
              <article key={post.slug} className={styles.postCard}>
                <Link href={`/posts/${post.slug}`} className={styles.postImageWrapper}>
                  <Image
                    src={post.img}
                    alt={post.title}
                    fill
                    className={styles.postImage}
                    sizes="(max-width: 900px) 100vw, 35vw"
                  />
                  <CategoryBadge label={post.category} color={post.categoryColor} />
                </Link>

                <Link href={`/posts/${post.slug}`}>
                  <h3 className={styles.postTitle}>{post.title}</h3>
                </Link>
                <p className={styles.postExcerpt}>{post.excerpt}</p>

                <div className={styles.author}>
                  <Image
                    src={post.avatar}
                    alt={post.author}
                    width={32}
                    height={32}
                    className={styles.avatar}
                  />
                  <span className={styles.authorName}>by {post.author}</span>
                  <span className={styles.dot}>â€¢</span>
                  <span className={styles.date}>{post.date}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      {/* ================= SIDEBAR ================= */}
      <aside className={styles.sidebar}>
        {/* Social Stats */}
        <div className={styles.socialStats}>
          <div className={`${styles.socialBox} ${styles.facebook}`}>
            <span className={styles.socialIcon}>f</span>
            <div>
              <strong>1.5K</strong>
              <span>Fans</span>
            </div>
          </div>
          <div className={`${styles.socialBox} ${styles.instagram}`}>
            <span className={styles.socialIcon}>ðŸ“·</span>
            <div>
              <strong>1.8M</strong>
              <span>Followers</span>
            </div>
          </div>
          <div className={`${styles.socialBox} ${styles.youtube}`}>
            <span className={styles.socialIcon}>â–¶</span>
            <div>
              <strong>22K</strong>
              <span>Subs</span>
            </div>
          </div>
        </div>

        {/* Trending Topics */}
        <div className={styles.sidebarBlock}>
          <h3 className={styles.sidebarTitle}>Trending topics</h3>
          <div className={styles.topicsList}>
            {trendingTopics.map((topic) => (
              <Link href={`/category/${topic.name.toLowerCase()}`} key={topic.name} className={styles.topicCard}>
                <Image
                  src={topic.img}
                  alt={topic.name}
                  fill
                  className={styles.topicImage}
                  sizes="300px"
                />
                <div className={styles.topicOverlay}></div>
                <span className={styles.topicName}>{topic.name}</span>
              </Link>
            ))}
          </div>
          <Link href="/categories" className={styles.viewAll}>
            View all categories
          </Link>
        </div>

        {/* Recent Posts */}
        <div className={styles.sidebarBlock}>
          <h3 className={styles.sidebarTitle}>Recent post</h3>
          <div className={styles.recentList}>
            {recentPosts.map((post) => (
              <Link href={`/posts/${post.slug}`} key={post.slug} className={styles.recentItem}>
                <div className={styles.recentImg}>
                  <Image
                    src={post.img}
                    alt={post.title}
                    fill
                    className={styles.recentImage}
                    sizes="70px"
                  />
                </div>
                <div className={styles.recentContent}>
                  <h4>{post.title}</h4>
                  <span>{post.date}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Advertisement */}
        <div className={styles.adBox}>
          <div className={styles.adContent}>
            <span className={styles.adLabel}>Advertisement</span>
            <span className={styles.adPlace}>Place your Ad here</span>
          </div>
          <div className={styles.adImage}>
            <Image
              src="/p1.jpg"
              alt="Advertisement"
              fill
              className={styles.adImg}
              sizes="300px"
            />
          </div>
        </div>
      </aside>
    </div>
  );
}