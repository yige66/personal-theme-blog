'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { BlogPost } from '@/lib/blog';

export function ArticleExplorer({ posts }: { posts: BlogPost[] }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');

  const categories = useMemo(() => ['all', ...Array.from(new Set(posts.map((post) => post.category)))], [posts]);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return posts.filter((post) => {
      const haystack = [post.title, post.summary, post.category, ...post.tags].join(' ').toLowerCase();
      return (category === 'all' || post.category === category) && (!needle || haystack.includes(needle));
    });
  }, [category, posts, query]);

  return (
    <section className="article-explorer" id="posts" aria-labelledby="posts-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Articles</p>
          <h2 id="posts-title">文章星图</h2>
        </div>
        <label className="search-control">
          <span>搜索文章</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="标题、摘要、分类或标签" />
        </label>
      </div>
      <div className="category-rail" aria-label="文章分类">
        {categories.map((item) => (
          <button key={item} className={category === item ? 'active' : ''} type="button" onClick={() => setCategory(item)}>
            {item === 'all' ? '全部' : item}
          </button>
        ))}
      </div>
      <div className="article-list">
        {filtered.map((post, index) => (
          <Link className="article-row" href={`/posts/${post.slug}`} key={post.id}>
            <span className="row-index">{String(index + 1).padStart(2, '0')}</span>
            <span>
              <strong>{post.title}</strong>
              <small>{post.summary}</small>
            </span>
            <span className="row-meta">{formatDate(post.createdAt)} / {estimateReadingMinutes(post.content)} min</span>
          </Link>
        ))}
      </div>
      {filtered.length === 0 ? <p className="empty-state">没有匹配的文章，换个关键词试试。</p> : null}
    </section>
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
