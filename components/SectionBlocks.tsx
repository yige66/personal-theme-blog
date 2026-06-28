import Image from 'next/image';
import Link from 'next/link';
import type { BlogProject, BlogStats, GalleryItem, MusicTrack } from '@/lib/blog';
import { formatDate } from '@/lib/blog';

export function PageHero({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <header className="page-hero main-shell">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p>{description}</p>
    </header>
  );
}

export function StatPortal({ stats }: { stats: BlogStats }) {
  const items = [
    { href: '/archive', label: '文章', value: stats.posts },
    { href: '/tags', label: '标签', value: stats.tags },
    { href: '/projects', label: '项目', value: stats.projects },
    { href: '/gallery', label: '相册', value: stats.gallery },
    { href: '/music', label: '音乐', value: stats.tracks },
    { href: '/moments', label: '动态', value: stats.notes }
  ];

  return (
    <section className="main-shell portal-grid" aria-label="站点入口">
      {items.map((item) => (
        <Link className="glass-card portal-card" href={item.href} key={item.href}>
          <strong>{item.value}</strong>
          <span>{item.label}</span>
        </Link>
      ))}
    </section>
  );
}

export function ProjectCard({ project }: { project: BlogProject }) {
  return (
    <article className="glass-card project-card">
      <Link className="project-cover" href={project.url || '#'}>
        <Image src={project.cover} alt={`${project.title} 封面`} width={640} height={400} />
      </Link>
      <div>
        <p className="eyebrow">{project.status}</p>
        <h3>{project.title}</h3>
        <p>{project.description}</p>
        <div className="tag-row">
          {project.tags.map((tag) => <span key={tag}>{tag}</span>)}
        </div>
        <div className="project-actions">
          <Link href={project.url || '#'}>查看项目</Link>
          {project.repo ? <a href={project.repo} target="_blank" rel="noreferrer">Repository</a> : null}
        </div>
      </div>
    </article>
  );
}

export function MusicTrackCard({ track, index }: { track: MusicTrack; index: number }) {
  return (
    <article className="glass-card track-card">
      <span>{String(index + 1).padStart(2, '0')}</span>
      <div>
        <h3>{track.title}</h3>
        <p>{track.artist} / {track.mood || '阅读背景'}</p>
      </div>
      {track.url ? <audio controls src={track.url}>浏览器不支持音频播放。</audio> : <small>等待在后台补充音频地址</small>}
    </article>
  );
}

export function GalleryTile({ item }: { item: GalleryItem }) {
  return (
    <article className="gallery-item gallery-tile">
      <Image src={item.image} alt={item.alt || item.title} width={720} height={460} />
      <div>
        <strong>{item.title}</strong>
        <span>{item.description}</span>
      </div>
    </article>
  );
}

export function TimelineDate({ value }: { value: string }) {
  return <time dateTime={value}>{formatDate(value)}</time>;
}
