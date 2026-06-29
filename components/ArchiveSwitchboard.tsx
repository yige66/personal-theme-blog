'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { ArchiveGroup, BlogPost } from '@/lib/blog';

type ArchiveEntry = {
  post: BlogPost;
  year: string;
  index: number;
};

type ArchiveView = 'timeline' | 'cards';

export function ArchiveSwitchboard({ groups }: { groups: ArchiveGroup[] }) {
  const [view, setView] = useState<ArchiveView>('timeline');
  const [query, setQuery] = useState('');
  const timelinePanelId = 'archive-timeline-panel';
  const cardPanelId = 'archive-card-panel';

  const entries = useMemo<ArchiveEntry[]>(() => groups.flatMap((group) => (
    group.posts.map((post, index) => ({ post, year: group.year, index }))
  )), [groups]);

  const filteredEntries = useMemo(() => {
    const needle = query.trim().toLowerCase();

    if (!needle) {
      return entries;
    }

    return entries.filter(({ post, year }) => (
      [post.title, post.summary, post.category, year, ...post.tags].join(' ').toLowerCase().includes(needle)
    ));
  }, [entries, query]);

  const filteredGroups = useMemo(() => groups
    .map((group) => ({
      ...group,
      posts: filteredEntries.filter((entry) => entry.year === group.year).map((entry) => entry.post)
    }))
    .filter((group) => group.posts.length > 0), [filteredEntries, groups]);

  return (
    <section className="main-shell archive-world archive-switchboard" aria-label="文章时间航道">
      <div className="archive-orbit" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <div className="archive-control-deck">
        <div>
          <span>{filteredEntries.length} / {entries.length} posts</span>
          <strong>{view === 'timeline' ? '时间航道' : '卡片索引'}</strong>
        </div>
        <label>
          <span>搜索归档</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="标题、摘要、年份或标签" />
        </label>
        <div className="archive-view-toggle" role="tablist" aria-label="归档视图">
          <button
            id="archive-tab-timeline"
            className={view === 'timeline' ? 'is-active' : ''}
            type="button"
            role="tab"
            aria-selected={view === 'timeline'}
            aria-controls={timelinePanelId}
            onClick={() => setView('timeline')}
          >
            Timeline
          </button>
          <button
            id="archive-tab-cards"
            className={view === 'cards' ? 'is-active' : ''}
            type="button"
            role="tab"
            aria-selected={view === 'cards'}
            aria-controls={cardPanelId}
            onClick={() => setView('cards')}
          >
            Cards
          </button>
        </div>
      </div>

      {view === 'timeline' ? (
        <div id={timelinePanelId} className="archive-timeline-view" role="tabpanel" aria-labelledby="archive-tab-timeline">
          {filteredGroups.map((group) => (
            <article className="archive-year" key={group.year}>
              <header>
                <small>Year</small>
                <h2>{group.year}</h2>
                <span>{group.posts.length} posts</span>
              </header>
              <div className="article-list">
                {group.posts.map((post, index) => (
                  <ArchiveRow post={post} index={index} key={post.id} />
                ))}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div id={cardPanelId} className="archive-card-view" role="tabpanel" aria-labelledby="archive-tab-cards">
          {filteredEntries.map(({ post, year, index }) => (
            <Link className="archive-card" href={`/posts/${post.slug}`} key={post.id}>
              <span>{year} / {String(index + 1).padStart(2, '0')}</span>
              <strong>{post.title}</strong>
              <small>{formatDate(post.createdAt)} / {estimateReadingMinutes(post.content)} min</small>
              <p>{post.summary}</p>
              <em>{post.tags.slice(0, 3).map((tag) => `#${tag}`).join(' ')}</em>
            </Link>
          ))}
        </div>
      )}

      {filteredEntries.length === 0 ? <p className="archive-empty">没有匹配的文章，换一个关键词试试。</p> : null}
    </section>
  );
}

function ArchiveRow({ post, index }: { post: BlogPost; index: number }) {
  return (
    <Link className="article-row archive-rune" href={`/posts/${post.slug}`}>
      <span className="row-index">{String(index + 1).padStart(2, '0')}</span>
      <span>
        <strong>{post.title}</strong>
        <small>{post.summary}</small>
      </span>
      <span className="row-meta">{formatDate(post.createdAt)} / {estimateReadingMinutes(post.content)} min</span>
    </Link>
  );
}

function estimateReadingMinutes(content: string): number {
  const cjk = content.match(/[\u4e00-\u9fa5]/g)?.length ?? 0;
  const words = content.replace(/[\u4e00-\u9fa5]/g, ' ').match(/[A-Za-z0-9_]+/g)?.length ?? 0;
  return Math.max(1, Math.ceil((cjk + words) / 420));
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date(value));
}
