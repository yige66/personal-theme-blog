'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMusic } from './MusicProvider';

export function CloudPlayerCard({ fallbackImage }: { fallbackImage: string }) {
  const { currentTime, currentTrack, duration, isLoading, isPlaying, nextTrack, previousTrack, progress, togglePlaying } = useMusic();

  return (
    <Link className="xh-cloud-player-card" href="/music" data-motion="portal-card" aria-label="打开音乐页">
      <div className="xh-disc-cover">
        <Image src={currentTrack?.cover || fallbackImage} alt={`${currentTrack?.title || '音乐'} 封面`} width={220} height={220} priority />
      </div>
      <div className="xh-cloud-copy">
        <p className="eyebrow">Cloud Music</p>
        <h2>{currentTrack?.title || '歌单待补全'}</h2>
        <p>{currentTrack?.artist || 'Local Playlist'}</p>
        <strong>{currentTrack?.note || '把写作、阅读和编码时的背景音乐收进这里。'}</strong>
      </div>
      <div className="xh-player-progress" aria-hidden="true">
        <span>{formatTime(currentTime)}</span>
        <i><b style={{ width: `${Math.max(2, progress)}%` }} /></i>
        <span>{isLoading ? 'Sync' : currentTrack?.url ? formatTime(duration) : 'Draft'}</span>
      </div>
      <div className="xh-player-controls" aria-label="音乐控制">
        <button type="button" aria-label="上一首" onClick={(event) => { event.preventDefault(); previousTrack(); }}>‹</button>
        <button type="button" aria-label={isPlaying ? '暂停' : '播放'} onClick={(event) => { event.preventDefault(); togglePlaying(); }}>
          {isPlaying ? 'Ⅱ' : '▶'}
        </button>
        <button type="button" aria-label="下一首" onClick={(event) => { event.preventDefault(); nextTrack(); }}>›</button>
      </div>
      <div className="xh-player-bars" aria-hidden="true" data-playing={isPlaying || undefined}>
        <i />
        <i />
        <i />
        <i />
        <i />
      </div>
    </Link>
  );
}

function formatTime(time: number): string {
  if (!Number.isFinite(time) || time <= 0) {
    return '0:00';
  }

  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
