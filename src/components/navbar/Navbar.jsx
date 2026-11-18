"use client";

import React, { useEffect, useRef, useState } from "react";
import styles from "./navbar.module.css";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import ThemeToggle from "../themeToggle/ThemeToggle";
import dynamic from "next/dynamic";

const NotificationBell = dynamic(() => import("../notifications/NotificationBell"), {
  ssr: false,
  loading: () => null,
});

const LINKS = [
  { label: "Home", href: "/" },
  { label: "Investing", href: "/category?cat=investing" },
  { label: "Credit Cards", href: "/category?cat=credit-cards" },
  { label: "Crypto", href: "/category?cat=cryptocurrency" },
  { label: "Savings & Budgeting", href: "/category?cat=personal-finance" },
];

const SOCIALS = [
  { name: "Facebook", href: "https://facebook.com", src: "/facebook.png" },
  { name: "Instagram", href: "https://instagram.com", src: "/instagram.png" },
  { name: "TikTok", href: "https://tiktok.com", src: "/tiktok.png" },
  { name: "YouTube", href: "https://youtube.com", src: "/youtube.png" },
];

// TODO: make sure your NextAuth session callback exposes one of these.
const isAdminUser = (user) => user?.isAdmin === true || user?.role === "ADMIN";

/* ---------------------------------------------------------------------------
   Profile avatar + dropdown (Login pill when signed out)
--------------------------------------------------------------------------- */
const ProfileMenu = () => {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const wrapRef = useRef(null);
  const btnRef = useRef(null);

  // Close on navigation
  useEffect(() => setOpen(false), [pathname]);

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (status === "loading") {
    return <span className={styles.avatarSkeleton} aria-hidden="true" />;
  }

  if (!session?.user) {
    return (
      <Link href="/login" className={styles.loginLink}>
        Login
      </Link>
    );
  }

  const { name, email, image, role } = session.user;
  const initial = (name || email || "?").trim().charAt(0).toUpperCase();
  const admin = isAdminUser(session.user);
  const canWrite = role === "WRITER" || role === "ADMIN";

  return (
    <div
      className={styles.profile}
      ref={wrapRef}
      onBlur={(e) => {
        // Keyboard users tabbing out of the menu close it
        if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
      }}
    >
      <button
        ref={btnRef}
        type="button"
        className={styles.avatarBtn}
        aria-label="Account menu"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls="profile-menu"
        onClick={() => setOpen((o) => !o)}
      >
        {image && !imgFailed ? (
          <Image
            src={image}
            alt=""
            fill
            sizes="44px"
            unoptimized
            className={styles.avatarImg}
            onError={() => setImgFailed(true)}
          />
        ) : (
          <span className={styles.avatarFallback} aria-hidden="true">
            {initial}
          </span>
        )}
      </button>

      {open && (
        <div id="profile-menu" className={styles.dropdown}>
          <div className={styles.dropdownHead}>
            {name && <p className={styles.dropdownName}>{name}</p>}
            {email && <p className={styles.dropdownEmail}>{email}</p>}
          </div>
          <ul className={styles.dropdownList}>
            <li>
              <Link href="/profile" className={styles.dropdownItem}>
                Profile
              </Link>
            </li>
            {canWrite && (
              <li>
                <Link href="/write" className={styles.dropdownItem}>
                  Write
                </Link>
              </li>
            )}
            {canWrite && (
              <li>
                <Link href="/dashboard/writer" className={styles.dropdownItem}>
                  My posts
                </Link>
              </li>
            )}
            {admin && (
              <li>
                <Link href="/admin/approvals" className={styles.dropdownItem}>
                  Approvals
                </Link>
              </li>
            )}
            <li>
              <button
                type="button"
                className={`${styles.dropdownItem} ${styles.dropdownDanger}`}
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                Logout
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

/* ---------------------------------------------------------------------------
   Navbar
--------------------------------------------------------------------------- */
const Navbar = () => {
  const pathname = usePathname();
  const headerRef = useRef(null);
  const toggleRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [today, setToday] = useState("");

  // Live date (set after mount to avoid hydration mismatch)
  useEffect(() => {
    setToday(
      new Intl.DateTimeFormat("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date())
    );
  }, []);

  // Close the mobile menu on navigation
  useEffect(() => setMenuOpen(false), [pathname]);

  // Close on outside click / Escape / when resizing up to desktop
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e) => {
      if (!headerRef.current?.contains(e.target)) setMenuOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        toggleRef.current?.focus();
      }
    };
    const mq = window.matchMedia("(min-width: 901px)");
    const onMq = () => mq.matches && setMenuOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    mq.addEventListener("change", onMq);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
      mq.removeEventListener("change", onMq);
    };
  }, [menuOpen]);

  return (
    <header className={styles.navbar} ref={headerRef}>
      {/* ========== TOP HEADER ========== */}
      <div className={styles.topHeader}>
        <div className={styles.social}>
          {SOCIALS.map((s) => (
            <a key={s.name} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.name}>
              <Image src={s.src} alt="" width={20} height={20} />
            </a>
          ))}
        </div>

        <Link href="/" className={styles.logo}>
          GrowWise
        </Link>

        <div className={styles.topRight}>
          <div className={styles.themeWrapper}>
            <ThemeToggle />
          </div>

          <NotificationBell />
          <div className={styles.auth}>
            <ProfileMenu />
          </div>

          <button
            ref={toggleRef}
            type="button"
            className={styles.menuBtn}
            aria-label={menuOpen ? "Close sections menu" : "Open sections menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            onClick={() => setMenuOpen((o) => !o)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {/* ========== MOBILE / TABLET SECTIONS MENU (<= 900px) ========== */}
      {menuOpen && (
        <nav id="mobile-nav" className={styles.mobilePanel} aria-label="Sections">
          <ul className={styles.mobileList}>
            {LINKS.map((l) => (
              <li key={l.label}>
                <Link href={l.href} className={styles.mobileLink}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {/* ========== BOTTOM NAV ========== */}
      <div className={styles.bottomNav}>
        <span className={styles.date}>{today}</span>

        <nav className={styles.navLinks} aria-label="Primary">
          {LINKS.map((l) => (
            <Link key={l.label} href={l.href} className={styles.navLink}>
              {l.label}
            </Link>
          ))}
        </nav>

        <form className={styles.searchForm} role="search" action="/search" method="get">
          <input
            type="search"
            name="q"
            placeholder="Search for financial advice..."
            className={styles.searchInput}
            aria-label="Search for financial advice"
            minLength={2}
            required
          />
          <button type="submit" className={styles.searchBtn} aria-label="Search for financial advice">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </button>
        </form>
      </div>
    </header>
  );
};

export default Navbar;