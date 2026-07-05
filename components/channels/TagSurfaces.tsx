import Link from 'next/link';
import type { BlogPost, TagSummary } from '@/lib/blog';
import { estimateReadingMinutes, formatDate } from '@/lib/blog';
import { PlanetaryOrbitMap, type PlanetaryOrbitItem } from '@/components/channels/PlanetaryOrbitMap';
import { EmptyState } from '@/components/SectionBlocks';

const ORBIT_MODE_LIMIT = 8;

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
  const planetItems: PlanetaryOrbitItem[] = tags.map((tag, index) => ({
    id: tag.name,
    eyebrow: String(index + 1).padStart(2, '0'),
    label: `#${tag.name}`,
    meta: `${tag.count} 篇文章`,
    detail: `这个标签连接了 ${tag.count} 篇文章。点击小星球进入标签详情和阅读列表。`,
    href: `/tags/${encodeURIComponent(tag.name)}`,
    heat: Math.max(1, Math.round((tag.count / maxCount) * 5))
  }));

  return (
    <PlanetaryOrbitMap
      className={`main-shell tag-world tag-nebula-world xh-reference-surface ${isDense ? 'is-dense' : 'is-orbit'}`}
      count={tags.length}
      countLabel={isDense ? 'topic index' : 'topic orbits'}
      density={isDense ? 'dense' : 'orbit'}
      items={planetItems}
      subtitle="Tag Planet"
      title="标签行星图"
      variant="tags"
    />
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
