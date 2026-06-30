'use client';

import Image from 'next/image';
import { useMemo, useState, type CSSProperties } from 'react';
import type { BlogLink, BlogSite } from '@/lib/blog';

const constellationSlots = [
  { x: '50%', y: '18%' },
  { x: '72%', y: '34%' },
  { x: '68%', y: '67%' },
  { x: '43%', y: '76%' },
  { x: '28%', y: '45%' },
  { x: '38%', y: '30%' },
  { x: '58%', y: '50%' },
  { x: '82%', y: '52%' }
];

function hostnameFor(url: string) {
  if (!url.startsWith('http')) {
    return '站内入口';
  }

  try {
    return new URL(url).hostname;
  } catch {
    return 'external';
  }
}

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
    <section className="main-shell friends-board friends-board-client friends-starmap xh-reference-surface" aria-label="友链关系星图">
      <div className="friends-command-panel">
        <label className="friends-search">
          <span>搜索友链</span>
          <input value={query} onChange={(event) => setQuery(event.currentTarget.value)} placeholder="站点、标签、年份或关键词" />
        </label>
        <div className="friend-filter-rail" role="list" aria-label="友链标签筛选">
          {badges.map((badge) => (
            <button
              className={badge === activeBadge ? 'is-active' : ''}
              type="button"
              onClick={() => setActiveBadge(badge || 'all')}
              key={badge}
            >
              {badge === 'all' ? '全部星点' : badge}
            </button>
          ))}
        </div>
      </div>

      <div className="friend-constellation-stage" aria-label="关系星图">
        <div className="friend-orbit-rings" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <svg className="friend-link-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <path d="M50 18 C66 25 72 34 72 34" />
          <path d="M72 34 C72 50 68 67 68 67" />
          <path d="M68 67 C56 74 43 76 43 76" />
          <path d="M43 76 C31 65 28 45 28 45" />
          <path d="M28 45 C33 34 38 30 50 18" />
          <path d="M38 30 C50 42 58 50 68 67" />
        </svg>
        <div className="friend-map-core">
          <small>Friends</small>
          <strong>{filteredLinks.length}</strong>
          <span>online nodes</span>
        </div>
        {filteredLinks.map((link, index) => {
          const external = link.url.startsWith('http');
          const slot = constellationSlots[index % constellationSlots.length];
          const angle = -90 + (360 / Math.max(filteredLinks.length, 1)) * index;

          return (
            <a
              className="friend-star-node"
              href={link.url}
              target={external ? '_blank' : undefined}
              rel={external ? 'noreferrer' : undefined}
              style={{
                '--friend-theme': link.themeColor || `hsl(${(index * 48) % 360} 82% 74%)`,
                '--node-angle': `${angle}deg`,
                '--node-inverse': `${-angle}deg`,
                '--node-radius': `${180 + (index % 3) * 28}px`,
                '--node-x': slot.x,
                '--node-y': slot.y,
                '--node-delay': `${index * 90}ms`
              } as CSSProperties}
              key={`${link.title}-${index}`}
            >
              <span className="friend-avatar">
                {link.avatar ? <Image src={link.avatar} alt="" width={96} height={96} /> : link.title.slice(0, 1).toUpperCase()}
              </span>
              <strong>{link.title}</strong>
              <small>{link.badge || hostnameFor(link.url)}</small>
            </a>
          );
        })}
      </div>

      <div className="friends-board-grid" aria-label="友链名录">
        {filteredLinks.map((link, index) => {
          const external = link.url.startsWith('http');
          return (
            <a
              className="friend-node-card"
              href={link.url}
              target={external ? '_blank' : undefined}
              rel={external ? 'noreferrer' : undefined}
              style={{ '--friend-theme': link.themeColor || `hsl(${(index * 48) % 360} 82% 74%)` } as CSSProperties}
              key={`${link.title}-${index}-card`}
            >
              <span className="friend-avatar">
                {link.avatar ? <Image src={link.avatar} alt="" width={96} height={96} /> : link.title.slice(0, 1).toUpperCase()}
              </span>
              <strong>{link.title}</strong>
              <small>{link.badge || hostnameFor(link.url)}</small>
              <p>{link.description}</p>
              {link.since ? <em>{link.since}</em> : null}
            </a>
          );
        })}
      </div>

      {filteredLinks.length === 0 ? <p className="friends-empty">没有匹配的友链节点。</p> : null}

      <aside className="friend-apply-card friend-apply-console">
        <span>Friend Link</span>
        <strong>友链申请格式</strong>
        <p>友链是站点关系网络，也是个人站点之间的长期互访入口，用来展示真实站点关系、内容气质和互相引用，不收纳无意义工具链接。</p>
        <pre>{applyFormat}</pre>
        <button type="button" onClick={copyApplyFormat}>{copyStatus}</button>
      </aside>
    </section>
  );
}
