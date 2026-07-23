'use client';

import Image from 'next/image';
import { useState, type CSSProperties } from 'react';
import type { BlogLink, BlogSite } from '@/lib/blog';
import styles from '@/app/friends/friends.module.css';

export function FriendsBoardClient({ links, site }: { links: BlogLink[]; site: BlogSite }) {
  const application = site.friendLinkApply;
  const [copyStatus, setCopyStatus] = useState(application.copyLabel);
  const applyFormat = [
    `名称：${application.siteName}`,
    `链接：${application.siteUrl}`,
    `简介：${application.siteDescription}`,
    `头像：${application.siteAvatar}`
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
      {links.length > 0 ? (
        <div className={styles.grid}>
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
                    {link.avatar ? <Image src={link.avatar} alt="" width={96} height={96} /> : link.title.slice(0, 1).toUpperCase()}
                  </span>
                  <span className={styles.identity}>
                    <strong>{link.title}</strong>
                    {link.owner ? <small>{link.owner}</small> : null}
                  </span>
                  <span className={styles.online}><i aria-hidden="true" />在线</span>
                </span>
                <p>{link.description}</p>
                {link.category ? <span className={styles.category}>{link.category}</span> : null}
              </a>
            );
          })}
        </div>
      ) : (
        <p className={styles.empty}>这里还没有收录友链。</p>
      )}

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
