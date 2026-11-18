'use client';

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import styles from './TrafficSources.module.css';

const COLORS = ['#2563eb', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#0f766e'];

export default function TrafficSources({ data = [] }) {
  const colored = data.map((item, index) => ({ ...item, color: COLORS[index % COLORS.length] }));
  return (
    <div className={styles.card}>
      <div className={styles.headerRow}>
        <h3 className={styles.header}>Traffic sources</h3>
        <a href="#" className={styles.viewAll}>View all</a>
      </div>
      <div className={styles.chartContainer}>
        {colored.length > 0 ? (
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={colored}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
            >
              {colored.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        ) : null}
      </div>
      <div className={styles.legend}>
        {colored.map((item, index) => (
          <div key={index} className={styles.legendItem}>
            <span className={styles.dot} style={{ backgroundColor: item.color }} />
            <span>{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
