import Link from 'next/link';
import type { BlogData, BlogStats } from '@/lib/blog';
import { createSpaceModules, createSpaceSignals, experienceRoutes } from '@/lib/experience';

type SpaceDockProps = {
  data: BlogData;
  stats: BlogStats;
};

export function SpaceDock({ data, stats }: SpaceDockProps) {
  const modules = createSpaceModules(data, stats);
  const signals = createSpaceSignals(data, stats);
  const routeCount = experienceRoutes.length;

  return (
    <section className="xh-space-dock" data-motion="portal-card" aria-label="站点频道模块">
      <div className="xh-space-copy">
        <p className="eyebrow">Portal Index</p>
        <h2>{data.site.title}</h2>
        <p>
          把文章、照片、音乐与日常拆成清晰频道，首页只保留入口、推荐和状态，让真正的内容在对应栏目里展开。
        </p>
        <div className="xh-space-route-line" aria-hidden="true">
          <span />
          <i />
          <span />
        </div>
      </div>

      <div className="xh-space-modules" aria-label="频道入口">
        {modules.map((module) => (
          <Link className="xh-space-module" href={module.href} key={module.href}>
            <em>{module.coordinate}</em>
            <small>{module.label}</small>
            <strong>{module.title}</strong>
            <span>{module.detail}</span>
            <b>{module.value}</b>
          </Link>
        ))}
      </div>

      <div className="xh-space-status" aria-label="站点状态">
        <span><strong>Online</strong><small>频道同步中</small></span>
        <span><strong>{data.site.streak} Days</strong><small>连续维护</small></span>
        <span><strong>{data.site.assistantName}</strong><small>数据源可改名</small></span>
        <span><strong>{routeCount} Routes</strong><small>全站星轨</small></span>
      </div>

      <div className="xh-space-marquee" aria-hidden="true">
        <span>{signals.join(' / ')}</span>
        <span>{signals.join(' / ')}</span>
      </div>
    </section>
  );
}
