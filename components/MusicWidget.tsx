'use client';

import { useState } from 'react';
import type { MusicTrack } from '@/lib/blog';

export function MusicWidget({ tracks }: { tracks: MusicTrack[] }) {
  const [active, setActive] = useState(0);
  const track = tracks[active] ?? tracks[0];

  if (!track) {
    return null;
  }

  return (
    <section className="glass-card music-card" aria-label="音乐挂件">
      <div className="disc" aria-hidden="true"><i /></div>
      <div>
        <p className="eyebrow">Now Playing</p>
        <h3>{track.title}</h3>
        <p>{track.artist} / {track.mood || '阅读背景'}</p>
      </div>
      <div className="music-controls" aria-label="切换歌曲">
        {tracks.map((item, index) => (
          <button key={`${item.title}-${index}`} className={active === index ? 'active' : ''} type="button" onClick={() => setActive(index)}>
            {index + 1}
          </button>
        ))}
      </div>
      {track.url ? <audio controls src={track.url}>浏览器不支持音频播放。</audio> : <p className="music-hint">可在数据配置中填入本地音频或外链。</p>}
    </section>
  );
}
