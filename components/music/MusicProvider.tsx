'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { MusicTrack } from '@/lib/blog';

type LyricLine = {
  time: number;
  text: string;
};

type PlayMode = 'list' | 'loop' | 'shuffle';

type MusicContextValue = {
  playlist: MusicTrack[];
  currentIndex: number;
  currentTrack: MusicTrack | null;
  isPlaying: boolean;
  isLoading: boolean;
  loadError: string;
  progress: number;
  currentTime: number;
  duration: number;
  currentLyric: string;
  lyricLines: LyricLine[];
  playMode: PlayMode;
  volume: number;
  isMuted: boolean;
  selectTrack: (index: number) => void;
  togglePlaying: () => void;
  togglePlayMode: () => void;
  nextTrack: () => void;
  previousTrack: () => void;
  reloadCloudMusic: () => void;
  seekToProgress: (progress: number) => void;
  setVolume: (value: number) => void;
  toggleMute: () => void;
};

type StoredMusicState = {
  currentIndex?: number;
  playMode?: PlayMode;
  volume?: number;
  isMuted?: boolean;
};

const MusicContext = createContext<MusicContextValue | null>(null);
const STORAGE_KEY = 'personal-theme-blog:music-state';
const CLOUD_CACHE_KEY = 'personal-theme-blog:cloud-music';

