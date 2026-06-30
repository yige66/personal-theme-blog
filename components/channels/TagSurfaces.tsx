import Link from 'next/link';
import type { CSSProperties } from 'react';
import type { BlogPost, TagSummary } from '@/lib/blog';
import { estimateReadingMinutes, formatDate } from '@/lib/blog';
import { EmptyState } from '@/components/SectionBlocks';

export function TagNebula({ tags }: { tags: TagSummary[] }) {
  if (tags.length === 0) {
    return (
      <section className="main-shell tag-world">
        <EmptyState title="暂无标签" description="发布带标签的文章后，标签星云会自动出现。" />
      </section>
    );
  }

  const maxCount = Math.max(...tags.map((tag) => tag.count), 1);

  return (
    <section className="main-shell tag-world" aria-label="标签星云">
      <div className="tag-cloud-page">
        {tags.map((tag, index) => {
          const heat = Math.max(1, Math.round((tag.count / maxCount) * 5));
          return (
            <Link
              className={`tag-cloud-card heat-${heat}`}
              href={`/tags/${encodeURIComponent(tag.name)}`}
              style={{ '--tag-index': index, '--tag-tilt': `${(index % 7) * 2 - 6}deg` } as CSSProperties}
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
    <section className="main-shell tag-reading-dock" aria-label={`${tag} 标签文章`}>
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
