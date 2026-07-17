import assert from 'node:assert/strict';
import { access, open, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { describe, it } from 'node:test';

async function readBlogData() {
  return JSON.parse(await readFile('data/blog.json', 'utf8'));
}

function publicPathFromUrl(url) {
  assert.match(url, /^\/assets\/audio\/[\w.-]+\.(?:aac|flac|m4a|mp3|mp4|oga|ogg|opus|wav|webm)$/i);
  return path.join('public', url);
}

function getRawLyrics(track) {
  const lyrics = track.lrc ?? (typeof track.lyrics === 'string' ? track.lyrics : '');

  if (Array.isArray(lyrics)) {
    return lyrics.map((line) => typeof line === 'string' ? line : line.text).join('\n');
  }

  return lyrics;
}

function getPlainLyrics(track) {
  return typeof track.lyric === 'string' ? track.lyric : '';
}

function hasKana(text) {
  return /[\u3040-\u30ff]/.test(text);
}

function hasHan(text) {
  return /[\u3400-\u9fff]/.test(text);
}

function countTranslatedTimestampGroups(lrc) {
  const groups = new Map();
  const timestampPattern = /\[(\d{2,}:\d{2}(?:[.:]\d{2,3})?)\]/g;
  const placeholderLinePattern = /(?:\u4e2d\u6587\u8bd1\u6587|\u5f85\u7ffb\u8bd1|translation pending|placeholder)/i;

  for (const line of String(lrc || '').split(/\r?\n/)) {
    const matches = [...line.matchAll(timestampPattern)];
    const text = line.replace(timestampPattern, '').trim();
    for (const match of matches) {
      const lines = groups.get(match[1]) ?? [];
      lines.push(text);
      groups.set(match[1], lines);
    }
  }

  return [...groups.values()].filter((lines) => {
    const hasOriginalLine = lines.some((line) => hasKana(line) || /[A-Za-z]/.test(line));
    const hasTranslationLine = lines.some((line) => hasHan(line) && !hasKana(line) && !placeholderLinePattern.test(line));
    return lines.length > 1 && hasOriginalLine && hasTranslationLine;
  }).length;
}

function countMissingTranslatedTimestampGroups(lrc) {
  const groups = new Map();
  const timestampPattern = /\[(\d{2,}:\d{2}(?:[.:]\d{2,3})?)\]/g;
  const creditLinePattern = /^(?:\u4f5c\u8bcd|\u4f5c\u66f2|\u7f16\u66f2|\u5236\u4f5c\u4eba|\u8bcd|\u66f2)\s*[:\uff1a]/;
  const placeholderLinePattern = /(?:\u4e2d\u6587\u8bd1\u6587|\u5f85\u7ffb\u8bd1|translation pending|placeholder)/i;

  for (const line of String(lrc || '').split(/\r?\n/)) {
    const matches = [...line.matchAll(timestampPattern)];
    const text = line.replace(timestampPattern, '').trim();
    if (!text || creditLinePattern.test(text)) continue;
    for (const match of matches) {
      const lines = groups.get(match[1]) ?? [];
      lines.push(text);
      groups.set(match[1], lines);
    }
  }

  return [...groups.values()].filter((lines) => {
    const hasOriginalLine = lines.some((line) => hasKana(line) || /[A-Za-z]/.test(line));
    const hasTranslationLine = lines.some((line) => hasHan(line) && !hasKana(line) && !placeholderLinePattern.test(line));
    return hasOriginalLine && !hasTranslationLine;
  }).length;
}

async function readFileHeader(filePath, byteLength) {
  const file = await open(filePath, 'r');
  try {
    const buffer = Buffer.alloc(byteLength);
    await file.read(buffer, 0, byteLength, 0);
    return buffer;
  } finally {
    await file.close();
  }
}

describe('real music playback', () => {
  it('preloads requested song metadata while leaving audio URLs ready for later uploads', async () => {
    const data = await readBlogData();
    const trackNames = data.site.music.map((track) => `${track.title} - ${track.artist}`);
    const tracksById = new Map(data.site.music.map((track) => [track.id, track]));
    const requestedTracks = [
      ['requested-senya-ichiya', '千夜一夜', 'Hilcrhyme / 仲宗根泉'],
      ['requested-brave-song', 'Brave Song', 'VISUAL ARTS / Key Sounds Label / 多田葵'],
      ['requested-contrast', 'コントラスト', 'TOMOO'],
      ['requested-song-for-you', 'song for you', '神田沙也加'],
      ['requested-one-last-kiss', 'One Last Kiss', '宇多田ヒカル'],
      ['requested-more-than-words', 'more than words', '羊文学'],
      ['requested-amanojaku', '天ノ弱 (うぃんぐPiano Ver.)', 'Akie秋绘'],
      ['requested-tori-no-uta', '鳥の詩', 'Lia & VISUAL ARTS / Key'],
      ['requested-kotozute', '言伝', 'Bialystocks'],
      ['requested-shiki-no-uta', '四季ノ唄', 'MINMI'],
      ['requested-hare-no-hi-ni', 'ハレの日に', '汐れいら'],
      ['requested-behind', 'behind', '夏目美緒(CV:礒部花凜)・森川葉月(CV:芳野由奈)・小宮恵那(CV:Lynn)'],
      ['requested-eureka', 'ユリイカ', 'ロクデナシ'],
      ['requested-mild-days', 'mild days', '羊文学'],
      ['requested-call-you', '失恋ソング沢山聴いて 泣いてばかりの私はもう。 (acoustic ver.)', 'りりあ。'],
      ['requested-spiral', 'spiral', 'LONGMAN'],
      ['requested-zenzenzense', '前前前世 (Movie ver.)', 'RADWIMPS'],
      ['requested-nandemonaiya', 'なんでもないや (Movie edit.)', 'RADWIMPS'],
      ['requested-sparkle', 'スパークル (Movie ver.)', 'RADWIMPS'],
      ['requested-yumetourou', '夢灯籠', 'RADWIMPS'],
      ['requested-preromance', 'プレロマンス', 'eill'],
      ['requested-finale', 'フィナーレ。', 'eill'],
      ['requested-san-francisco', 'san francisco', 'MIDICRONICA'],
      ['requested-hebi', 'へび', 'ヨルシカ']
    ];

    const importedTrackIds = new Set([
      'requested-senya-ichiya',
      'requested-brave-song',
      'requested-contrast',
      'requested-song-for-you',
      'requested-one-last-kiss',
      'requested-more-than-words',
      'requested-amanojaku',
      'requested-tori-no-uta',
      'requested-kotozute',
      'requested-shiki-no-uta',
      'requested-hare-no-hi-ni',
      'requested-behind',
      'requested-eureka',
      'requested-mild-days',
      'requested-call-you',
      'requested-spiral',
      'requested-zenzenzense',
      'requested-nandemonaiya',
      'requested-sparkle',
      'requested-yumetourou',
      'requested-preromance',
      'requested-finale',
      'requested-san-francisco',
      'requested-hebi'
    ]);

    const protectedDownloadTrackIds = new Set();

    assert.deepEqual(data.site.cloudMusicIds, [], 'cloud music ids should stay empty when the requested song is managed as a local admin track');
    assert.ok(!trackNames.some((name) => /孤勇者|STAY|我记得|The Kid LAROI|Justin Bieber|陈奕迅|赵雷/.test(name)), 'old remote placeholder songs should not be part of the configured playlist');

    for (const [id, title, artist] of requestedTracks) {
      const track = tracksById.get(id);
      assert.ok(track, `expected ${id} to be present in the music list`);
      assert.equal(track.title, title);
      assert.equal(track.artist, artist);
      if (importedTrackIds.has(id)) {
        assert.match(track.url, /^\/assets\/audio\/[\w.-]+\.(?:flac|m4a|mp3|mp4)$/);
      } else {
        assert.equal(track.url, '');
      }
      assert.equal(track.source, 'specified-pending');
      assert.equal(track.provider, 'manual');
      assert.match(track.cover, /^(https:\/\/|\/assets\/)/);
      if (track.cover.startsWith('/assets/')) {
        await access(path.join('public', track.cover));
      }
      assert.equal(track.note, undefined);
      assert.doesNotMatch(track.url, /\.mflac$/i);
      assert.ok(typeof track.lrc === 'string' && track.lrc.length > 0, `${id} should store timed lyrics in the LRC field`);

      const rawLyrics = getRawLyrics(track);
      assert.match(rawLyrics, /\[\d{2,}:\d{2}(?:[.:]\d{2,3})?\]/, `${id} should include LRC-style lyrics`);
      assert.doesNotMatch(rawLyrics, /歌词待补|等待导入对应 LRC|歌词占位/, `${id} should use imported lyrics, not placeholders`);
      assert.doesNotMatch(rawLyrics, /\uFFFD/, `${id} should not contain replacement characters from a wrong lyric encoding`);
      assert.ok(rawLyrics.split(/\r?\n/).filter((line) => /\[\d{2,}:\d{2}(?:[.:]\d{2,3})?\]/.test(line)).length >= 5, `${id} should include a complete timed lyric`);
      assert.ok(countTranslatedTimestampGroups(rawLyrics) >= 5, `${id} should include translated lyric lines aligned to timestamps`);
      assert.equal(countMissingTranslatedTimestampGroups(rawLyrics), 0, `${id} should not leave untranslated lyric timestamp groups`);

      const plainLyrics = getPlainLyrics(track);
      assert.ok(plainLyrics.length > 0, `${id} should also keep plain lyrics for the admin plain-text field`);
      assert.doesNotMatch(plainLyrics, /\[\d{2,}:\d{2}(?:[.:]\d{2,3})?\]/, `${id} should not put timed LRC lines in the plain lyrics field`);
      assert.doesNotMatch(plainLyrics, /^\[(?:ti|ar|al|by|offset|kana):/im, `${id} should not put LRC metadata in the plain lyrics field`);
      assert.doesNotMatch(plainLyrics, /\uFFFD/, `${id} plain lyrics should not contain replacement characters`);

      if (protectedDownloadTrackIds.has(id)) {
        assert.match(track.note, /VIP|mflac|专属/);
      }
    }
  });

  it('ships playable local music assets for the built-in playlist', async () => {
    const data = await readBlogData();
    const playableTracks = data.site.music.filter((track) => track.url);

    assert.ok(playableTracks.length >= 3, 'expected at least three built-in playable tracks');

    for (const track of playableTracks) {
      const assetPath = publicPathFromUrl(track.url);
      await access(assetPath);
      const assetStats = await stat(assetPath);

      assert.match(track.url, /\.m4a$/i, 'production audio must avoid Git LFS pointer formats');
      assert.ok(assetStats.size > 100 * 1024, `${track.id} must be a real audio file, not a Git LFS pointer`);

      if (track.url.endsWith('.wav')) {
        const header = await readFileHeader(assetPath, 12);
        assert.equal(header.subarray(0, 4).toString('ascii'), 'RIFF');
        assert.equal(header.subarray(8, 12).toString('ascii'), 'WAVE');
      }

      if (track.url.endsWith('.flac')) {
        const header = await readFileHeader(assetPath, 4);
        assert.equal(header.subarray(0, 4).toString('ascii'), 'fLaC');
      }

      if (track.url.endsWith('.mp3')) {
        const header = await readFileHeader(assetPath, 3);
        assert.equal(header.subarray(0, 3).toString('ascii'), 'ID3');
      }

      if (track.url.endsWith('.m4a')) {
        const header = await readFileHeader(assetPath, 12);
        assert.equal(header.subarray(4, 8).toString('ascii'), 'ftyp');
      }
    }
  });

  it('restarts real audio playback when the playing playlist advances to another track', async () => {
    const provider = await readFile('components/music/MusicProvider.tsx', 'utf8');
    const playbackEffectMatch = provider.match(/useEffect\(\(\) => \{[\s\S]*?audio\.play\(\)\.catch\(handleAudioPlaybackFailure\);[\s\S]*?\}, \[([^\]]+)\]\);/);

    assert.ok(playbackEffectMatch, 'expected the real audio playback effect to be present');
    assert.match(
      playbackEffectMatch[1],
      /currentTrackKey/,
      'the playback effect must rerun when the current track changes while isPlaying stays true'
    );
  });

  it('starts playback directly from the user gesture instead of a deferred state updater', async () => {
    const provider = await readFile('components/music/MusicProvider.tsx', 'utf8');
    const toggleMatch = provider.match(/const togglePlaying = useCallback\(\(\) => \{([\s\S]*?)\n  \}, \[canUseAudio, handleAudioPlaybackFailure, isPlaying, playlist\.length\]\);/);

    assert.ok(toggleMatch, 'expected togglePlaying to keep audio.play in the click handler');
    assert.doesNotMatch(toggleMatch[1], /setIsPlaying\(\(playing\) =>/);
    assert.match(toggleMatch[1], /const audio = audioRef\.current/);
    assert.match(toggleMatch[1], /playAttemptRef\.current = playAttempt/);
    assert.match(toggleMatch[1], /setIsPlaying\(true\);\s*audio\.play\(\)/);
    assert.match(toggleMatch[1], /playAttemptRef\.current === playAttempt/);
    assert.doesNotMatch(toggleMatch[1], /\.then\(/);
  });

  it('loops list playback from the last track back to the first track', async () => {
    const provider = await readFile('components/music/MusicProvider.tsx', 'utf8');
    const nextTrackMatch = provider.match(/const nextTrack = useCallback\(\(\) => \{([\s\S]*?)\}, \[currentIndex, playMode, playlist\.length, selectTrack\]\);/);

    assert.ok(nextTrackMatch, 'expected nextTrack to keep its current dependency shape');
    assert.doesNotMatch(
      nextTrackMatch[1],
      /playMode === 'list' && currentIndex === playlist\.length - 1[\s\S]*?setIsPlaying\(false\)/,
      'list playback should not stop at the final track'
    );
    assert.match(
      nextTrackMatch[1],
      /selectTrack\(currentIndex \+ 1\);/,
      'the final track should reuse selectTrack modulo wrapping to continue from the first track'
    );
  });

  it('lets visitors choose local audio files and adds them to the selectable playlist', async () => {
    const [provider, studio, cloudCard, lyricStrip, globals, homeOverrides] = await Promise.all([
      readFile('components/music/MusicProvider.tsx', 'utf8'),
      readFile('components/MusicStudio.tsx', 'utf8'),
      readFile('components/music/CloudPlayerCard.tsx', 'utf8'),
      readFile('components/music/LyricStrip.tsx', 'utf8'),
      readFile('app/globals.css', 'utf8'),
      readFile('app/home-overrides.css', 'utf8')
    ]);

    assert.match(provider, /localFileTracks/);
    assert.match(provider, /addLocalAudioFiles/);
    assert.match(provider, /URL\.createObjectURL/);
    assert.match(provider, /URL\.revokeObjectURL/);
    assert.match(provider, /NotAllowedError/);
    assert.match(provider, /audioRef\.current\?\.pause\(\)/);
    assert.match(provider, /重新导入标准 MP3\/M4A\/WAV\/FLAC 文件/);
    assert.doesNotMatch(provider, /fallbackTrackKeys/);
    assert.doesNotMatch(provider, /降级状态/);
    assert.match(provider, /点击播放按钮/);
    assert.match(provider, /import \{ mergeTimedLyricLines, parseTimedLyrics, type TimedLyricLine \} from '@\/lib\/music-lyrics'/);
    assert.doesNotMatch(provider, /function isLrcMetadataLine/);
    assert.match(provider, /isLyricPrelude/);
    assert.match(provider, /mergeTimedLyricLines/);
    assert.match(provider, /parseTimedLyrics/);
    assert.match(lyricStrip, /data-prelude/);
    assert.match(globals, /white-space:\s*pre-line/);
    assert.match(homeOverrides, /xh-music-bright-subtitles/);
    assert.match(homeOverrides, /data-prelude="true"/);
    assert.match(homeOverrides, /#fff7bf/);
    assert.match(homeOverrides, /#7ff7ff/);
    assert.match(homeOverrides, /xh-music-lyric-strip-integrated/);
    assert.match(homeOverrides, /background-image:\s*none/);
    assert.match(homeOverrides, /xh-music-card-lyric-subtitle/);
    assert.match(homeOverrides, /xh-home-cloud-lyric-subtitle/);
    assert.match(studio, /currentLyric/);
    assert.match(studio, /music-player-subtitle/);
    assert.match(studio, /data-lyric-subtitle="true"/);
    assert.match(cloudCard, /currentLyric/);
    assert.match(cloudCard, /xh-cloud-lyric-subtitle/);
    assert.match(cloudCard, /data-lyric-subtitle="true"/);
    assert.doesNotMatch(cloudCard, /和音乐电台同步，写作、阅读和编码时都能接着听。/);
    assert.match(studio, /type="file"/);
    assert.match(studio, /accept="audio\/\*"/);
    assert.match(studio, /addLocalAudioFiles/);
    assert.match(studio, /music-playback-alert/);
    assert.match(cloudCard, /loadError \|\| formatSyncState/);
  });
});
