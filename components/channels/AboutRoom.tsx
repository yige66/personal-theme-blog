import Image from 'next/image';
import Link from 'next/link';
import type { BlogSite } from '@/lib/blog';

export function AboutRoom({ site, stats }: { site: BlogSite; stats: { posts: number; projects: number; notes: number; gallery: number } }) {
  const activityCells = Array.from({ length: 35 }, (_item, index) => ({
    id: `activity-${index}`,
    level: ((index * 7 + stats.posts + stats.notes) % 5) + 1
  }));

  return (
    <section className="main-shell about-room" aria-label="个人房间">
      <div className="about-room-toolbar" aria-hidden="true">
        <span />
        <span />
        <span />
        <strong>Profile Room</strong>
      </div>
      <div className="about-room-cover">
        <Image src={site.heroImage} alt={`${site.title} 头图`} width={1180} height={560} priority />
      </div>
      <div className="about-room-avatar">
        <Image src={site.avatar} alt={`${site.owner} 的头像`} width={180} height={180} />
      </div>
      <div className="about-room-copy">
        <p className="eyebrow">Now</p>
        <h2>{site.role}</h2>
        <p>{site.status}</p>
        <p>{site.motto}</p>
        <div className="project-actions">
          <a href={site.github} target="_blank" rel="noreferrer">GitHub</a>
          <Link href="/friends">友链</Link>
        </div>
      </div>
      <div className="about-room-console">
        <span><strong>{stats.posts}</strong>文章</span>
        <span><strong>{stats.projects}</strong>项目</span>
        <span><strong>{stats.notes}</strong>动态</span>
        <span><strong>{stats.gallery}</strong>图片</span>
      </div>
      <div className="about-room-activity" aria-label="创作活跃度">
        <small>Activity Grid</small>
        <div>
          {activityCells.map((cell) => <i data-level={cell.level} key={cell.id} />)}
        </div>
      </div>
    </section>
  );
}
