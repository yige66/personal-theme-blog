'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMusic } from './MusicProvider';

export function CloudPlayerCard({ fallbackImage }: { fallbackImage: string }) {
  const {
    currentLyric,
    currentTime,
    currentTrack,
    duration,
    isLoading,
    isPlaying,
    loadError,
    nextTrack,
    playlist,
    previousTrack,
    progress,
    togglePlaying
  } = useMusic();
  const hasTracks = playlist.length > 0;
  const title = currentTrack?.title || '歌单待补全';
  const artist = currentTrack?.artist || 'Local Playlist';
  const lyricSubtitle = currentLyric || currentTrack?.note || '等待歌词';
  const cover = currentTrack?.cover?.startsWith('/') ? currentTrack.cover : fallbackImage;

  return (
    <article
      className="xh-cloud-player-card"
      data-motion="portal-card"
      data-playing={isPlaying ? 'true' : 'false'}
      data-loading={isLoading ? 'true' : 'false'}
      aria-label="音乐电台同步播放器"
    >
      <Link className="xh-cloud-player-open" href="/music" prefetch={false} aria-label={`打开音乐电台：${title}`} />
      <div className="xh-disc-cover" aria-hidden="true" data-playing={isPlaying ? 'true' : 'false'}>
        <Image src={cover} alt="" width={220} height={220} priority />
      </div>
      <div className="xh-cloud-copy">
        <p className="eyebrow">夜航电台</p>
        <h2>{title}</h2>
        <p>{artist}</p>
      </div>
      <p className="xh-cloud-note xh-cloud-lyric-subtitle" data-lyric-subtitle="true">{lyricSubtitle}</p>
      <div className="xh-player-progress" aria-label={`播放进度 ${formatTime(currentTime)} / ${formatTime(duration)}`}>
        <span>{formatTime(currentTime)}</span>
        <i aria-hidden="true"><b style={{ width: `${Math.max(2, progress)}%` }} /></i>
        <span>{isLoading ? 'Sync' : currentTrack?.url ? formatTime(duration) : 'Radio'}</span>
      </div>
      <div className="xh-player-controls" aria-label="音乐控制">
        <button type="button" aria-label="上一首" disabled={!hasTracks} onClick={previousTrack}>
          <span aria-hidden="true">‹</span>
        </button>
        <button className="xh-player-play-toggle" type="button" aria-label={isPlaying ? '暂停' : '播放'} disabled={!hasTracks} onClick={togglePlaying}>
          <span aria-hidden="true">{isPlaying ? 'II' : '▶'}</span>
        </button>
        <button type="button" aria-label="下一首" disabled={!hasTracks} onClick={nextTrack}>
          <span aria-hidden="true">›</span>
        </button>
      </div>
      <p className="xh-player-sync" aria-live="polite">
        <span>{loadError || formatSyncState(isLoading, isPlaying, Boolean(currentTrack?.url))}</span>
        <small>{hasTracks ? `${playlist.length} 首` : '待同步'}</small>
      </p>
      <div className="xh-player-bars" aria-hidden="true" data-playing={isPlaying ? 'true' : 'false'}>
        <i />
        <i />
        <i />
        <i />
        <i />
      </div>
    </article>
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

function formatSyncState(isLoading: boolean, isPlaying: boolean, hasAudio: boolean): string {
  if (isLoading) {
    return '电台同步中';
  }

  if (isPlaying) {
    return hasAudio ? '播放中' : '站内电台播放中';
  }

  return hasAudio ? '已同步' : '电台待接入';
}
