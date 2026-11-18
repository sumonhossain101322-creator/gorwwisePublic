'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import styles from './TrafficChartCard.module.css';

export default function TrafficChartCard({ data = [] }) {
  const axisColor = "var(--softTextColor)";
  const gridColor = "var(--borderColor)";
  const chartBlue = "var(--primary)";
  const peak = data.reduce((max, item) => Math.max(max, Number(item.value) || 0), 0);
  const domainMax = peak > 0 ? Math.ceil(peak * 1.15) : 10;
  return (
    <div className={styles.card}>
      <h3 className={styles.header}>Traffic stats</h3>
      <div className={styles.chartContainer}>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={chartBlue} stopOpacity={0.3} />
              <stop offset="95%" stopColor={chartBlue} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={true} vertical={false} />
            <XAxis dataKey="month" stroke={axisColor} fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke={axisColor} fontSize={12} tickLine={false} axisLine={false} domain={[0, domainMax]} />
            <Tooltip contentStyle={{ background: "var(--cardBg)", borderColor: "var(--borderColor)", color: "var(--textColor)" }} labelStyle={{ color: "var(--textColor)" }} />
            <Area type="monotone" dataKey="value" stroke={chartBlue} strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
