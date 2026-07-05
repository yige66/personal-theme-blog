'use client';

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import type { MusicTrack } from '@/lib/blog';
import { useMusic } from './music/MusicProvider';

function formatIndex(index: number): string {
  return String(index + 1).padStart(2, '0');
}

function buildLyrics(track: MusicTrack): Array<{ time: number; text: string }> {
  return [
    { time: 0, text: track.note || '这首歌还没有配置歌词说明。' },
    { time: 24, text: `适合 ${track.mood || '阅读与写作'} 的片段。` },
    { time: 52, text: '把日常、代码和灵感交给这一段旋律。' },
    { time: 86, text: '当真正音频地址接入后，这里会变成完整电台。' }
  ];
}

function formatTime(time: number): string {
  if (!Number.isFinite(time) || time <= 0) {
    return '0:00';
  }

  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function formatPlayModeLabel(mode: string): string {
  if (mode === 'repeat-one') {
    return '单曲循环';
  }

  if (mode === 'shuffle') {
    return '随机';
  }

  return '列表';
}

function formatTrackSource(track: MusicTrack): string {
  if (track.provider === 'netease') {
    return '网易云';
  }

  const source = (track.source || '').toLowerCase();
  if (!source) {
    return '本地';
  }

  if (source.includes('file')) {
    return '本地文件';
  }

  if (source.includes('synth')) {
    return '站内音频';
  }

  if (source.includes('local')) {
    return '本地';
  }

  if (source.includes('draft')) {
    return '草稿';
  }

  return track.source || '本地';
}

export function MusicStudio({ tracks }: { tracks: MusicTrack[] }) {
  const [tab, setTab] = useState<'lyrics' | 'playlist'>('lyrics');
  const [query, setQuery] = useState('');
  const {
    currentIndex,
    currentTrack,
    currentTime,
    currentLyric,
    duration,
    isPlaying,
    isLoading,
    isMuted,
    lyricLines,
    nextTrack,
    playlist,
    playMode,
    previousTrack,
    progress,
    addLocalAudioFiles,
    seekToProgress,
    selectTrack,
    setVolume,
    togglePlaying,
    toggleMute,
    togglePlayMode,
    volume
  } = useMusic();
  const lyricContainerRef = useRef<HTMLDivElement | null>(null);
  const activeLyricRef = useRef<HTMLParagraphElement | null>(null);
  const activeTrack = currentTrack ?? tracks[0];
  const effectiveVolume = isMuted ? 0 : volume;
  const volumePercent = Math.round(effectiveVolume * 100);
  const titleLength = Array.from(activeTrack?.title ?? '').length;
  const titleDensity = titleLength > 12 ? 'compact' : titleLength > 8 ? 'balanced' : 'normal';
  const sourceTracks = playlist.length > 0 ? playlist : tracks;
  const displayTracks = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return sourceTracks
      .map((track, index) => ({ track, index }))
      .filter(({ track }) => {
        if (!needle) {
          return true;
        }

        return [track.title, track.artist, track.mood, track.note || ''].join(' ').toLowerCase().includes(needle);
      });
  }, [query, sourceTracks]);
  const lyrics = useMemo(() => lyricLines.length > 0 ? lyricLines : activeTrack ? buildLyrics(activeTrack) : [], [activeTrack, lyricLines]);
  const activeLyricIndex = useMemo(() => {
    if (lyrics.length === 0) {
      return -1;
    }

    const nextIndex = lyrics.findIndex((line) => line.time > currentTime);
    return nextIndex === -1 ? lyrics.length - 1 : Math.max(0, nextIndex - 1);
  }, [currentTime, lyrics]);
  const heroLyricSubtitle = currentLyric || lyrics[Math.max(activeLyricIndex, 0)]?.text || activeTrack?.mood || '';

  const handleLocalAudioChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.currentTarget.files;
    if (files && files.length > 0) {
      addLocalAudioFiles(files);
      setTab('playlist');
    }
    event.currentTarget.value = '';
  };

  useEffect(() => {
    if (tab !== 'lyrics' || !activeLyricRef.current || !lyricContainerRef.current) {
      return;
    }

    const container = lyricContainerRef.current;
    const activeLine = activeLyricRef.current;
    const targetTop = activeLine.offsetTop - (container.clientHeight / 2) + (activeLine.clientHeight / 2);
    container.scrollTo({ top: targetTop, behavior: 'smooth' });
  }, [activeLyricIndex, tab]);

  if (!activeTrack) {
    return null;
  }

  return (
    <section
      className="main-shell music-studio"
      aria-label="音乐频道"
      style={{ '--music-cover': `url("${activeTrack.cover || '/assets/img/hero-mountain.svg'}")` } as React.CSSProperties}
    >
      <div className="music-stage">
        <div className="music-vinyl" aria-hidden="true" data-playing={isPlaying || undefined}>
          <img src={activeTrack.cover || '/assets/img/hero-mountain.svg'} alt="" />
        </div>
        <div
          className="music-current"
          data-long-title={titleDensity !== 'normal' ? 'true' : undefined}
          data-title-density={titleDensity}
        >
          <p className="eyebrow">Cloud Music</p>
          <h2>{activeTrack.title}</h2>
          <span>{activeTrack.artist}</span>
          <small className="music-player-subtitle" data-lyric-subtitle="true">{heroLyricSubtitle}</small>
        </div>
        <div className="music-progress">
          <span>{formatTime(currentTime)}</span>
          <label>
            <span className="visually-hidden">播放进度</span>
            <input
              type="range"
              min="0"
              max="100"
              step="0.01"
              value={Number(progress.toFixed(2))}
              onChange={(event) => seekToProgress(Number(event.currentTarget.value))}
              aria-label="调整播放进度"
              style={{ '--progress': `${progress}%` } as React.CSSProperties}
            />
          </label>
          <span>{formatTime(duration)}</span>
        </div>
        <div className="music-player-dock" aria-label="音乐播放控制">
          <button
            className="music-mode-button"
            type="button"
            onClick={togglePlayMode}
            aria-label={`切换播放模式，当前${formatPlayModeLabel(playMode)}`}
            title={formatPlayModeLabel(playMode)}
          >
            <span aria-hidden="true">{playMode === 'shuffle' ? '↯' : playMode === 'repeat-one' ? '↻1' : '↻'}</span>
          </button>
          <button className="music-skip-button" type="button" onClick={previousTrack} aria-label="上一首">
            <span aria-hidden="true">‹</span>
          </button>
          <button className="music-play-toggle" type="button" onClick={togglePlaying} aria-label={isPlaying ? '暂停' : '播放'}>
            <span aria-hidden="true">{isPlaying ? 'II' : '▶'}</span>
          </button>
          <button className="music-skip-button" type="button" onClick={nextTrack} aria-label="下一首">
            <span aria-hidden="true">›</span>
          </button>
          <div className="music-dock-volume" role="group" aria-label={`音量 ${volumePercent}%`}>
            <button className="music-volume-button" type="button" onClick={toggleMute} aria-label={isMuted ? '取消静音' : '静音'}>
              <span aria-hidden="true">{effectiveVolume === 0 ? '静' : '音'}</span>
            </button>
            <label>
              <span className="visually-hidden">音量</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={Number(effectiveVolume.toFixed(2))}
                onChange={(event) => setVolume(Number(event.currentTarget.value))}
                aria-label="调整音量"
                style={{ '--volume': `${volumePercent}%` } as React.CSSProperties}
              />
            </label>
          </div>
        </div>
      </div>

      <div className="music-panel">
        <div className="music-command-bar">
          <label className="music-search-field">
            <span>搜索歌单</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="歌曲、歌手、心情" />
          </label>
          <label className="music-file-picker">
            <span>选择音乐</span>
            <input type="file" accept="audio/*" multiple onChange={handleLocalAudioChange} aria-label="选择本地音乐文件" />
          </label>
          <span className="music-cloud-count" aria-label={`${playlist.length} 首歌曲，${isLoading ? '同步中' : '已就绪'}`}>
            <strong>{playlist.length}</strong>
            <small>{isLoading ? '同步中' : '首'}</small>
          </span>
          <div className="music-volume-cluster">
            <button className="music-route-chip" type="button" onClick={toggleMute} aria-label={isMuted ? '取消静音' : '静音'}>
              <span aria-hidden="true">{isMuted ? '静' : '音'}</span>
            </button>
            <label>
              <span className="visually-hidden">音量</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={(event) => setVolume(Number(event.currentTarget.value))}
                aria-label="调整音量"
              />
            </label>
          </div>
        </div>

        <div className="music-tabs" role="tablist" aria-label="音乐信息切换">
          <button className={tab === 'lyrics' ? 'is-active' : ''} type="button" role="tab" aria-selected={tab === 'lyrics'} onClick={() => setTab('lyrics')}>歌词</button>
          <button className={tab === 'playlist' ? 'is-active' : ''} type="button" role="tab" aria-selected={tab === 'playlist'} onClick={() => setTab('playlist')}>歌单</button>
        </div>

        {tab === 'lyrics' ? (
          <div ref={lyricContainerRef} className="music-lyrics" role="tabpanel" aria-label={`${activeTrack.title} 歌词`}>
            {lyrics.map((line, index) => (
              <p
                ref={index === activeLyricIndex ? activeLyricRef : null}
                className={index === activeLyricIndex ? 'is-active' : ''}
                onClick={() => duration > 0 ? seekToProgress((line.time / duration) * 100) : undefined}
                key={`${line.text}-${index}`}
              >
                {line.text}
              </p>
            ))}
          </div>
        ) : (
          <div className="music-playlist" role="tabpanel" aria-label="歌单列表">
            {displayTracks.map(({ track, index }) => (
              <button
                className={index === currentIndex ? 'is-active' : ''}
                data-playing={index === currentIndex && isPlaying ? 'true' : undefined}
                type="button"
                onClick={() => selectTrack(index)}
                key={`${track.title}-${index}`}
              >
                <span>{formatIndex(index)}</span>
                <img src={track.cover || '/assets/img/hero-mountain.svg'} alt="" />
                <strong>{track.title}</strong>
                <small>{track.artist}</small>
                <em>{index === currentIndex ? (isPlaying ? '播放中' : '当前') : track.mood || formatTrackSource(track)}</em>
              </button>
            ))}
            {displayTracks.length === 0 ? <p className="music-playlist-empty">没有匹配的歌曲。</p> : null}
          </div>
        )}
      </div>
    </section>
  );
}
