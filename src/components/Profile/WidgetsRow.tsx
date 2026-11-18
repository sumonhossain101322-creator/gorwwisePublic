'use client';

import RecentComments from './RecentComments';
import NoticeBoard from './NoticeBoard';
import TrafficSources from './TrafficSources';
import styles from './WidgetsRow.module.css';

export default function WidgetsRow({ comments = [], notices = [], sources = [] }) {
  return (
    <div className={styles.widgetsRow}>
      <RecentComments comments={comments} />
      <NoticeBoard notices={notices} />
      <TrafficSources data={sources} />
    </div>
  );
}
