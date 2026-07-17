const LRC_TIMESTAMP_PATTERN = /\[(\d{2,}):(\d{2})(?:[.:](\d{1,3}))?\]/g;
const LRC_TIMESTAMP_TEXT_PATTERN = /\[\d{2,}:\d{2}(?:[.:]\d{1,3})?\]/g;
const LRC_METADATA_PATTERN = /^\[(?:ti|ar|al|au|by|offset|re|ve|length|tool|kana|language|trans|translation|roma|romanization):[^\]]*\]$/i;
const LRC_OFFSET_PATTERN = /^\[offset:\s*([+-]?\d+(?:\.\d+)?)\]$/i;

export type TimedLyricLine = {
  time: number;
  text: string;
};

export type MergedLyrics = {
  lrc: string;
  hasTranslation: boolean;
};

export function mergeTimedLyricLines(lines: TimedLyricLine[]): TimedLyricLine[] {
  const grouped = new Map<number, string[]>();

  for (const line of [...lines]
    .filter((candidate) => Number.isFinite(candidate.time) && candidate.text.trim().length > 0)
    .sort((a, b) => a.time - b.time)) {
    const texts = grouped.get(line.time) ?? [];
    const text = line.text.trim();
    if (!texts.includes(text)) {
      texts.push(text);
    }
    grouped.set(line.time, texts);
  }

  return [...grouped.entries()].map(([time, texts]) => ({
    time,
    text: texts.join('\n')
  }));
}

export function parseTimedLyrics(rawLyrics: string): TimedLyricLine[] {
  const timedLines: TimedLyricLine[] = [];
  const plainLines: string[] = [];
  let offsetMilliseconds = 0;

  for (const rawLine of rawLyrics.split(/\r?\n/)) {
    const normalizedLine = rawLine.trim().replace(/^\uFEFF/, '');
    const offsetMatch = normalizedLine.match(LRC_OFFSET_PATTERN);
    if (offsetMatch) {
      const nextOffset = Number(offsetMatch[1]);
      if (Number.isFinite(nextOffset)) {
        offsetMilliseconds = nextOffset;
      }
      continue;
    }

    if (!normalizedLine || isLrcMetadataLine(normalizedLine)) {
      continue;
    }

    const matches = [...normalizedLine.matchAll(LRC_TIMESTAMP_PATTERN)];
    const text = normalizedLine.replace(LRC_TIMESTAMP_TEXT_PATTERN, '').trim();
    if (!text || isLrcMetadataLine(text)) {
      continue;
    }

    if (matches.length === 0) {
      plainLines.push(text);
      continue;
    }

    for (const match of matches) {
      const minutes = Number.parseInt(match[1], 10);
      const seconds = Number.parseInt(match[2], 10);
      if (!Number.isFinite(minutes) || !Number.isFinite(seconds) || seconds >= 60) {
        continue;
      }

      const fraction = match[3]
        ? Number.parseInt(match[3], 10) / (10 ** match[3].length)
        : 0;
      timedLines.push({
        time: Math.max(0, minutes * 60 + seconds + fraction + offsetMilliseconds / 1000),
        text
      });
    }
  }

  // Synthetic spacing is only safe for a plain lyric block. Mixed LRC files must
  // keep their explicit timestamps instead of assigning unrelated lines fake times.
  if (timedLines.length === 0) {
    return mergeTimedLyricLines(plainLines.map((text, index) => ({ time: index * 18, text })));
  }

  return mergeTimedLyricLines(timedLines);
}

export function mergeTranslatedLyrics(lrc: string, translatedLrc: string): MergedLyrics {
  const originalLines = lrc.split(/\r?\n/);
  const translations = collectTranslationLines(translatedLrc);

  if (translations.size === 0) {
    return { lrc, hasTranslation: false };
  }

  if (!lrc.trim()) {
    return { lrc: translatedLrc, hasTranslation: true };
  }

  const mergedLines: string[] = [];
  let hasTranslation = false;
  for (const line of originalLines) {
    mergedLines.push(line);

    if (isLrcMetadataLine(line)) {
      continue;
    }

    const timestamps = [...line.matchAll(LRC_TIMESTAMP_PATTERN)].map((match) => match[0]);
    const emitted = new Set<string>();
    for (const timestamp of timestamps) {
      for (const text of translations.get(normalizeLrcTimestamp(timestamp)) ?? []) {
        const key = `${timestamp}:${text}`;
        if (!emitted.has(key)) {
          emitted.add(key);
          mergedLines.push(`${timestamp}${text}`);
          hasTranslation = true;
        }
      }
    }
  }

  return { lrc: mergedLines.join('\n').trim(), hasTranslation };
}

function collectTranslationLines(translatedLrc: string): Map<string, string[]> {
  const translations = new Map<string, string[]>();

  for (const line of translatedLrc.split(/\r?\n/)) {
    const normalizedLine = line.trim();
    if (!normalizedLine || isLrcMetadataLine(normalizedLine)) {
      continue;
    }

    const timestamps = [...normalizedLine.matchAll(LRC_TIMESTAMP_PATTERN)].map((match) => match[0]);
    const text = normalizedLine.replace(LRC_TIMESTAMP_PATTERN, '').trim();
    if (!text) {
      continue;
    }

    for (const timestamp of timestamps) {
      const key = normalizeLrcTimestamp(timestamp);
      const lines = translations.get(key) ?? [];
      if (!lines.includes(text)) {
        lines.push(text);
      }
      translations.set(key, lines);
    }
  }

  return translations;
}

function normalizeLrcTimestamp(timestamp: string): string {
  const value = timestamp.slice(1, -1);
  const [minutes, secondsAndMilliseconds] = value.split(':');
  const [seconds, milliseconds = '0'] = secondsAndMilliseconds.split(/[.:]/);
  const normalizedMilliseconds = milliseconds.padEnd(3, '0').slice(0, 3);

  return `${Number(minutes)}:${seconds.padStart(2, '0')}.${normalizedMilliseconds}`;
}

export function isLrcMetadataLine(line: string): boolean {
  return LRC_METADATA_PATTERN.test(line.trim());
}
