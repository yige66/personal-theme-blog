'use client';

import { useMemo } from 'react';
import { useTypewriter } from '@/components/room/useTypewriter';
import { useMusic } from './MusicProvider';

export function SidebarLyric() {
  const {
    currentIndex,
    currentTrack,
    currentLyric,
    isPlaying,
    nextTrack,
    playlist,
    previousTrack,
    togglePlaying
  } = useMusic();
  const typedLyric = useTypewriter(currentLyric, 32);
  const station = useMemo(() => {
    if (!currentTrack) {
      return 'radio idle';
    }

    return `${currentTrack.artist} / ${currentTrack.mood || 'focus'}`;
  }, [currentTrack]);

  if (!currentTrack) {
    return null;
  }

  return (
    <section className="article-radio-card" aria-label="文章侧栏电台" data-playing={isPlaying || undefined}>
      <div className="article-radio-cover">
        <img src={currentTrack.cover || '/assets/img/hero-mountain.svg'} alt={`${currentTrack.title} 封面`} />
        <span aria-hidden="true" />
      </div>
      <div className="article-radio-copy">
        <small>Sidebar Radio</small>
        <strong>{currentTrack.title}</strong>
        <span>{station}</span>
        <p>{typedLyric}<i aria-hidden="true" /></p>
      </div>
      <div className="article-radio-controls" aria-label="音乐控制">
        <button type="button" onClick={previousTrack} aria-label="上一首"><span aria-hidden="true">‹</span></button>
        <button className="is-primary" type="button" onClick={togglePlaying} aria-label={isPlaying ? '暂停' : '播放'}>
          <span aria-hidden="true">{isPlaying ? 'II' : '▶'}</span>
        </button>
        <button type="button" onClick={nextTrack} aria-label="下一首"><span aria-hidden="true">›</span></button>
      </div>
      <em>{String(currentIndex + 1).padStart(2, '0')} / {String(playlist.length).padStart(2, '0')}</em>
    </section>
  );
}
