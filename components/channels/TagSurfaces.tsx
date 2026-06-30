import Link from 'next/link';
import type { CSSProperties } from 'react';
import type { BlogPost, TagSummary } from '@/lib/blog';
import { estimateReadingMinutes, formatDate } from '@/lib/blog';
import { EmptyState } from '@/components/SectionBlocks';

const ORBIT_MODE_LIMIT = 12;

function clampPercent(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function getOrbitPoint(index: number, total: number) {
  if (total <= 1) {
    return { x: 50, y: 28, angle: -90, radius: 170 };
  }

  const ring = Math.floor(index / 8);
  const ringIndex = index % 8;
  const ringSize = Math.min(8, total - ring * 8);
  const angle = -92 + (360 / Math.max(ringSize, 1)) * ringIndex + ring * 18;
  const radians = (angle * Math.PI) / 180;
  const radiusX = 26 + ring * 7;
  const radiusY = 22 + ring * 6;

  return {
    x: clampPercent(50 + Math.cos(radians) * radiusX, 13, 87),
    y: clampPercent(50 + Math.sin(radians) * radiusY, 16, 84),
    angle,
    radius: 170 + ring * 42 + (index % 3) * 14
  };
}

export function TagNebula({ tags }: { tags: TagSummary[] }) {
  if (tags.length === 0) {
    return (
      <section className="main-shell tag-world tag-nebula-world xh-reference-surface">
        <EmptyState title="暂无标签" description="发布带标签的文章后，标签星云会自动出现。" />
      </section>
    );
  }

  const maxCount = Math.max(...tags.map((tag) => tag.count), 1);
  const isDense = tags.length > ORBIT_MODE_LIMIT;

  return (
    <section
      className={`main-shell tag-world tag-nebula-world xh-reference-surface ${isDense ? 'is-dense' : 'is-orbit'}`}
      data-tag-count={tags.length}
      aria-label="标签星云"
    >
      <div className="tag-nebula-core">
        <small>Tag Nebula</small>
        <strong>{tags.length}</strong>
        <span>{isDense ? 'topic index' : 'topic orbits'}</span>
      </div>
      <div className="tag-orbit-rings" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="tag-cloud-page tag-constellation-grid">
        {tags.map((tag, index) => {
          const heat = Math.max(1, Math.round((tag.count / maxCount) * 5));
          const slot = getOrbitPoint(index, tags.length);

          return (
            <Link
              className={`tag-cloud-card heat-${heat}`}
              href={`/tags/${encodeURIComponent(tag.name)}`}
              style={{
                '--tag-index': index,
                '--tag-tilt': `${(index % 7) * 2 - 6}deg`,
                '--tag-angle': `${slot.angle}deg`,
                '--tag-inverse': `${-slot.angle}deg`,
                '--tag-radius': `${slot.radius}px`,
                '--tag-x': `${slot.x}%`,
                '--tag-y': `${slot.y}%`
              } as CSSProperties}
              key={tag.name}
            >
              <small>{String(index + 1).padStart(2, '0')}</small>
              <strong>#{tag.name}</strong>
              <span>{tag.count} 篇文章</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export function TagReadingDock({ tag, posts }: { tag: string; posts: BlogPost[] }) {
  return (
    <section className="main-shell tag-reading-dock xh-reference-surface" aria-label={`${tag} 标签文章`}>
      <aside>
        <small>Selected Tag</small>
        <strong>#{tag}</strong>
        <span>{posts.length} posts connected</span>
      </aside>
      <div className="article-list">
        {posts.map((post, index) => (
          <Link className="article-row archive-rune" href={`/posts/${post.slug}`} key={post.id}>
            <span className="row-index">{String(index + 1).padStart(2, '0')}</span>
            <span>
              <strong>{post.title}</strong>
              <small>{post.summary}</small>
            </span>
            <span className="row-meta">{formatDate(post.createdAt)} / {estimateReadingMinutes(post.content)} min</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
