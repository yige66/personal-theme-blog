const LRC_TIMESTAMP_PATTERN = /\[(\d{2,}:\d{2}(?:[.:]\d{2,3})?)\]/g;
const LRC_METADATA_PATTERN = /^\[(?:ti|ar|al|au|by|offset|re|ve|length|tool|kana|language|trans|translation|roma|romanization):[^\]]*\]$/i;

export type MergedLyrics = {
  lrc: string;
  hasTranslation: boolean;
};

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
