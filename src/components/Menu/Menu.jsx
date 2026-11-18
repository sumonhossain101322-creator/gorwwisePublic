import React from "react";
import styles from "./menu.module.css";
import MenuPosts from "../menuPosts/MenuPosts";
import MenuCategories from "../menuCategories/MenuCategories";

const Menu = ({
  popular = [],
  featured = [],
  categories = [],
  editorsPickCaption,
  topicsHeading = "Discover by topic",
  showTopicsForArticle = false,
}) => {
  const pickSubtitle = editorsPickCaption ? `Best from ${editorsPickCaption}` : "Chosen by the editor";

  return (
    <div className={styles.container}>
      <h2 className={styles.subtitle}>{"What's hot"}</h2>
      <h2 className={styles.title}>Most Popular</h2>
      <MenuPosts posts={popular} withImage={false} />

      <h2 className={styles.subtitle}>{showTopicsForArticle ? "Topics for this article" : topicsHeading}</h2>
      <h2 className={styles.title}>Categories</h2>
      <MenuCategories categories={categories} />

      <h2 className={styles.subtitle}>{pickSubtitle}</h2>
      <h2 className={styles.title}>Editors Pick</h2>
      <MenuPosts
        posts={featured}
        withImage
        skeletonCount={editorsPickCaption ? 0 : 4}
        emptyMessage={
          editorsPickCaption
            ? "No Editor's Picks yet. Star up to 4 live posts on Profile → Blog list."
            : ""
        }
      />
    </div>
  );
};

export default Menu;