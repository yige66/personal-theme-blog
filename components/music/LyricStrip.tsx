'use client';

import { useMusic } from './MusicProvider';

export function LyricStrip() {
  const { currentLyric, currentTrack, isPlaying } = useMusic();

  return (
    <div className="xh-lyric-strip" data-motion="portal-card" aria-label="当前歌词" data-playing={isPlaying || undefined}>
      <span>{currentLyric}</span>
      <small>{currentTrack ? `${currentTrack.title} / ${currentTrack.artist}` : 'Local Playlist'}</small>
    </div>
  );
}
