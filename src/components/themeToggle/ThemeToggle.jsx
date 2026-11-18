
"use client";

import Image from "next/image";
import styles from "./themeToggle.module.css";
import { useContext } from "react";
import { ThemeContext } from "@/context/ThemeContext";

const ThemeToggle = () => {
  const { toggle, theme } = useContext(ThemeContext);
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className={`${styles.container} ${isDark ? styles.dark : styles.light}`}
      onClick={toggle}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      aria-pressed={isDark}
    >
      <Image
        src="/moon.png"
        alt=""
        width={14}
        height={14}
        priority
        className={styles.icon}
      />

      <span className={styles.ball}></span>

      <Image
        src="/sun.png"
        alt=""
        width={14}
        height={14}
        priority
        className={styles.icon}
      />
    </button>
  );
};

export default ThemeToggle;
