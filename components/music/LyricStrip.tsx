'use client';

import { useMusic } from './MusicProvider';

export function LyricStrip() {
  const { currentLyric, isPlaying, isLyricPrelude } = useMusic();
  const caption = currentLyric || '\u7b49\u5f85\u6b4c\u8bcd';

  return (
    <div
      className="xh-lyric-strip"
      data-motion="portal-card"
      aria-label={'\u5f53\u524d\u6b4c\u8bcd'}
      data-playing={isPlaying ? 'true' : 'false'}
      data-prelude={isLyricPrelude ? 'true' : 'false'}
    >
      <span className="xh-lyric-dots" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
        <i />
      </span>
      <span className="xh-lyric-caption" key={caption}>
        <span className="xh-lyric-text">{caption}</span>
      </span>
      <span className="xh-lyric-note" aria-hidden="true">{'\u266a'}</span>
    </div>
  );
}
