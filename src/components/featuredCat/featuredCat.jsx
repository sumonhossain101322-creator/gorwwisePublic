
import styles from "./featuredCat.module.css";
import Image from "next/image";
import Link from "next/link";

const CategoryPill = ({ label, color }) => (
  <span className={`${styles.pill} ${styles[color]}`}>
    <span className={styles.pillDot}></span>
    {label}
  </span>
);

const FeaturedCat = () => {
  const mainStory = {
    title: "The Ultimate Guide to Building Wealth in Your 30s",
    desc: "A practical plan for growing your savings, investing consistently, and making your long-term goals achievable.",
    category: "Personal Finance", categoryColor: "green", author: "Sarah Jenkins, CFP", avatar: "/p1.jpg", date: "Jun 10, 2024", readTime: "8 min read", img: "/p1.jpg", slug: "building-wealth-in-your-30s",
  };
  const topRightStory = {
    title: "How to Start Investing in UCITS ETFs in Europe",
    category: "Investing", categoryColor: "blue", author: "Amelia Hart, CFA", date: "Jun 08, 2024", img: "/p2.jpg", slug: "ucits-etfs-europe",
  };
  const bottomStories = [
    { title: "Best Travel Credit Cards for US Citizens", category: "Credit Cards", categoryColor: "blue", author: "Michael Chen", date: "Jun 06, 2024", img: "/p3.jpg", slug: "best-travel-credit-cards" },
    { title: "Is Bitcoin a Good Hedge Against Inflation?", category: "Cryptocurrency", categoryColor: "yellow", author: "David Brooks", date: "Jun 04, 2024", img: "/p4.jpg", slug: "bitcoin-inflation-hedge" },
  ];

  return (
    <section className={styles.wrapper}>
      {/* Trending Banner */}
      <div className={styles.trendingBanner}>
        <div className={styles.trendingLeft}>
          <span className={styles.trendingLabel}>Trending:</span>
          <span className={styles.trendingText}>
            How to build long-term wealth with a plan you can stick to
          </span>
        </div>
        <div className={styles.trendingArrows}>
          <button aria-label="Previous">â€¹</button>
          <button aria-label="Next">â€º</button>
        </div>
      </div>

      {/* Main Grid */}
      <div className={styles.grid}>
        {/* LEFT - Large Hero Card */}
        <Link href={`/posts/${mainStory.slug}`} className={styles.heroCard}>
          <Image
            src={mainStory.img}
            alt={mainStory.title}
            fill
            className={styles.cardImage}
            sizes="(max-width: 900px) 100vw, 50vw"
            priority
          />
          <div className={styles.overlay}></div>

          {/* Star Icon */}
          <div className={styles.starIcon}>â˜…</div>

          <div className={styles.cardContent}>
            <CategoryPill label={mainStory.category} color={mainStory.categoryColor} />
            <h2 className={styles.heroTitle}>{mainStory.title}</h2>
            <p className={styles.heroDesc}>{mainStory.desc}</p>

            <div className={styles.meta}>
              <Image
                src={mainStory.avatar}
                alt={mainStory.author}
                width={28}
                height={28}
                className={styles.avatar}
              />
              <span>by {mainStory.author}</span>
              <span className={styles.metaDot}>â€¢</span>
              <span>{mainStory.date}</span>
              <span className={styles.metaDot}>â€¢</span>
              <span>{mainStory.readTime}</span>
            </div>
          </div>
        </Link>

        {/* RIGHT SIDE */}
        <div className={styles.rightColumn}>
          {/* Top Right - Wide Card */}
          <Link href={`/posts/${topRightStory.slug}`} className={styles.wideCard}>
            <Image
              src={topRightStory.img}
              alt={topRightStory.title}
              fill
              className={styles.cardImage}
              sizes="(max-width: 900px) 100vw, 50vw"
            />
            <div className={styles.overlay}></div>

            <div className={styles.cardContent}>
              <CategoryPill
                label={topRightStory.category}
                color={topRightStory.categoryColor}
              />
              <h3 className={styles.wideTitle}>{topRightStory.title}</h3>
              <div className={styles.meta}>
                <span>by {topRightStory.author}</span>
                <span className={styles.metaDot}>â€¢</span>
                <span>{topRightStory.date}</span>
              </div>
            </div>
          </Link>

          {/* Bottom Two Cards */}
          <div className={styles.smallGrid}>
            {bottomStories.map((story) => (
              <Link
                href={`/posts/${story.slug}`}
                key={story.slug}
                className={styles.smallCard}
              >
                <Image
                  src={story.img}
                  alt={story.title}
                  fill
                  className={styles.cardImage}
                  sizes="(max-width: 900px) 100vw, 25vw"
                />
                <div className={styles.overlay}></div>

                <div className={styles.cardContent}>
                  <CategoryPill
                    label={story.category}
                    color={story.categoryColor}
                  />
                  <h4 className={styles.smallTitle}>{story.title}</h4>
                  <div className={styles.meta}>
                    <span>by {story.author}</span>
                    <span className={styles.metaDot}>â€¢</span>
                    <span>{story.date}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturedCat;
