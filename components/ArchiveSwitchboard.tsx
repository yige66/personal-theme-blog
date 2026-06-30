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
type ArchiveTag = {
  name: string;
  count: number;
};

export function ArchiveSwitchboard({ groups }: { groups: ArchiveGroup[] }) {
  const [view, setView] = useState<ArchiveView>('timeline');
  const [query, setQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('All');
  const timelinePanelId = 'archive-timeline-panel';
  const cardPanelId = 'archive-card-panel';

  const entries = useMemo<ArchiveEntry[]>(() => groups.flatMap((group) => (
    group.posts.map((post, index) => ({ post, year: group.year, index }))
  )), [groups]);

  const tags = useMemo<ArchiveTag[]>(() => {
    const counts = new Map<string, number>();
    entries.forEach(({ post }) => {
      post.tags.forEach((tag) => counts.set(tag, (counts.get(tag) ?? 0) + 1));
    });
    return Array.from(counts, ([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [entries]);

  const filteredEntries = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return entries.filter(({ post, year }) => {
      const matchesTag = selectedTag === 'All' || post.tags.includes(selectedTag);
      const haystack = [post.title, post.summary, post.category, year, ...post.tags].join(' ').toLowerCase();
      return matchesTag && (!needle || haystack.includes(needle));
    });
  }, [entries, query, selectedTag]);

  const filteredGroups = useMemo(() => groups
    .map((group) => ({
      ...group,
      posts: filteredEntries.filter((entry) => entry.year === group.year).map((entry) => entry.post)
    }))
    .filter((group) => group.posts.length > 0), [filteredEntries, groups]);

  return (
    <section className="main-shell archive-world archive-switchboard archive-xh-timeline xh-reference-surface" aria-label="文章归档与探索">
      <div className="archive-control-deck xh-reference-toolbar">
        <div className="archive-control-title">
          <span>{filteredEntries.length} / {entries.length} 篇文章</span>
          <strong>{view === 'timeline' ? '归档时间线' : '卡片矩阵'}</strong>
          <small>XHBlogs-style archive: search, tags, timeline, cards.</small>
        </div>
        <label className="archive-search">
          <span>Search</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索被封存的知识..." />
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
            中枢链路
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
            矩阵网格
          </button>
        </div>
      </div>

      <div className="archive-tag-rail" aria-label="归档标签筛选">
        <button
          className={selectedTag === 'All' ? 'is-active' : ''}
          type="button"
          onClick={() => setSelectedTag('All')}
        >
          全部档案 <span>{entries.length}</span>
        </button>
        {tags.map((tag) => (
          <button
            className={selectedTag === tag.name ? 'is-active' : ''}
            type="button"
            onClick={() => setSelectedTag(tag.name)}
            key={tag.name}
          >
            {tag.name} <span>{tag.count}</span>
          </button>
        ))}
      </div>

      {view === 'timeline' ? (
        <div id={timelinePanelId} className="archive-timeline-view" role="tabpanel" aria-labelledby="archive-tab-timeline">
          {filteredGroups.map((group) => (
            <article className="archive-year" key={group.year}>
              <header>
                <small>Year</small>
                <h2>{group.year}</h2>
                <span>{group.posts.length} 篇</span>
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

      {entries.length === 0 ? <p className="archive-empty">暂无已发布文章。</p> : null}
      {entries.length > 0 && filteredEntries.length === 0 ? <p className="archive-empty">没有匹配的文章，换一个关键词或标签试试。</p> : null}
    </section>
  );
}

function ArchiveRow({ post, index }: { post: BlogPost; index: number }) {
  return (
    <Link className="article-row archive-row-xh" href={`/posts/${post.slug}`}>
      <span className="row-index">{String(index + 1).padStart(2, '0')}</span>
      <span>
        <strong>{post.title}</strong>
        <small>{post.summary}</small>
        <em>{post.tags.slice(0, 3).map((tag) => `#${tag}`).join(' ')}</em>
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
