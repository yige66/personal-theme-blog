'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { MusicTrack } from '@/lib/blog';

type LyricLine = {
  time: number;
  text: string;
};

type PlayMode = 'list' | 'repeat-one' | 'shuffle';

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
  isLyricPrelude: boolean;
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
  addLocalAudioFiles: (files: FileList | File[]) => void;
  seekToProgress: (progress: number) => void;
  setVolume: (value: number) => void;
  toggleMute: () => void;
};

type StoredMusicState = {
  currentIndex?: number;
  playMode?: PlayMode | 'loop' | 'repeat-all';
  volume?: number;
  isMuted?: boolean;
};

type LocalFileTrack = MusicTrack & {
  objectUrl: string;
};

const MusicContext = createContext<MusicContextValue | null>(null);
const STORAGE_KEY = 'personal-theme-blog:music-state';
const CLOUD_CACHE_KEY = 'personal-theme-blog:cloud-music';
const LOCAL_FILE_LIMIT = 20;
const AUDIO_FILE_NAME_PATTERN = /\.(?:aac|flac|m4a|mp3|oga|ogg|opus|wav|webm)$/i;
const PLAY_MODE_SEQUENCE = ['list', 'repeat-one', 'shuffle'] satisfies PlayMode[];

function normalizePlayMode(mode: unknown): PlayMode | null {
  if (mode === 'loop' || mode === 'repeat-all') {
    return 'shuffle';
  }

  return PLAY_MODE_SEQUENCE.includes(mode as PlayMode) ? mode as PlayMode : null;
}

