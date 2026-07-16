'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ArticleHeading } from '@/lib/blog';

export function ArticleTOC({ headings, rootId = 'article-content' }: { headings: ArticleHeading[]; rootId?: string }) {
  const visibleHeadings = useMemo(() => headings.filter((heading) => heading.text && heading.id), [headings]);
  const [activeId, setActiveId] = useState(visibleHeadings[0]?.id ?? '');

  useEffect(() => {
    if (visibleHeadings.length === 0) {
      return undefined;
    }

    const root = document.getElementById(rootId);
    if (!root) {
      return undefined;
    }

    const headingElements = visibleHeadings
      .map((heading) => {
        const element = root.querySelector<HTMLElement>(`#${CSS.escape(heading.id)}`);
        if (element && !element.id) {
          element.id = heading.id;
        }
        return element;
      })
      .filter((element): element is HTMLElement => Boolean(element));

    if (headingElements.length === 0) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];

        if (visibleEntry?.target.id) {
          setActiveId(visibleEntry.target.id);
        }
      },
      { rootMargin: '-18% 0px -62% 0px', threshold: [0, 1] }
    );

    headingElements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, [rootId, visibleHeadings]);

  if (visibleHeadings.length === 0) {
    return null;
  }

  const scrollToHeading = (id: string) => {
    const target = document.getElementById(id);
    if (!target) {
      return;
    }

    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveId(id);
  };

  return (
    <section className="article-toc-panel" aria-label="文章目录">
      <div className="article-toc-head">
        <span>Reading Path</span>
        <strong>{String(visibleHeadings.length).padStart(2, '0')}</strong>
      </div>
      <nav className="article-toc-list" aria-label="当前文章标题导航">
        {visibleHeadings.map((heading, index) => {
          const isActive = activeId === heading.id || (!activeId && index === 0);
          return (
            <button
              type="button"
              className={isActive ? 'is-active' : undefined}
              data-level={heading.level}
              aria-current={isActive ? 'location' : undefined}
              onClick={() => scrollToHeading(heading.id)}
              key={heading.id}
            >
              <span>{formatTocIndex(index)}</span>
              <strong>{heading.text}</strong>
            </button>
          );
        })}
      </nav>
    </section>
  );
}

function formatTocIndex(index: number): string {
  return String(index + 1).padStart(2, '0');
}
