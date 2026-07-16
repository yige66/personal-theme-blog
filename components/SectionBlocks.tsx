import Image from 'next/image';
import Link from 'next/link';
import type { BlogNote, BlogProject, BlogStats, GalleryItem, MusicTrack } from '@/lib/blog';
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
    { href: '/archive', label: '??', value: stats.posts },
    { href: '/tags', label: '??', value: stats.tags },
    { href: '/projects', label: '??', value: stats.projects },
    { href: '/photowall', label: '??', value: stats.gallery },
    { href: '/music', label: '??', value: stats.tracks },
    { href: '/moments', label: '??', value: stats.notes }
  ];

  return (
    <section className="main-shell portal-grid" aria-label="????">
      {items.map((item) => (
        <Link className="portal-card" href={item.href} key={item.href}>
          <strong>{item.value}</strong>
          <span>{item.label}</span>
        </Link>
      ))}
    </section>
  );
}

export function PageInsightBar({
  items,
  action
}: {
  items: Array<{ label: string; value: string | number; caption: string }>;
  action?: { href: string; label: string };
}) {
  return (
    <section className="main-shell page-insight-bar" aria-label="????">
      <div className="page-insight-items">
        {items.map((item) => (
          <div className="page-insight-item" key={`${item.label}-${item.value}`}>
            <strong>{item.value}</strong>
            <span>{item.label}</span>
            <small>{item.caption}</small>
          </div>
        ))}
      </div>
      {action ? <Link className="text-link" href={action.href}>{action.label}</Link> : null}
    </section>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="empty-state rich-empty">
      <strong>{title}</strong>
      <span>{description}</span>
    </div>
  );
}

export function ProjectCard({ project }: { project: BlogProject }) {
  return (
    <article className="project-card">
      <Link className="project-cover" href={project.url || '#'}>
        <Image src={project.cover} alt={`${project.title} ??`} width={720} height={460} />
      </Link>
      <div className="project-copy">
        <p className="eyebrow">{project.status}</p>
        <h3>{project.title}</h3>
        <p>{project.description}</p>
        <div className="tag-row">
          {project.tags.map((tag) => <span key={tag}>{tag}</span>)}
        </div>
        <div className="project-actions">
          <Link href={project.url || '#'}>????</Link>
          {project.repo ? <a href={project.repo} target="_blank" rel="noreferrer">Repository</a> : null}
        </div>
      </div>
    </article>
  );
}

export function MusicTrackCard({ track, index }: { track: MusicTrack; index: number }) {
  return (
    <article className="track-card">
      <span>{String(index + 1).padStart(2, '0')}</span>
      <Image className="track-cover" src={track.cover || '/assets/img/desk-notes.svg'} alt={`${track.title} ??`} width={160} height={160} />
      <div>
        <h3>{track.title}</h3>
        <p>{track.artist} / {track.mood || '????'}</p>
        {track.note ? <small>{track.note}</small> : null}
      </div>
      {track.url ? <audio controls src={track.url}>???????????</audio> : <small className="track-draft">???????????</small>}
    </article>
  );
}

export function RadioHeroCard({ track, total }: { track?: MusicTrack; total: number }) {
  if (!track) {
    return null;
  }

  return (
    <section className="main-shell radio-hero-card" aria-label="??????">
      <div className="radio-disc">
        <Image src={track.cover || '/assets/img/hero-mountain.svg'} alt={`${track.title} ??`} width={520} height={520} priority={false} />
      </div>
      <div>
        <p className="eyebrow">Now playing</p>
        <h2>{track.title}</h2>
        <p>{track.artist} / {track.mood}</p>
        {track.note ? <span>{track.note}</span> : null}
        <small>{total} ???????????????????????</small>
        <div className="radio-bars" aria-hidden="true"><i /><i /><i /><i /><i /></div>
      </div>
    </section>
  );
}

export function GalleryTile({ item }: { item: GalleryItem }) {
  return (
    <article className="gallery-tile">
      <Image src={item.image} alt={item.alt || item.title} width={720} height={460} />
      <div>
        <strong>{item.title}</strong>
        <span>{item.description}</span>
      </div>
    </article>
  );
}

export function GalleryCollectionCard({ item }: { item: GalleryItem }) {
  const images = item.items?.length ? item.items : [{ title: item.title, image: item.image, alt: item.alt }];

  return (
    <article className={`gallery-collection${item.featured ? ' featured' : ''}`}>
      <div className="gallery-collection-media" aria-label={`${item.title} ??`}>
        {images.slice(0, 4).map((image, index) => (
          <Image src={image.image} alt={image.alt || image.title} width={420} height={280} key={`${image.title}-${index}`} />
        ))}
      </div>
      <div className="gallery-collection-copy">
        <p className="eyebrow">{item.collection || 'Gallery set'}</p>
        <h3>{item.title}</h3>
        <p>{item.description}</p>
        <div className="gallery-meta">
          {item.location ? <span>{item.location}</span> : null}
          {item.date ? <span>{formatDate(item.date)}</span> : null}
          {item.tags?.map((tag) => <span key={tag}>#{tag}</span>)}
        </div>
      </div>
    </article>
  );
}

export function MomentTimelineCard({ note, index }: { note: BlogNote; index: number }) {
  return (
    <article className="moment-card moment-entry">
      <div className="moment-index">{String(index + 1).padStart(2, '0')}</div>
      <div>
        <div className="moment-entry-head">
          <TimelineDate value={note.date} />
          {note.mood ? <span>{note.mood}</span> : null}
        </div>
        {note.title ? <h3>{note.title}</h3> : null}
        <p>{note.content}</p>
      </div>
    </article>
  );
}

export function TimelineDate({ value }: { value: string }) {
  return <time dateTime={value}>{formatDate(value)}</time>;
}
