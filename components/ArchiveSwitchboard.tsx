'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ArchiveGroup, BlogPost } from '@/lib/blog';
import { formatChinaDate, formatChinaDateTime } from '@/lib/china-date-format';
import { compareTextCodePoints } from '@/lib/deterministic-text';

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

const fallbackCovers = ['/assets/img/hero-mountain.svg', '/assets/img/desk-notes.svg', '/assets/img/admin-board.svg'];

export function ArchiveSwitchboard({ groups }: { groups: ArchiveGroup[] }) {
  const [view, setView] = useState<ArchiveView>('timeline');
  const [query, setQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('All');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const timelinePanelId = 'archive-timeline-panel';
  const cardPanelId = 'archive-card-panel';
  const searchResultsId = 'archive-search-results';

  useEffect(() => {
    const forceCardViewOnMobile = () => {
      if (window.innerWidth < 768) {
        setView('cards');
      }
    };

    forceCardViewOnMobile();
    window.addEventListener('resize', forceCardViewOnMobile);
    return () => window.removeEventListener('resize', forceCardViewOnMobile);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!searchContainerRef.current?.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const entries = useMemo<ArchiveEntry[]>(() => groups
    .flatMap((group) => group.posts.map((post) => ({ post, year: group.year, index: 0 })))
    .sort((first, second) => new Date(second.post.createdAt).getTime() - new Date(first.post.createdAt).getTime())
    .map((entry, index) => ({ ...entry, index })), [groups]);

  const tags = useMemo<ArchiveTag[]>(() => {
    const counts = new Map<string, number>();
    entries.forEach(({ post }) => {
      post.tags.forEach((tag) => counts.set(tag, (counts.get(tag) ?? 0) + 1));
    });
    return Array.from(counts, ([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || compareTextCodePoints(a.name, b.name));
  }, [entries]);

  const filteredEntries = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return entries.filter(({ post, year }) => {
      const matchesTag = selectedTag === 'All' || post.tags.includes(selectedTag);
      const haystack = [post.title, post.summary, post.category, year, ...post.tags].join(' ').toLowerCase();
      return matchesTag && (!needle || haystack.includes(needle));
    });
  }, [entries, query, selectedTag]);

  const searchResults = useMemo(() => {
    const needle = query.trim().toLowerCase();

    if (!needle) {
      return [];
    }

    return entries
      .filter(({ post, year }) => [post.title, post.summary, post.category, year, ...post.tags].join(' ').toLowerCase().includes(needle))
      .slice(0, 6);
  }, [entries, query]);

  return (
    <section className="main-shell archive-world archive-switchboard archive-xh-timeline xh-reference-surface" aria-label="文章归档与探索">
      <div className="archive-control-deck xh-reference-toolbar archive-search-deck">
        <div className="archive-control-title">
          <span>{filteredEntries.length} / {entries.length} 篇文章</span>
          <strong>{view === 'timeline' ? '归档时间线' : '卡片矩阵'}</strong>
          <small>按搜索、标签、时间线和卡片浏览文章。</small>
        </div>
        <div className="archive-search" ref={searchContainerRef}>
          <label htmlFor="archive-search-input"><span>Search</span></label>
          <input
            id="archive-search-input"
            type="search"
            value={query}
            aria-autocomplete="list"
            aria-controls={searchResultsId}
            aria-expanded={isSearchOpen && query.trim() !== ''}
            onChange={(event) => {
              setQuery(event.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={() => setIsSearchOpen(true)}
            placeholder="搜索被封存的知识..."
          />
          {isSearchOpen && query.trim() !== '' ? (
            <div className="archive-search-results" id={searchResultsId} aria-live="polite">
              {searchResults.length > 0 ? (
                searchResults.map(({ post, year }) => (
                  <Link href={`/posts/${post.slug}`} key={`search-${post.id}`} onClick={() => setIsSearchOpen(false)}>
                    <span>{formatChinaDate(post.createdAt)} / {year}</span>
                    <strong>{post.title}</strong>
                    <small>{post.summary}</small>
                  </Link>
                ))
              ) : (
                <p className="archive-search-empty">暂时没有命中，换一个关键词试试。</p>
              )}
            </div>
          ) : null}
        </div>
      </div>

      <div className="archive-filter-console xh-reference-toolbar">
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

      {view === 'timeline' ? (
        <div id={timelinePanelId} className="archive-timeline-view" role="tabpanel" aria-labelledby="archive-tab-timeline">
          {filteredEntries.map(({ post, year, index }) => (
            <ArchiveRow post={post} year={year} index={index} key={post.id} />
          ))}
        </div>
      ) : (
        <div id={cardPanelId} className="archive-card-view" role="tabpanel" aria-labelledby="archive-tab-cards">
          {filteredEntries.map(({ post, year, index }) => (
            <Link className="archive-card" href={`/posts/${post.slug}`} key={post.id}>
              <span className="archive-card-cover">
                <Image src={getArchiveCover(post, index)} alt="" width={560} height={320} />
              </span>
              <span className="archive-card-body">
                <small>{formatChinaDate(post.createdAt)} / {year}</small>
                <strong>{post.title}</strong>
                <span className="archive-card-tags">{post.tags.slice(0, 3).map((tag) => <em key={tag}>#{tag}</em>)}</span>
                <p>{post.summary}</p>
              </span>
            </Link>
          ))}
        </div>
      )}

      {entries.length === 0 ? <p className="archive-empty">暂无已发布文章。</p> : null}
      {entries.length > 0 && filteredEntries.length === 0 ? <p className="archive-empty">没有匹配的文章，换一个关键词或标签试试。</p> : null}
    </section>
  );
}

function ArchiveRow({ post, year, index }: { post: BlogPost; year: string; index: number }) {
  return (
    <Link className="article-row archive-row-xh" href={`/posts/${post.slug}`}>
      <span className="archive-row-cover">
        <Image src={getArchiveCover(post, index)} alt="" width={640} height={360} />
      </span>
      <span className="archive-row-body">
        <span className="row-meta">{formatChinaDateTime(post.createdAt)} / {year} / {estimateReadingMinutes(post.content)} min</span>
        <strong>{post.title}</strong>
        <span className="archive-row-tags">{post.tags.slice(0, 4).map((tag) => <em key={tag}>#{tag}</em>)}</span>
        <small>{post.summary}</small>
      </span>
    </Link>
  );
}

function getArchiveCover(post: BlogPost, index: number): string {
  return post.cover || fallbackCovers[index % fallbackCovers.length];
}

function estimateReadingMinutes(content: string): number {
  const cjk = content.match(/[\u4e00-\u9fa5]/g)?.length ?? 0;
  const words = content.replace(/[\u4e00-\u9fa5]/g, ' ').match(/[A-Za-z0-9_]+/g)?.length ?? 0;
  return Math.max(1, Math.ceil((cjk + words) / 420));
}
