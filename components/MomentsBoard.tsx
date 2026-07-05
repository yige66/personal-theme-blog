'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { PlanetaryOrbitMap, type PlanetaryOrbitItem } from '@/components/channels/PlanetaryOrbitMap';
import { MomentComments } from '@/components/comments/MomentComments';
import type { BlogNote, CommentConfig } from '@/lib/blog';

const allMood = '全部';

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

type MomentsBoardProps = {
  authorName: string;
  avatar?: string;
  comments: CommentConfig;
  notes: BlogNote[];
};

export function MomentsBoard({ authorName, avatar, comments, notes }: MomentsBoardProps) {
  const [query, setQuery] = useState('');
  const [activeMood, setActiveMood] = useState(allMood);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const displayName = authorName.trim() || '博客作者';
  const displayAvatar = avatar || '/assets/img/avatar-orbit.svg';

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
  const orbitItems = useMemo<PlanetaryOrbitItem[]>(() => filteredNotes.map((note, index) => ({
    id: note.id,
    eyebrow: String(index + 1).padStart(2, '0'),
    label: note.title || note.mood || '日常碎片',
    meta: formatDate(note.date).slice(0, 10),
    detail: `${note.content}${note.tags?.length ? ` / ${(note.tags ?? []).map((tag) => `#${tag}`).join(' ')}` : ''}`,
    href: `#moment-${note.id}`,
    heat: Math.min(5, Math.max(1, (note.tags?.length ?? 0) + 1))
  })), [filteredNotes]);

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

      <PlanetaryOrbitMap
        className="moment-constellation"
        count={filteredNotes.length}
        countLabel="moments"
        items={orbitItems}
        subtitle="Moment Planet"
        title="动态行星图"
        variant="moments"
      />

      <div className="moments-stream">
        {filteredNotes.map((note, index) => {
          const images = noteImages(note, index);
          return (
            <article className="moment-post" id={`moment-${note.id}`} key={note.id}>
              <header>
                <span className="moment-avatar">
                  <Image src={displayAvatar} alt="" width={64} height={64} />
                </span>
                <span>
                  <strong>{displayName}</strong>
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