export function MusicProvider({ children, tracks, cloudMusicIds = [] }: { children: ReactNode; tracks: MusicTrack[]; cloudMusicIds?: string[] }) {
  const [remoteTracks, setRemoteTracks] = useState<MusicTrack[]>([]);
  const [localFileTracks, setLocalFileTracks] = useState<LocalFileTrack[]>([]);
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
  const [fallbackTrackKeys, setFallbackTrackKeys] = useState<Set<string>>(() => new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const localFileUrlsRef = useRef<Set<string>>(new Set());

  const playlist = useMemo(() => mergePlaylist(localFileTracks, remoteTracks, tracks), [localFileTracks, remoteTracks, tracks]);
  const currentTrack = playlist[currentIndex] ?? playlist[0] ?? null;
  const lyricLines = useMemo(() => parseTrackLyrics(currentTrack), [currentTrack]);
  const currentTrackKey = useMemo(() => currentTrack ? getTrackKey(currentTrack) : '', [currentTrack]);
  const canUseAudio = Boolean(currentTrack?.url && currentTrackKey && !fallbackTrackKeys.has(currentTrackKey));
  const activeDuration = duration || getDraftDuration(currentTrack, currentIndex);
  const isLyricPrelude = lyricLines.length > 0 && currentTime < lyricLines[0].time;
  const handleAudioPlaybackFailure = useCallback((error?: unknown) => {
    const errorName = error instanceof Error ? error.name : '';
    if (errorName === 'NotAllowedError') {
      setIsPlaying(false);
      setLoadError('浏览器需要你点击播放按钮后才能出声。');
      return;
    }

    setFallbackTrackKeys((keys) => {
      const nextKeys = new Set(keys);
      if (currentTrackKey) {
        nextKeys.add(currentTrackKey);
      }
      return nextKeys;
    });
    setLoadError('当前音频源暂时不可播放，已切换为站内电台降级状态。');
  }, [currentTrackKey]);
  const currentLyric = useMemo(() => {
    if (!currentTrack) {
      return '歌单等待配置。';
    }

    for (let index = lyricLines.length - 1; index >= 0; index -= 1) {
      if (currentTime >= lyricLines[index].time) {
        return lyricLines[index].text;
      }
    }

    if (lyricLines.length > 0) {
      return lyricLines[0].text;
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

    if (playMode === 'list' && currentIndex === playlist.length - 1) {
      setCurrentTime(0);
      setProgress(0);
      setIsPlaying(false);
      return;
    }

    selectTrack(currentIndex + 1);
  }, [currentIndex, playMode, playlist.length, selectTrack]);

  const replayCurrentTrack = useCallback(() => {
    setCurrentTime(0);
    setProgress(0);
    setIsPlaying(playlist.length > 0);

    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }

    if (canUseAudio) {
      audioRef.current?.play().catch(handleAudioPlaybackFailure);
    }
  }, [canUseAudio, handleAudioPlaybackFailure, playlist.length]);

  const handleTrackEnded = useCallback(() => {
    if (playMode === 'repeat-one') {
      replayCurrentTrack();
      return;
    }

    nextTrack();
  }, [nextTrack, playMode, replayCurrentTrack]);

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

  const togglePlaying = useCallback(() => {
    if (playlist.length === 0) {
      setIsPlaying(false);
      return;
    }

    setIsPlaying((playing) => {
      const nextPlaying = !playing;
      if (!nextPlaying) {
        audioRef.current?.pause();
        return false;
      }

      if (canUseAudio) {
        audioRef.current?.play().catch(handleAudioPlaybackFailure);
      }

      return true;
    });
  }, [canUseAudio, handleAudioPlaybackFailure, playlist.length]);

  const togglePlayMode = useCallback(() => {
    setPlayMode((mode) => {
      const index = PLAY_MODE_SEQUENCE.indexOf(mode);
      return PLAY_MODE_SEQUENCE[(index + 1) % PLAY_MODE_SEQUENCE.length] ?? 'list';
    });
  }, []);

  const reloadCloudMusic = useCallback(() => {
    setLoadError('');
    setFallbackTrackKeys(new Set());
    setSyncNonce((value) => value + 1);
  }, []);

  const addLocalAudioFiles = useCallback((files: FileList | File[]) => {
    const audioFiles = Array.from(files).filter((file) => file.type.startsWith('audio/') || AUDIO_FILE_NAME_PATTERN.test(file.name));
    if (audioFiles.length === 0) {
      setLoadError('请选择可播放的音频文件。');
      return;
    }

    const createdAt = Date.now();
    const nextTracks = audioFiles.map((file, index): LocalFileTrack => {
      const objectUrl = URL.createObjectURL(file);
      localFileUrlsRef.current.add(objectUrl);
      return {
        id: `local-file-${createdAt}-${index}-${file.name}`,
        title: file.name.replace(/\.[^.]+$/, '') || `本地音乐 ${index + 1}`,
        artist: '本地音频',
        mood: '本地选择',
        url: objectUrl,
        cover: '/assets/img/desk-notes.svg',
        source: 'local-file',
        provider: 'local-file',
        note: '来自你本机选择的音频文件，仅在当前浏览器会话中播放。',
        objectUrl
      };
    });

    setLocalFileTracks((previousTracks) => {
      const mergedTracks = [...nextTracks, ...previousTracks];
      const retainedTracks = mergedTracks.slice(0, LOCAL_FILE_LIMIT);
      for (const track of mergedTracks.slice(LOCAL_FILE_LIMIT)) {
        URL.revokeObjectURL(track.objectUrl);
        localFileUrlsRef.current.delete(track.objectUrl);
      }
      return retainedTracks;
    });
    setFallbackTrackKeys(new Set());
    setLoadError('');
    setCurrentIndex(0);
    setIsPlaying(true);
  }, []);

  const seekToProgress = (nextProgress: number) => {
    const clamped = Math.min(100, Math.max(0, nextProgress));
    const nextTime = (clamped / 100) * activeDuration;
    setProgress(clamped);
    setCurrentTime(nextTime);

    if (audioRef.current && canUseAudio) {
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
      const storedPlayMode = normalizePlayMode(state.playMode);
      if (storedPlayMode) {
        setPlayMode(storedPlayMode);
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
    return () => {
      for (const objectUrl of localFileUrlsRef.current) {
        URL.revokeObjectURL(objectUrl);
      }
      localFileUrlsRef.current.clear();
    };
  }, []);

  useEffect(() => {
    if (cloudMusicIds.length === 0) {
      setRemoteTracks([]);
      setIsLoading(false);
      setLoadError('');
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
    if (!audio || !canUseAudio) {
      return undefined;
    }

    if (!isPlaying) {
      audio.pause();
      return undefined;
    }

    audio.play().catch(handleAudioPlaybackFailure);
    return undefined;
  }, [canUseAudio, handleAudioPlaybackFailure, isPlaying]);

  useEffect(() => {
    if (!isPlaying || canUseAudio) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setCurrentTime((time) => {
        const nextTime = Math.min(time + 1, activeDuration);
        if (nextTime >= activeDuration) {
          setProgress(0);
          window.setTimeout(() => handleTrackEnded(), 0);
          return 0;
        }

        setProgress((nextTime / activeDuration) * 100);
        return nextTime;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [activeDuration, canUseAudio, handleTrackEnded, isPlaying]);

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
    isLyricPrelude,
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
    addLocalAudioFiles,
    seekToProgress,
    setVolume,
    toggleMute: () => setIsMuted((muted) => !muted)
  };

  return (
    <MusicContext.Provider value={value}>
      {children}
      {canUseAudio ? (
        <audio
          ref={audioRef}
          src={currentTrack?.url}
          preload="metadata"
          onLoadedMetadata={updateFromAudio}
          onTimeUpdate={updateFromAudio}
          onEnded={handleTrackEnded}
          onError={() => {
            setFallbackTrackKeys((keys) => {
              const nextKeys = new Set(keys);
              if (currentTrackKey) {
                nextKeys.add(currentTrackKey);
              }
              return nextKeys;
            });
            setLoadError('当前音频源暂时不可播放，已切换为站内电台降级状态。');
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

function mergePlaylist(...trackGroups: MusicTrack[][]): MusicTrack[] {
  const seen = new Set<string>();
  return trackGroups
    .flat()
    .filter((track) => track.title)
    .filter((track) => {
      const key = getTrackKey(track);
      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
}

function getTrackKey(track: MusicTrack): string {
  return `${track.provider || track.source || 'local'}:${track.id || track.title}:${track.artist}`;
}

const LRC_TIMESTAMP_PATTERN = /\[(\d{2,}):(\d{2})(?:[.:](\d{2,3}))?\]/g;
const LRC_TIMESTAMP_TEXT_PATTERN = /\[\d{2,}:\d{2}(?:[.:]\d{2,3})?\]/g;
const LRC_METADATA_PATTERN = /^\[(?:ti|ar|al|au|by|offset|re|ve|length|tool|kana|language|trans|translation|roma|romanization):[^\]]*\]$/i;

function isLrcMetadataLine(line: string): boolean {
  return LRC_METADATA_PATTERN.test(line);
}

function mergeTimedLyricLines(lines: LyricLine[]): LyricLine[] {
  const grouped = new Map<number, string[]>();

  for (const line of lines.sort((a, b) => a.time - b.time)) {
    const texts = grouped.get(line.time) ?? [];
    if (!texts.includes(line.text)) {
      texts.push(line.text);
    }
    grouped.set(line.time, texts);
  }

  return [...grouped.entries()].map(([time, texts]) => ({
    time,
    text: texts.join('\n')
  }));
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
    const normalizedLine = line.trim();
    if (!normalizedLine || isLrcMetadataLine(normalizedLine)) {
      continue;
    }

    const matches = [...normalizedLine.matchAll(LRC_TIMESTAMP_PATTERN)];
    const text = normalizedLine.replace(LRC_TIMESTAMP_TEXT_PATTERN, '').trim();
    if (!text || isLrcMetadataLine(text)) {
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

  return mergeTimedLyricLines(parsedLines);
}

function getDraftDuration(track: MusicTrack | null, index: number): number {
  if (track?.duration && track.duration > 0) {
    return track.duration;
  }

  return 192 + (index % 4) * 18;
}
