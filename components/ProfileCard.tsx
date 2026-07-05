import Image from 'next/image';
import Link from 'next/link';
import { BlogSite, BlogStats } from '@/lib/blog';

export function ProfileCard({ site, stats }: { site: BlogSite; stats: BlogStats }) {
  return (
    <aside className="glass-card profile-card" aria-label="作者名片">
      <div className="profile-glow" aria-hidden="true" />
      <div className="avatar-ring">
        <Image src={site.avatar} alt={`${site.owner} 的头像`} width={112} height={112} priority />
      </div>
      <div className="profile-copy">
        <p className="eyebrow">Personal Card</p>
        <h2>{site.owner}</h2>
        <p className="role">{site.role}</p>
        <p className="motto">{site.motto}</p>
      </div>
      <div className="level-panel" aria-label="等级信息">
        <div>
          <span>Lv.{site.level}</span>
          <strong>{site.experience}%</strong>
        </div>
        <div className="level-track"><i style={{ width: `${site.experience}%` }} /></div>
      </div>
      <div className="profile-stats">
        <span><strong>{stats.posts}</strong>文章</span>
        <span><strong>{stats.tags}</strong>标签</span>
        <span><strong>{site.streak}</strong>连续天</span>
      </div>
      <div className="profile-actions">
        <Link href="/about">关于我</Link>
        <a href={site.github} target="_blank" rel="noreferrer">GitHub</a>
      </div>
    </aside>
  );
}
