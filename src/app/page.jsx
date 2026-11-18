import styles from "./homepage.module.css";
import Featured from "@/components/featured/Featured";
import CategoryList from "@/components/categoryList/CategoryList";
import Sports from "@/components/sports/Sports";
import PoliticsBusiness from "@/components/PoliticsBusiness/PoliticsBusiness";
import Trending from "@/components/Trending/Trending";
import AdSlot from "@/components/ads/AdSlot";
import { getHomeContent } from "@/utils/homeData";

export const dynamic = "force-dynamic";

export default async function Home() {
  const data = await getHomeContent();

  return (
    <div className={styles.container}>
      <Featured {...data.featured} />
      <Sports {...data.sports} />
      <AdSlot size="inArticle" slotKey="inFeed" />
      <PoliticsBusiness politics={data.politics} business={data.business} />
      <CategoryList columns={data.categories} />
      <Trending stories={data.trending} />
      <AdSlot size="inArticle" slotKey="inFeed" />
    </div>
  );
}
