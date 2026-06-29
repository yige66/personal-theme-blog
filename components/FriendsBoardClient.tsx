'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import type { BlogLink, BlogSite } from '@/lib/blog';

export function FriendsBoardClient({ links, site }: { links: BlogLink[]; site: BlogSite }) {
  const [query, setQuery] = useState('');
  const [activeBadge, setActiveBadge] = useState('all');
  const [copyStatus, setCopyStatus] = useState('复制申请格式');
  const badges = useMemo(() => ['all', ...Array.from(new Set(links.map((link) => link.badge).filter(Boolean)))], [links]);
  const filteredLinks = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return links.filter((link) => {
      const matchesBadge = activeBadge === 'all' || link.badge === activeBadge;
      const haystack = [link.title, link.description, link.badge || '', link.since || '', link.url].join(' ').toLowerCase();
      return matchesBadge && (!needle || haystack.includes(needle));
    });
  }, [activeBadge, links, query]);

  const applyFormat = site.friendLinkApplyFormat || [
    `名称：${site.title}`,
    `简介：${site.subtitle}`,
    `链接：${site.github}`,
    `头像：${site.avatar}`
  ].join('\n');

  const copyApplyFormat = async () => {
    try {
      await navigator.clipboard.writeText(applyFormat);
      setCopyStatus('已复制');
      window.setTimeout(() => setCopyStatus('复制申请格式'), 1800);
    } catch {
      setCopyStatus('复制失败，请手动选中');
    }
  };

  return (
    <section className="main-shell friends-board friends-board-client" aria-label="友链头像矩阵">
      <div className="friends-command-panel">
        <label className="friends-search">
          <span>搜索朋友</span>
          <input value={query} onChange={(event) => setQuery(event.currentTarget.value)} placeholder="站点、标签、年份、关键词" />
        </label>
        <div className="friend-filter-rail" role="list" aria-label="友链标签筛选">
          {badges.map((badge) => (
            <button
              className={badge === activeBadge ? 'is-active' : ''}
              type="button"
              onClick={() => setActiveBadge(badge || 'all')}
              key={badge}
            >
              {badge === 'all' ? '全部' : badge}
            </button>
          ))}
        </div>
      </div>

      <div className="friends-board-grid">
        {filteredLinks.map((link, index) => {
          const external = link.url.startsWith('http');
          return (
            <a
              className="friend-node-card"
              href={link.url}
              target={external ? '_blank' : undefined}
              rel={external ? 'noreferrer' : undefined}
              style={{ '--friend-theme': link.themeColor || `hsl(${(index * 48) % 360} 82% 74%)` } as CSSProperties}
              key={`${link.title}-${index}`}
            >
              <span className="friend-avatar">
                {link.avatar ? <Image src={link.avatar} alt="" width={96} height={96} /> : link.title.slice(0, 1).toUpperCase()}
              </span>
              <strong>{link.title}</strong>
              <small>{link.badge || (external ? new URL(link.url).hostname : '站内入口')}</small>
              <p>{link.description}</p>
              {link.since ? <em>{link.since}</em> : null}
            </a>
          );
        })}
      </div>

      {filteredLinks.length === 0 ? <p className="friends-empty">没有匹配的友链节点。</p> : null}

      <aside className="friend-apply-card friend-apply-console">
        <span>Friend Link</span>
        <strong>交换格式</strong>
        <pre>{applyFormat}</pre>
        <button type="button" onClick={copyApplyFormat}>{copyStatus}</button>
      </aside>
    </section>
  );
}
