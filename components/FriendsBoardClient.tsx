'use client';

import Image from 'next/image';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { BlogLink, BlogSite } from '@/lib/blog';
import styles from '@/app/friends/friends.module.css';

export function FriendsBoardClient({ links, site }: { links: BlogLink[]; site: BlogSite }) {
  const application = site.friendLinkApply;
  const siteName = [site.title, site.brandSuffix].filter(Boolean).join(' ');
  // 复制给外部站点的头像必须使用生产域名下的绝对 URL。
  const siteAvatarUrl = new URL(site.avatar, application.siteUrl).toString();
  const [copyStatus, setCopyStatus] = useState(application.copyLabel);
  const [revealedCards, setRevealedCards] = useState<Record<string, boolean>>({});
  const boardRef = useRef<HTMLElement | null>(null);
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

  useEffect(() => {
    const board = boardRef.current;
    if (!board) {
      return undefined;
    }

    const cards = Array.from(board.querySelectorAll<HTMLElement>('[data-friend-card]'));
    const revealAll = () => {
      setRevealedCards(Object.fromEntries(cards.map((card) => [card.dataset.friendCard || '', true])));
    };

    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      revealAll();
      return undefined;
    }

    const observer = new IntersectionObserver((entries) => {
      const enteringKeys = entries
        .filter((entry) => entry.isIntersecting)
        .map((entry) => (entry.target as HTMLElement).dataset.friendCard)
        .filter((key): key is string => Boolean(key));

      if (enteringKeys.length === 0) {
        return;
      }

      setRevealedCards((current) => {
        const next = { ...current };
        enteringKeys.forEach((key) => {
          next[key] = true;
        });
        return next;
      });
      entries.filter((entry) => entry.isIntersecting).forEach((entry) => observer.unobserve(entry.target));
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [links.length]);

  return (
    <section ref={boardRef} className={`${styles.board}`} aria-label="友链名录">
      <div className={styles.grid} aria-label="友链卡片">
        {links.map((link, index) => {
          const cardKey = `${link.title}-${index}`;
          const external = link.url.startsWith('http');
          const isRemoteAvatar = /^https?:\/\//i.test(link.avatar || '');
          return (
            <article
              className={styles.siteCard}
              key={`${cardKey}-card`}
              data-friend-card={cardKey}
              data-reveal-state={revealedCards[cardKey] ? 'visible' : 'pending'}
              style={{
                '--friend-theme': link.themeColor || '#6366f1',
                '--friend-delay': `${(index % 3) * 90}ms`
              } as CSSProperties}
            >
              <a
                className={styles.siteCardLink}
                href={link.url}
                rel={external ? 'noreferrer noopener' : undefined}
                target={external ? '_blank' : undefined}
                aria-label={`${link.title}友链资料`}
              >
                <span className={styles.siteAvatar}>
                  {link.avatar ? <Image src={link.avatar} alt={`${link.title}头像`} width={96} height={96} unoptimized={isRemoteAvatar} /> : link.title.slice(0, 1).toUpperCase()}
                </span>
                <span className={styles.siteIdentity}>
                  <strong>{link.title}</strong>
                  {link.owner ? <small>{link.owner}</small> : null}
                </span>
                <span className={styles.siteStatus}><i aria-hidden="true" />ONLINE</span>
                <p className={styles.siteDescription}>{link.description}</p>
              </a>
            </article>
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
