import AdSlot from "@/components/ads/AdSlot";
import styles from "./singlePage.module.css";

export default function SidebarAside({ children, adSlotOne }) {
  return (
    <div className={styles.sidebarInner}>
      <div className={styles.sidebarMenu}>{children}</div>
      <div className={styles.sidebarAds} aria-label="Sidebar advertisements">
        <div className={styles.sidebarAdSlot}>
          <AdSlot size="skyscraper" slotKey="skyscraper" adSlot={adSlotOne} sticky />
        </div>
      </div>
    </div>
  );
}