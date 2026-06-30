'use client';

import Image from 'next/image';
import { useState, type CSSProperties } from 'react';
import type { BlogLink, BlogSite } from '@/lib/blog';

export function FriendsBoardClient({ links, site }: { links: BlogLink[]; site: BlogSite }) {
  const [copyStatus, setCopyStatus] = useState('复制申请格式');

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
    <section className="main-shell friends-board friends-board-client xh-reference-surface" aria-label="友链">
      <div className="friends-board-grid" aria-label="友链名录">
        {links.map((link, index) => {
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
              <small>Online</small>
              <p>{link.description}</p>
            </a>
          );
        })}
      </div>

      {links.length === 0 ? <p className="friends-empty">暂无友链。</p> : null}

      <aside className="friend-apply-card friend-apply-console">
        <span>Friend Link</span>
        <strong>建立神经连接</strong>
        <p>欢迎交换友链，请复制下方格式，并在底部留言区申请。</p>
        <pre>{applyFormat}</pre>
        <button type="button" onClick={copyApplyFormat}>{copyStatus}</button>
        <a className="friend-apply-link" href="#gitalk-container">前往留言区申请</a>
      </aside>
    </section>
  );
}
