import styles from "./footer.module.css";
import Link from "next/link";

function Icon({ children }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.icon}>
      {children}
    </svg>
  );
}

const SOCIALS = [
  {
    name: "Facebook",
    href: "https://facebook.com",
    icon: (
      <Icon>
        <path
          fill="currentColor"
          d="M14.5 8.5V6.8c0-.7.5-1 1.2-1H17V3h-2.1C12.2 3 11 4.4 11 6.6v1.9H9v2.7h2V21h3.5v-9.8h2.3l.4-2.7h-2.7z"
        />
      </Icon>
    ),
  },
  {
    name: "X",
    href: "https://x.com",
    icon: (
      <Icon>
        <path
          fill="currentColor"
          d="M14.7 10.4 21.4 3h-1.6l-5.8 6.4L9.3 3H3.4l7 10-7 7.7h1.6l6.1-6.8 4.9 6.8h5.9l-7.2-10.3zm-2.2 2.4-.7-1-5.6-7.7h2.4l4.5 6.2.7 1 5.9 8.1h-2.4l-4.8-6.6z"
        />
      </Icon>
    ),
  },
  {
    name: "WhatsApp",
    href: "https://whatsapp.com",
    icon: (
      <Icon>
        <path
          fill="currentColor"
          d="M12.1 3.2A8.7 8.7 0 0 0 4.6 16.3L3.5 20.7l4.5-1.2a8.7 8.7 0 0 0 4.1 1 8.8 8.8 0 0 0 0-17.5zm0 16a7.2 7.2 0 0 1-3.7-1l-.3-.2-2.7.7.7-2.6-.2-.3a7.2 7.2 0 1 1 6.2 3.4zm4-5.4c-.2-.1-1.3-.6-1.5-.7-.2-.1-.3-.1-.5.1l-.6.7c-.1.2-.3.2-.5.1a5.9 5.9 0 0 1-2.9-2.5c-.2-.3 0-.4.1-.6l.4-.5.1-.3c0-.1 0-.3-.1-.4l-.7-1.6c-.2-.4-.4-.4-.5-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 1.9s.8 2.2.9 2.3c.1.2 1.6 2.5 3.9 3.4 1.4.6 1.7.5 2.3.4.4-.1 1.3-.5 1.4-1 .2-.5.2-.9.1-1 0-.1-.2-.1-.4-.2z"
        />
      </Icon>
    ),
  },
  {
    name: "TikTok",
    href: "https://tiktok.com",
    icon: (
      <Icon>
        <path
          fill="currentColor"
          d="M14.2 3c.4 2.4 1.8 4 4.1 4.4v2.4c-1.4 0-2.7-.4-3.9-1.2v6.6c0 3.3-2.6 5.8-5.9 5.8S2.6 18.5 2.6 15.2c0-3.2 2.5-5.7 5.7-5.8v2.6c-1.7.1-3 1.5-3 3.2 0 1.8 1.4 3.2 3.2 3.2s3.2-1.4 3.2-3.2V3h2.5z"
        />
      </Icon>
    ),
  },
  {
    name: "Instagram",
    href: "https://instagram.com",
    icon: (
      <Icon>
        <rect x="4" y="4" width="16" height="16" rx="4" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="12" cy="12" r="3.6" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="17.2" cy="6.8" r="1" fill="currentColor" />
      </Icon>
    ),
  },
];

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.top}>
        <div className={styles.social}>
          {SOCIALS.map((item) => (
            <a key={item.name} href={item.href} target="_blank" rel="noopener noreferrer" aria-label={item.name}>
              {item.icon}
            </a>
          ))}
        </div>
      </div>

      <div className={styles.divider}></div>

      <div className={styles.middle}>
        <div className={styles.logoSection}>
          <Link href="/" className={styles.logo}>
            <span className={styles.logoTimes}>GrowWise</span>
          </Link>
        </div>

        <div className={styles.info}>
          <p>GrowWise is the premier digital publication for financial literacy and wealth building in the US and Europe. We provide actionable advice on investing, credit, and crypto.</p>
        </div>
      </div>

      <div className={styles.divider}></div>

      <div className={styles.bottom}>
        <p className={styles.copyright}>© 2024 GrowWise. All rights reserved.</p>

        <div className={styles.links}>
          <Link href="/about">About Us</Link>
          <span className={styles.separator}>|</span>
          <Link href="/privacy">Privacy Policy</Link>
          <span className={styles.separator}>|</span>
          <Link href="/terms">Terms of Service</Link>
          <span className={styles.separator}>|</span>
          <Link href="/advertise">Advertise with Us</Link>
          <span className={styles.separator}>|</span>
          <Link href="/contact">Contact</Link>
        </div>
      </div>
    </footer>
  );
}
