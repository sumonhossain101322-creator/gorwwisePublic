import React from "react";
import styles from "./cardList.module.css";
import Pagination from "../pagination/Pagination";
import Card from "../card/Card";
import prisma from "@/utils/connect";

const CardList = async ({ page, cat }) => {
  const currentPage = Number.isInteger(Number(page)) && Number(page) > 0 ? Number(page) : 1;
  const where = { published: true, ...(cat ? { catSlug: cat } : {}) };
  const [posts, count] = await prisma.$transaction([
    prisma.post.findMany({ where, take: 2, skip: 2 * (currentPage - 1), orderBy: { createdAt: "desc" } }),
    prisma.post.count({ where }),
  ]);

  const POST_PER_PAGE = 2;

  const hasPrev = POST_PER_PAGE * (currentPage - 1) > 0;
  const hasNext = POST_PER_PAGE * currentPage < count;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Recent Posts</h1>
      <div className={styles.posts}>
        {posts?.map((item) => (
          <Card item={item} key={item.id} />
        ))}
      </div>
      <Pagination page={currentPage} cat={cat} hasPrev={hasPrev} hasNext={hasNext} />
    </div>
  );
};

export default CardList;
