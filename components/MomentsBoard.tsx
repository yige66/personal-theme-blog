'use client';

import Image from 'next/image';
import { useMemo, useState, type CSSProperties } from 'react';
import { MomentComments } from '@/components/comments/MomentComments';
import type { BlogNote, CommentConfig } from '@/lib/blog';

const allMood = '全部';

const momentSlots = [
  { x: '50%', y: '18%' },
  { x: '68%', y: '30%' },
  { x: '75%', y: '55%' },
  { x: '60%', y: '76%' },
  { x: '39%', y: '76%' },
  { x: '25%', y: '55%' },
  { x: '32%', y: '30%' },
  { x: '50%', y: '50%' }
];

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
}

function noteImages(note: BlogNote, index: number): string[] {
  if (note.images?.length) {
    return note.images.slice(0, 6);
  }

  const pool = ['/assets/img/hero-mountain.svg', '/assets/img/desk-notes.svg', '/assets/img/admin-board.svg', '/assets/img/avatar-orbit.svg'];
  const tags = note.tags ?? [];
  const count = tags.length >= 3 ? 3 : tags.length >= 1 ? 2 : 0;
  return Array.from({ length: count }, (_item, imageIndex) => pool[(index + imageIndex) % pool.length]);
}

export function MomentsBoard({ comments, notes }: { comments: CommentConfig; notes: BlogNote[] }) {
  const [query, setQuery] = useState('');
  const [activeMood, setActiveMood] = useState(allMood);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const moods = useMemo(() => [allMood, ...Array.from(new Set(notes.map((note) => note.mood).filter(Boolean))) as string[]], [notes]);
  const filteredNotes = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return notes
      .filter((note) => {
        const matchesMood = activeMood === allMood || note.mood === activeMood;
        const matchesQuery = !keyword || `${note.title || ''} ${note.content} ${(note.tags ?? []).join(' ')}`.toLowerCase().includes(keyword);
        return matchesMood && matchesQuery;
      })
      .sort((a, b) => {
        const left = new Date(a.date).getTime();
        const right = new Date(b.date).getTime();
        return sortOrder === 'desc' ? right - left : left - right;
      });
  }, [activeMood, notes, query, sortOrder]);

  return (
    <section className="main-shell moments-board moments-starchart xh-reference-surface" aria-label="说说动态频道">
      <div className="moments-board-toolbar xh-reference-toolbar">
        <label>
          <span>Search</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索被遗忘的记忆..." />
        </label>
        <div className="moments-mood-filter" aria-label="心情筛选">
          {moods.map((mood) => (
            <button className={activeMood === mood ? 'is-active' : ''} type="button" onClick={() => setActiveMood(mood)} key={mood}>
              {mood}
            </button>
          ))}
        </div>
        <div className="moments-sort-toggle" aria-label="排序方式">
          <button className={sortOrder === 'desc' ? 'is-active' : ''} type="button" onClick={() => setSortOrder('desc')}>最新</button>
          <button className={sortOrder === 'asc' ? 'is-active' : ''} type="button" onClick={() => setSortOrder('asc')}>最早</button>
        </div>
      </div>

      <div className="moment-constellation" aria-label="说说星图">
        <span className="moment-constellation-core">
          <strong>{filteredNotes.length}</strong>
          <small>moments</small>
        </span>
        <div className="moment-orbit-paths" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        {filteredNotes.slice(0, 12).map((note, index) => {
          const slot = momentSlots[index % momentSlots.length];
          const angle = -90 + (360 / Math.max(filteredNotes.length, 1)) * index;

          return (
            <a
              className="moment-star"
              href={`#moment-${note.id}`}
              style={{
                '--moment-angle': `${angle}deg`,
                '--moment-inverse': `${-angle}deg`,
                '--moment-radius': `${128 + (index % 3) * 26}px`,
                '--moment-x': slot.x,
                '--moment-y': slot.y,
                '--moment-delay': `${index * 80}ms`
              } as CSSProperties}
              title={note.title || note.content}
              key={`${note.id}-star`}
            >
              <small>{String(index + 1).padStart(2, '0')}</small>
              <strong>{note.title || note.mood || '日常碎片'}</strong>
              <span>{formatDate(note.date).slice(0, 10)}</span>
            </a>
          );
        })}
      </div>

      <div className="moments-stream">
        {filteredNotes.map((note, index) => {
          const images = noteImages(note, index);
          return (
            <article className="moment-post" id={`moment-${note.id}`} key={note.id}>
              <header>
                <span className="moment-avatar">
                  <Image src="/assets/img/avatar-orbit.svg" alt="" width={64} height={64} />
                </span>
                <span>
                  <strong>星屿手记</strong>
                  <time>{formatDate(note.date)}</time>
                </span>
              </header>
              <p>{note.content}</p>
              {images.length ? (
                <div className={`moment-image-grid count-${images.length}`} aria-label="动态配图">
                  {images.map((src) => (
                    <button type="button" key={src}>
                      <Image src={src} alt="" width={280} height={200} />
                    </button>
                  ))}
                </div>
              ) : null}
              <footer>
                <span className="moment-location">长沙 / Changsha</span>
                <span className="moment-tags">
                  {note.mood ? <small>{note.mood}</small> : null}
                  {(note.tags ?? []).slice(0, 4).map((tag) => <small key={tag}>#{tag}</small>)}
                </span>
              </footer>
              <details className="moment-comment-dock">
                <summary aria-label={`评论 ${note.title || note.id}`}>评论</summary>
                <MomentComments config={comments} term={`/moments/${note.id}`} title={note.title || `日常碎片 ${index + 1}`} />
              </details>
            </article>
          );
        })}
      </div>

      {filteredNotes.length === 0 ? <p className="moments-empty">没有找到这类动态。</p> : null}
    </section>
  );
}