export function MusicProvider({ children, tracks, cloudMusicIds = [] }: { children: ReactNode; tracks: MusicTrack[]; cloudMusicIds?: string[] }) {
  const [remoteTracks, setRemoteTracks] = useState<MusicTrack[]>([]);
  const [syncNonce, setSyncNonce] = useState(0);
  const [isLoading, setIsLoading] = useState(cloudMusicIds.length > 0);
  const [loadError, setLoadError] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playMode, setPlayMode] = useState<PlayMode>('list');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [volume, setVolumeState] = useState(0.84);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playlist = useMemo(() => mergePlaylist(tracks, remoteTracks), [tracks, remoteTracks]);
  const currentTrack = playlist[currentIndex] ?? playlist[0] ?? null;
  const lyricLines = useMemo(() => parseTrackLyrics(currentTrack), [currentTrack]);
  const activeDuration = duration || getDraftDuration(currentTrack, currentIndex);
  const currentLyric = useMemo(() => {
    if (!currentTrack) {
      return '歌单等待配置。';
    }

    for (let index = lyricLines.length - 1; index >= 0; index -= 1) {
      if (currentTime >= lyricLines[index].time) {
        return lyricLines[index].text;
      }
    }

    return currentTrack.note || currentTrack.mood || '歌单等待配置。';
  }, [currentTime, currentTrack, lyricLines]);

  const selectTrack = useCallback((index: number) => {
    setCurrentIndex((previousIndex) => {
      if (playlist.length === 0) {
        return previousIndex;
      }

      return (index + playlist.length) % playlist.length;
    });
    setIsPlaying(playlist.length > 0);
  }, [playlist.length]);

  const nextTrack = useCallback(() => {
    if (playlist.length === 0) {
      return;
    }

    if (playMode === 'shuffle') {
      setCurrentIndex((index) => {
        if (playlist.length <= 1) {
          return index;
        }

        const nextIndex = Math.floor(Math.random() * (playlist.length - 1));
        return nextIndex >= index ? nextIndex + 1 : nextIndex;
      });
      setIsPlaying(true);
      return;
    }

    if (playMode === 'loop' && currentIndex === playlist.length - 1) {
      selectTrack(0);
      return;
    }

    if (playMode === 'list' && currentIndex === playlist.length - 1) {
      setCurrentTime(0);
      setProgress(0);
      setIsPlaying(false);
      return;
    }

    selectTrack(currentIndex + 1);
  }, [currentIndex, playMode, playlist.length, selectTrack]);

  const previousTrack = useCallback(() => {
    if (playlist.length === 0) {
      return;
    }

    if (playMode === 'list' && currentIndex === 0) {
      setCurrentTime(0);
      setProgress(0);
      setIsPlaying(true);
      return;
    }

    selectTrack(currentIndex - 1);
  }, [currentIndex, playMode, playlist.length, selectTrack]);

  const togglePlaying = () => {
    setIsPlaying((playing) => playlist.length > 0 ? !playing : false);
  };

  const togglePlayMode = () => {
    setPlayMode((mode) => mode === 'list' ? 'loop' : mode === 'loop' ? 'shuffle' : 'list');
  };

  const reloadCloudMusic = useCallback(() => {
    setLoadError('');
    setSyncNonce((value) => value + 1);
  }, []);

  const seekToProgress = (nextProgress: number) => {
    const clamped = Math.min(100, Math.max(0, nextProgress));
    const nextTime = (clamped / 100) * activeDuration;
    setProgress(clamped);
    setCurrentTime(nextTime);

    if (audioRef.current && currentTrack?.url) {
      audioRef.current.currentTime = nextTime;
    }
  };

  const setVolume = (value: number) => {
    const clamped = Math.min(1, Math.max(0, value));
    setVolumeState(clamped);
    if (clamped > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const updateFromAudio = () => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    const nextDuration = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : currentTrack?.duration ?? 0;
    const nextCurrentTime = audio.currentTime || 0;
    setDuration(nextDuration);
    setCurrentTime(nextCurrentTime);
    setProgress(nextDuration ? (nextCurrentTime / nextDuration) * 100 : 0);
  };

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return;
      }

      const state = JSON.parse(stored) as StoredMusicState;
      if (state.playMode === 'list' || state.playMode === 'loop' || state.playMode === 'shuffle') {
        setPlayMode(state.playMode);
      }
      if (typeof state.volume === 'number') {
        setVolumeState(Math.min(1, Math.max(0, state.volume)));
      }
      if (typeof state.isMuted === 'boolean') {
        setIsMuted(state.isMuted);
      }
      if (typeof state.currentIndex === 'number' && state.currentIndex >= 0) {
        setCurrentIndex(state.currentIndex);
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    const state: StoredMusicState = { currentIndex, playMode, volume, isMuted };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [currentIndex, isMuted, playMode, volume]);

  useEffect(() => {
    if (cloudMusicIds.length === 0) {
      setIsLoading(false);
      return undefined;
    }

    const cacheKey = `${CLOUD_CACHE_KEY}:${cloudMusicIds.join(',')}`;
    try {
      const cached = window.sessionStorage.getItem(cacheKey);
      if (cached) {
        const payload = JSON.parse(cached) as { tracks?: MusicTrack[] };
        if (Array.isArray(payload.tracks)) {
          setRemoteTracks(payload.tracks);
        }
      }
    } catch {
      window.sessionStorage.removeItem(cacheKey);
    }

    const controller = new AbortController();
    setIsLoading(true);
    setLoadError('');

    fetch(`/api/music?ids=${encodeURIComponent(cloudMusicIds.join(','))}`, { signal: controller.signal })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('music api failed')))
      .then((payload: { tracks?: MusicTrack[] }) => {
        const nextTracks = Array.isArray(payload.tracks) ? payload.tracks : [];
        setRemoteTracks(nextTracks);
        window.sessionStorage.setItem(cacheKey, JSON.stringify({ tracks: nextTracks, savedAt: Date.now() }));
      })
      .catch((error) => {
        if ((error as Error).name !== 'AbortError') {
          setLoadError('云音乐同步暂时不可用，已保留本地歌单。');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, [cloudMusicIds, syncNonce]);

  useEffect(() => {
    if (currentIndex >= playlist.length && playlist.length > 0) {
      setCurrentIndex(0);
    }
  }, [currentIndex, playlist.length]);

  useEffect(() => {
    setCurrentTime(0);
    setProgress(0);
    setDuration(currentTrack?.duration ?? 0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  }, [currentTrack]);

  useEffect(() => {
    if (!audioRef.current) {
      return;
    }

    audioRef.current.volume = isMuted ? 0 : volume;
  }, [isMuted, volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack?.url) {
      return undefined;
    }

    if (!isPlaying) {
      audio.pause();
      return undefined;
    }

    audio.play().catch(() => {
      setLoadError('浏览器阻止了本次播放，请再点一次播放按钮。');
      setIsPlaying(false);
    });
    return undefined;
  }, [currentTrack?.url, isPlaying]);

  useEffect(() => {
    if (!isPlaying || currentTrack?.url) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setCurrentTime((time) => {
        const nextTime = Math.min(time + 1, activeDuration);
        if (nextTime >= activeDuration) {
          setProgress(0);
          window.setTimeout(() => nextTrack(), 0);
          return 0;
        }

        setProgress((nextTime / activeDuration) * 100);
        return nextTime;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [activeDuration, currentTrack?.url, isPlaying, nextTrack]);

  const value: MusicContextValue = {
    playlist,
    currentIndex,
    currentTrack,
    isPlaying,
    isLoading,
    loadError,
    progress,
    currentTime,
    duration: activeDuration,
    currentLyric,
    lyricLines,
    playMode,
    volume,
    isMuted,
    selectTrack,
    togglePlaying,
    togglePlayMode,
    nextTrack,
    previousTrack,
    reloadCloudMusic,
    seekToProgress,
    setVolume,
    toggleMute: () => setIsMuted((muted) => !muted)
  };

  return (
    <MusicContext.Provider value={value}>
      {children}
      {currentTrack?.url ? (
        <audio
          ref={audioRef}
          src={currentTrack.url}
          preload="metadata"
          onLoadedMetadata={updateFromAudio}
          onTimeUpdate={updateFromAudio}
          onEnded={nextTrack}
          onError={() => {
            setLoadError('当前音频源暂时不可播放，已切换为站内电台降级状态。');
            setIsPlaying(false);
          }}
        />
      ) : null}
    </MusicContext.Provider>
  );
}

export function useMusic() {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error('useMusic must be used within MusicProvider');
  }
  return context;
}

function mergePlaylist(localTracks: MusicTrack[], remoteTracks: MusicTrack[]): MusicTrack[] {
  const seen = new Set<string>();
  return [...remoteTracks, ...localTracks]
    .filter((track) => track.title)
    .filter((track) => {
      const key = `${track.provider || track.source || 'local'}:${track.id || track.title}:${track.artist}`;
      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
}

function parseTrackLyrics(track: MusicTrack | null): LyricLine[] {
  if (!track) {
    return [];
  }

  if (Array.isArray(track.lyrics)) {
    return track.lyrics
      .map((line, index) => typeof line === 'string' ? { time: index * 18, text: line } : line)
      .filter((line) => line.text);
  }

  const rawLyrics = typeof track.lyrics === 'string' ? track.lyrics : track.lrc || track.lyric || '';
  if (!rawLyrics) {
    return [
      { time: 0, text: track.note || '这首歌还没有配置歌词说明。' },
      { time: 24, text: `适合 ${track.mood || '阅读与写作'} 的片段。` },
      { time: 52, text: '把日常、代码和灵感交给这一段旋律。' },
      { time: 86, text: track.url ? '真实音频已经接入，播放器会跟随进度更新。' : '等待真实音频接入时，这里会以站内电台节奏运行。' }
    ];
  }

  const parsedLines: LyricLine[] = [];
  for (const line of rawLyrics.split(/\r?\n/)) {
    const matches = [...line.matchAll(/\[(\d{2,}):(\d{2})(?:[.:](\d{2,3}))?\]/g)];
    const text = line.replace(/\[\d{2,}:\d{2}(?:[.:]\d{2,3})?\]/g, '').trim();
    if (!text) {
      continue;
    }

    if (matches.length === 0) {
      parsedLines.push({ time: parsedLines.length * 18, text });
      continue;
    }

    for (const match of matches) {
      const minutes = Number.parseInt(match[1], 10);
      const seconds = Number.parseInt(match[2], 10);
      const fraction = match[3] ? Number.parseInt(match[3], 10) / (match[3].length === 3 ? 1000 : 100) : 0;
      parsedLines.push({ time: minutes * 60 + seconds + fraction, text });
    }
  }

  return parsedLines.sort((a, b) => a.time - b.time);
}

function getDraftDuration(track: MusicTrack | null, index: number): number {
  if (track?.duration && track.duration > 0) {
    return track.duration;
  }

  return 192 + (index % 4) * 18;
}
