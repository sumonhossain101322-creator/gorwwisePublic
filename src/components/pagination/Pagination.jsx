"use client";

import React from "react";
import styles from "./pagination.module.css";
import { useRouter } from "next/navigation";

const Pagination = ({ page, cat, hasPrev, hasNext }) => {
  const router = useRouter();
  const navigate = (nextPage) => {
    const params = new URLSearchParams();
    params.set("page", String(nextPage));
    if (cat) params.set("cat", cat);
    router.push(`?${params.toString()}`);
  };

  return (
    <div className={styles.container}>
      <button
        className={styles.button}
        disabled={!hasPrev}
        onClick={() => navigate(page - 1)}
      >
        Previous
      </button>
      <button
        disabled={!hasNext}
        className={styles.button}
        onClick={() => navigate(page + 1)}
      >
        Next
      </button>
    </div>
  );
};

export default Pagination;
