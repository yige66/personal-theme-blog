'use client';

import { useEffect, useState } from 'react';
import type { BlogData, BlogStats } from '@/lib/blog';
import { createDashboardBadges } from '@/lib/experience';

type SiteDashboardProps = {
  data: BlogData;
  stats: BlogStats;
};

function formatClock(date: Date): string {
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(date);
}

function formatUptime(startDate: string, now: Date): string {
  const start = new Date(startDate).getTime();
  const diff = Math.max(0, now.getTime() - start);
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff / 3_600_000) % 24);
  return `${days}d ${hours}h`;
}

export function SiteDashboard({ data, stats }: SiteDashboardProps) {
  const firstPostDate = data.posts.at(-1)?.createdAt || data.posts[0]?.createdAt || '2026-06-28';
  const [now, setNow] = useState<Date | null>(null);
  const badges = createDashboardBadges(data, stats);

  useEffect(() => {
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="xh-site-dashboard" data-motion="portal-card" aria-label="站点运行状态">
      <div className="xh-dashboard-clock">
        <strong>{now ? formatClock(now) : '--:--:--'}</strong>
        <span>Local Time</span>
      </div>
      <div className="xh-dashboard-meta">
        <span><i />系统已稳定运行</span>
        <strong>{now ? formatUptime(firstPostDate, now) : `${data.site.streak} days`}</strong>
        <small>{data.site.location} / {data.site.assistantName}</small>
      </div>
      <div className="xh-dashboard-badges" aria-label="内容统计">
        {badges.map((badge) => (
          <span className={`tone-${badge.tone}`} key={badge.label}>
            <strong>{badge.value}</strong>
            <small>{badge.label}</small>
          </span>
        ))}
      </div>
      <div className="xh-stack-list">
        <span>Next.js 16</span>
        <span>React 19</span>
        <span>GitHub</span>
        <span>Vercel</span>
      </div>
    </section>
  );
}
