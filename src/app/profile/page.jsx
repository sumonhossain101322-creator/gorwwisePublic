import StatsRow from '../../components/Profile/StatsRow';
import TrafficChartCard from '../../components/Profile/TrafficChartCard';
import LatestPostCard from '../../components/Profile/LatestPostCard';
import WidgetsRow from '../../components/Profile/WidgetsRow';
import BlogListTable from '../../components/Profile/BlogListTable';
import ProfileSettings from '../../components/Profile/ProfileSettings';
import { getAuthSession } from '@/utils/auth';
import { getDashboard } from '@/utils/dashboard';
import { redirect } from 'next/navigation';
import AdSlot from '@/components/ads/AdSlot';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const session = await getAuthSession();
  if (!session?.user?.email) redirect('/login');

  const data = await getDashboard(session.user.email);
  if (!data.user) redirect("/login");

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <ProfileSettings user={data.user} />
        <StatsRow stats={data.stats} />
        <div className={styles.mainGrid}>
          <TrafficChartCard data={data.traffic} />
          <LatestPostCard posts={data.latest} />
        </div>
        <WidgetsRow comments={data.comments} notices={data.notices} sources={data.sources} />
        <AdSlot size="leaderboard" slotKey="leaderboard" />
        <div className={styles.postsWithAd}>
          <BlogListTable posts={data.posts} />
          <aside className={styles.profileRail}>
            <AdSlot size="rectangle" slotKey="rectangle" sticky />
          </aside>
        </div>
      </div>
    </div>
  );
}
