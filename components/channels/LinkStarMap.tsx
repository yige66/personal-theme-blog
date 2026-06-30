import type { CSSProperties } from 'react';
import type { BlogLink } from '@/lib/blog';
import { EmptyState } from '@/components/SectionBlocks';

export function LinkStarMap({ links }: { links: BlogLink[] }) {
  if (links.length === 0) {
    return (
      <section className="main-shell link-world xh-reference-surface">
        <EmptyState title="暂无友链" description="添加链接后，这里会形成可维护的关系星图。" />
      </section>
    );
  }

  return (
    <section className="main-shell link-world link-starmap xh-reference-surface" aria-label="友链关系星图">
      <div className="link-map-stage">
        <div className="link-map-core">
          <small>Friends</small>
          <strong>{links.length}</strong>
          <span>links online</span>
        </div>
        {links.map((link, index) => {
          const external = link.url.startsWith('http');
          const angle = -90 + (360 / links.length) * index;

          return (
            <a
              className={`link-card link-node node-${index % 6}`}
              style={{ '--node-angle': `${angle}deg`, '--node-inverse': `${-angle}deg`, '--node-radius': `${190 + (index % 3) * 22}px` } as CSSProperties}
              href={link.url}
              target={external ? '_blank' : undefined}
              rel={external ? 'noreferrer' : undefined}
              key={link.title}
            >
              <span>{link.title.slice(0, 1).toUpperCase()}</span>
              <strong>{link.title}</strong>
              <small>{external ? new URL(link.url).hostname : '站内入口'}</small>
              <p>{link.description}</p>
            </a>
          );
        })}
      </div>
      <div className="link-grid link-list-fallback" aria-label="友链列表">
        {links.map((link) => {
          const external = link.url.startsWith('http');
          return (
            <a href={link.url} target={external ? '_blank' : undefined} rel={external ? 'noreferrer' : undefined} key={`${link.title}-fallback`}>
              <strong>{link.title}</strong>
              <small>{external ? new URL(link.url).hostname : '站内入口'}</small>
            </a>
          );
        })}
      </div>
    </section>
  );
}
