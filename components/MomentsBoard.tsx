'use client';

import { useMemo, useState } from 'react';
import { GitHubComments } from '@/components/comments/GitHubComments';
import type { BlogNote, CommentConfig } from '@/lib/blog';

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit'
  }).format(new Date(value));
}

export function MomentsBoard({ comments, notes }: { comments: CommentConfig; notes: BlogNote[] }) {
  const [query, setQuery] = useState('');
  const [activeMood, setActiveMood] = useState('全部');

  const moods = useMemo(() => ['全部', ...Array.from(new Set(notes.map((note) => note.mood).filter(Boolean))) as string[]], [notes]);
  const filteredNotes = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return notes.filter((note) => {
      const matchesMood = activeMood === '全部' || note.mood === activeMood;
      const matchesQuery = !keyword || `${note.title || ''} ${note.content} ${(note.tags ?? []).join(' ')}`.toLowerCase().includes(keyword);
      return matchesMood && matchesQuery;
    });
  }, [activeMood, notes, query]);

  return (
    <section className="main-shell moments-board" aria-label="说说动态频道">
      <div className="moments-board-toolbar">
        <label>
          <span>搜索动态</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="输入灵感、状态或标签" />
        </label>
        <div className="moments-mood-filter" aria-label="心情筛选">
          {moods.map((mood) => (
            <button className={activeMood === mood ? 'is-active' : ''} type="button" onClick={() => setActiveMood(mood)} key={mood}>
              {mood}
            </button>
          ))}
        </div>
      </div>

      <div className="moments-film-rail" aria-hidden="true">
        {filteredNotes.slice(0, 10).map((note, index) => (
          <span key={`${note.id}-film-${index}`}>
            <i />
          </span>
        ))}
      </div>

      <div className="moments-stream">
        {filteredNotes.map((note, index) => (
          <article className={`moment-post moment-note-${index % 4}`} key={note.id}>
            <time>{formatDate(note.date)}</time>
            <h3>{note.title || `日常碎片 ${index + 1}`}</h3>
            <p>{note.content}</p>
            <footer>
              {note.mood ? <span>{note.mood}</span> : null}
              {(note.tags ?? []).slice(0, 4).map((tag) => <small key={tag}>#{tag}</small>)}
            </footer>
            <GitHubComments compact config={comments} term={`/moments/${note.id}`} title={note.title || `日常碎片 ${index + 1}`} />
          </article>
        ))}
      </div>

      {filteredNotes.length === 0 ? <p className="moments-empty">没有找到这类动态。</p> : null}
    </section>
  );
}
