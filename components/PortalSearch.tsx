'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { createPortalChannels, highlightMatchedText, searchPortal, type PortalSearchEntry } from '@/lib/portal-index';

export function PortalSearch({ entries }: { entries: PortalSearchEntry[] }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const results = useMemo(() => searchPortal(entries, query, 8), [entries, query]);
  const channels = useMemo(() => createPortalChannels(entries), [entries]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setOpen(true);
  };

  return (
    <section className="portal-search" aria-label="站内搜索入口">
      <form onSubmit={handleSubmit}>
        <label htmlFor="portal-search-input">Search</label>
        <input
          id="portal-search-input"
          type="search"
          value={query}
          placeholder="搜索文章、项目、标签、相册或动态"
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          autoComplete="off"
        />
        <button type="submit" aria-label="搜索">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M10.8 4a6.8 6.8 0 015.4 10.94l3.43 3.43-1.42 1.42-3.43-3.43A6.8 6.8 0 1110.8 4zm0 2a4.8 4.8 0 100 9.6 4.8 4.8 0 000-9.6z" />
          </svg>
        </button>
      </form>

      {open ? (
        <div className="portal-search-panel">
          <div className="portal-search-head">
            <span>{query ? `找到 ${results.length} 条相关入口` : '快速抵达'}</span>
            <button type="button" onClick={() => setOpen(false)} aria-label="关闭搜索结果">关闭</button>
          </div>
          {results.length ? (
            <div className="portal-search-results">
              {results.map((entry) => (
                <Link href={entry.href} onClick={() => setOpen(false)} key={entry.id}>
                  <small>{entry.type}</small>
                  <strong>
                    {highlightMatchedText(entry.title, entry.matched).map((part, index) => (
                      <mark key={`${part.text}-${index}`} data-hit={part.hit || undefined}>{part.text}</mark>
                    ))}
                  </strong>
                  <span>{entry.description}</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="portal-search-empty">暂时没有命中，换一个关键词试试。</p>
          )}
          {!query ? (
            <div className="portal-channel-grid" aria-label="内容频道">
              {channels.map((channel) => (
                <Link href={channel.href} key={channel.id} onClick={() => setOpen(false)}>
                  <small>{channel.eyebrow}</small>
                  <strong>{channel.title}</strong>
                  <span>{channel.count} entries</span>
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
