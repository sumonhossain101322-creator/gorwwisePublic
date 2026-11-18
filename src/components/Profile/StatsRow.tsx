'use client';

import { FaUsers, FaFileAlt, FaHeart, FaChartBar } from 'react-icons/fa';
import styles from './StatsRow.module.css';

const ICONS = {
  views: { icon: FaUsers, color: '#d1fae5', iconColor: '#10b981' },
  posts: { icon: FaFileAlt, color: '#dbeafe', iconColor: '#2563eb' },
  likes: { icon: FaHeart, color: '#fee2e2', iconColor: '#ef4444' },
  visitors: { icon: FaChartBar, color: '#dbeafe', iconColor: '#2563eb' },
};

export default function StatsRow({ stats = [] }) {
  return (
    <div className={styles.statsRow}>
      {stats.map((stat) => {
        const theme = ICONS[stat.key] || ICONS.posts;
        const Icon = theme.icon;
        return (
          <div key={stat.key} className={styles.card}>
            <div className={styles.iconBox} style={{ backgroundColor: theme.color }}>
              <Icon color={theme.iconColor} size={20} />
            </div>
            <div className={styles.info}>
              <div className={styles.value}>{stat.value}</div>
              <div className={styles.label}>{stat.label}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
