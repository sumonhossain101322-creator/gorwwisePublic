import CardList from "@/components/cardList/CardList";
import styles from "./blogPage.module.css";
import Menu from "@/components/Menu/Menu";
import { getSinglePostSidebar } from "@/utils/singlePostData";
import { labelFromSlug } from "@/utils/homeData";

export const dynamic = "force-dynamic";

const BlogPage = async ({ searchParams }) => {
  const page = parseInt(searchParams.page, 10) || 1;
  const { cat } = searchParams;
  const sidebar = await getSinglePostSidebar(null, { catSlug: cat || undefined });
  const heading = cat ? `${labelFromSlug(cat)} Blog` : "Blog";

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>{heading}</h1>
      <div className={styles.content}>
        <CardList page={page} cat={cat} />
        <Menu popular={sidebar.popular} featured={sidebar.featured} categories={sidebar.categories} />
      </div>
    </div>
  );
};

export default BlogPage;