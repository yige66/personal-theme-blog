'use client';

import Image from 'next/image';
import { useState, type CSSProperties } from 'react';
import type { BlogLink, BlogSite } from '@/lib/blog';
import styles from '@/app/friends/friends.module.css';

export function FriendsBoardClient({ links, site }: { links: BlogLink[]; site: BlogSite }) {
  const application = site.friendLinkApply;
  const siteName = [site.title, site.brandSuffix].filter(Boolean).join(' ');
  // 复制给外部站点的头像必须使用生产域名下的绝对 URL。
  const siteAvatarUrl = new URL(site.avatar, application.siteUrl).toString();
  const [copyStatus, setCopyStatus] = useState(application.copyLabel);
  const applyFormat = [
    `名称：${siteName}`,
    `简介：${application.siteDescription}`,
    `链接：${application.siteUrl}`,
    `头像：${siteAvatarUrl}`
  ].join('\n');

  const copySiteInfo = async () => {
    try {
      await navigator.clipboard.writeText(applyFormat);
      setCopyStatus(application.copiedLabel);
      window.setTimeout(() => setCopyStatus(application.copyLabel), 1800);
    } catch {
      setCopyStatus(application.copyErrorLabel);
    }
  };

  return (
    <section className={`${styles.board}`} aria-label="友链名录">
      <div className={styles.grid} aria-label="友链卡片">
        <article className={styles.siteCard} style={{ '--friend-theme': site.themeColor } as CSSProperties}>
          <a
            className={styles.siteCardLink}
            href={application.siteUrl}
            rel="noreferrer noopener"
            target="_blank"
            aria-label={`${siteName}本站资料`}
          >
            <span className={styles.siteAvatar}>
              <Image src={site.avatar} alt={`${siteName}头像`} width={96} height={96} />
            </span>
            <span className={styles.siteIdentity}>
              <strong>{siteName}</strong>
            </span>
            <span className={styles.siteStatus}><i aria-hidden="true" />ONLINE</span>
            <p className={styles.siteDescription}>{application.siteDescription}</p>
          </a>
        </article>

        {links.map((link, index) => {
          const external = link.url.startsWith('http');
          return (
            <a
              className={styles.card}
              href={link.url}
              key={`${link.title}-${index}-card`}
              rel={external ? 'noreferrer noopener' : undefined}
              style={{ '--friend-theme': link.themeColor || '#6366f1' } as CSSProperties}
              target={external ? '_blank' : undefined}
            >
              <span className={styles.cardTop}>
                <span className={styles.avatar}>
                  {link.avatar ? <Image src={link.avatar} alt={`${link.title}头像`} width={96} height={96} /> : link.title.slice(0, 1).toUpperCase()}
                </span>
                <span className={styles.identity}>
                  <strong>{link.title}</strong>
                  {link.owner ? <small>{link.owner}</small> : null}
                </span>
                <span className={styles.online}><i aria-hidden="true" />ONLINE</span>
              </span>
              <p>{link.description}</p>
              {link.category ? <span className={styles.category}>{link.category}</span> : null}
            </a>
          );
        })}
      </div>

      {links.length === 0 ? (
        <div className={styles.emptyState}>
          <span className={styles.emptyKicker}>友链名录</span>
          <p>暂时还没有确认友链，等下一颗小星星来报到。</p>
        </div>
      ) : null}

      <aside className={styles.applyPanel} aria-label={application.title}>
        <div className={styles.applyCopy}>
          <div className={styles.applyHeading}>
            <span className={styles.applyEmblem} aria-hidden="true">
              <Image src="/assets/project-icons/moon-orbit.svg" alt="" width={42} height={42} />
            </span>
            <h2>{application.title}</h2>
          </div>
          <p>{application.description}</p>
        </div>
        <pre className={styles.applyFormat}>{applyFormat}</pre>
        <div className={styles.applyActions}>
          <button type="button" onClick={() => void copySiteInfo()}>{copyStatus}</button>
          <a href="#gitalk-container">{application.commentLabel}</a>
        </div>
      </aside>
    </section>
  );
}
