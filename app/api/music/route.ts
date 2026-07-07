import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type NeteaseSongDetail = {
  id: number;
  name: string;
  ar?: Array<{ name?: string }>;
  artists?: Array<{ name?: string }>;
  al?: {
    name?: string;
    picUrl?: string;
    blurPicUrl?: string;
  };
  album?: {
    name?: string;
    picUrl?: string;
    blurPicUrl?: string;
  };
  dt?: number;
  duration?: number;
};

type NeteaseDetailResponse = {
  songs?: NeteaseSongDetail[];
};

type NeteaseLyricResponse = {
  lrc?: {
    lyric?: string;
  };
};

type CloudMusicTrack = {
  id: string;
  title: string;
  artist: string;
  mood: string;
  url: string;
  cover: string;
  source: string;
  provider: 'netease';
  duration?: number;
  lrc?: string;
  note?: string;
};

const MAX_IDS = 20;
const DETAIL_ENDPOINT = 'https://music.163.com/api/song/detail';
const LYRIC_ENDPOINT = 'https://music.163.com/api/song/lyric';
const MEDIA_ENDPOINT = 'https://music.163.com/song/media/outer/url';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const ids = normalizeIds(url.searchParams.get('ids'));

  if (ids.length === 0) {
    return NextResponse.json({ error: 'Provide one or more numeric music ids.' }, { status: 400 });
  }

  try {
    const detailUrl = `${DETAIL_ENDPOINT}?ids=[${ids.join(',')}]`;
    const detail = await fetchJson<NeteaseDetailResponse>(detailUrl);
    const songs = Array.isArray(detail.songs) ? detail.songs : [];
    const lyrics = await Promise.all(songs.map((song) => fetchLyric(String(song.id))));
    const tracks = songs
      .map((song, index) => mapSongToTrack(song, lyrics[index]))
      .filter((track): track is CloudMusicTrack => Boolean(track));

    return NextResponse.json({ tracks, source: 'netease', count: tracks.length });
  } catch {
    return NextResponse.json({ error: 'Cloud music service is temporarily unavailable.' }, { status: 502 });
  }
}

function normalizeIds(value: string | null): string[] {
  if (!value) {
    return [];
  }

  const uniqueIds = new Set<string>();
  for (const item of value.split(',')) {
    const id = item.trim();
    if (/^\d{1,20}$/.test(id)) {
      uniqueIds.add(id);
    }
  }

  return [...uniqueIds].slice(0, MAX_IDS);
}

async function fetchLyric(id: string): Promise<string> {
  try {
    const lyric = await fetchJson<NeteaseLyricResponse>(`${LYRIC_ENDPOINT}?id=${id}&lv=1&kv=1&tv=-1`);
    return lyric.lrc?.lyric || '';
  } catch {
    return '';
  }
}

async function fetchJson<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Referer: 'https://music.163.com/',
        'User-Agent': 'Mozilla/5.0 personal-theme-blog'
      },
      next: { revalidate: 3600 }
    });

    if (!response.ok) {
      throw new Error('Music upstream failed');
    }

    return await response.json() as T;
  } finally {
    clearTimeout(timeout);
  }
}

function mapSongToTrack(song: NeteaseSongDetail, lrc: string): CloudMusicTrack | null {
  if (!song.id || !song.name) {
    return null;
  }

  const artists = [...(song.ar ?? []), ...(song.artists ?? [])].map((artist) => artist.name).filter(Boolean).join(' / ') || 'Netease Cloud Music';
  const album = song.al ?? song.album;
  const cover = album?.picUrl || album?.blurPicUrl || '/assets/img/hero-mountain.svg';
  const durationMs = song.dt ?? song.duration;
  const duration = durationMs ? Math.round(durationMs / 1000) : undefined;

  return {
    id: String(song.id),
    title: song.name,
    artist: artists,
    mood: album?.name || '夜航电台',
    url: `${MEDIA_ENDPOINT}?id=${song.id}.mp3`,
    cover,
    source: 'netease-cloud',
    provider: 'netease',
    duration,
    lrc,
    note: lrc ? '来自网易云音乐的歌词与播放源。' : '来自网易云音乐的播放源。'
  };
}
