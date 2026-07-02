'use client';

import { useEffect, useState } from 'react';
import type { BlogData, BlogStats } from '@/lib/blog';

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
  return `${days}天 ${hours}小时`;
}

export function SiteDashboard({ data }: SiteDashboardProps) {
  const firstPostDate = data.posts.at(-1)?.createdAt || data.posts[0]?.createdAt || '2026-06-28';
  const [now, setNow] = useState<Date | null>(null);
  const clockText = now ? formatClock(now) : '--:--:--';

  useEffect(() => {
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="xh-site-dashboard" data-motion="portal-card" aria-label="站点运行状态">
      <div className="xh-dashboard-clock">
        <strong className="xh-clock-caption" aria-label={`当前时间 ${clockText}`}>
          {clockText.split('').map((character, index) => (
            <span
              className={character === ':' ? 'xh-clock-separator' : 'xh-clock-digit'}
              key={`${character}-${index}`}
            >
              {character}
            </span>
          ))}
        </strong>
      </div>
      <div className="xh-dashboard-meta">
        <span><i />系统已稳定运行：</span>
        <strong>{now ? formatUptime(firstPostDate, now) : `${data.site.streak} 天`}</strong>
      </div>
      <div className="xh-stack-list" aria-label="技术栈">
        <span data-tech="next">Next.js 16</span>
        <span data-tech="react">React 19</span>
        <span data-tech="motion">CSS 动效</span>
      </div>
    </section>
  );
}
