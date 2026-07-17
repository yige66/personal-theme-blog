import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, it } from 'node:test';
import typescript from 'typescript';

async function loadMusicLyrics() {
  const sourcePath = resolve('lib/music-lyrics.ts');
  let source;

  try {
    source = await readFile(sourcePath, 'utf8');
  } catch {
    assert.fail('expected the shared music lyric utility to exist');
  }

  const output = typescript.transpileModule(source, {
    compilerOptions: {
      module: typescript.ModuleKind.NodeNext,
      moduleResolution: typescript.ModuleResolutionKind.NodeNext,
      target: typescript.ScriptTarget.ES2022
    },
    fileName: sourcePath
  }).outputText;
  const directory = await mkdtemp(join(tmpdir(), 'personal-theme-blog-music-lyrics-'));
  const modulePath = join(directory, 'music-lyrics.js');
  await writeFile(modulePath, output, 'utf8');

  return {
    cleanup: () => rm(directory, { recursive: true, force: true }),
    module: await import(`${pathToFileURL(modulePath).href}?cacheBust=${Date.now()}`)
  };
}

describe('music lyric merging', () => {
  it('matches translation timestamps with equivalent millisecond precision', async () => {
    const { cleanup, module } = await loadMusicLyrics();

    try {
      const merged = module.mergeTranslatedLyrics(
        '[00:01.45]original lyric',
        '[00:01.450]translated lyric'
      );

      assert.deepEqual(merged, {
        lrc: '[00:01.45]original lyric\n[00:01.45]translated lyric',
        hasTranslation: true
      });
    } finally {
      await cleanup();
    }
  });

  it('does not report translations when none can be merged into the original lyrics', async () => {
    const { cleanup, module } = await loadMusicLyrics();

    try {
      assert.deepEqual(
        module.mergeTranslatedLyrics('[00:01.45]original lyric', '[00:02.00]unmatched translation'),
        {
          lrc: '[00:01.45]original lyric',
          hasTranslation: false
        }
      );
    } finally {
      await cleanup();
    }
  });

  it('sorts timed lyrics, applies LRC offsets, and merges lines at the same time', async () => {
    const { cleanup, module } = await loadMusicLyrics();

    try {
      assert.deepEqual(
        module.parseTimedLyrics(
          '[ti:demo]\n[offset:500]\n[00:02.00]later\n[00:01.5]first\n[00:01.500]translated'
        ),
        [
          { time: 2, text: 'first\ntranslated' },
          { time: 2.5, text: 'later' }
        ]
      );
    } finally {
      await cleanup();
    }
  });

  it('uses stable synthetic spacing only when a lyric block has no timestamps', async () => {
    const { cleanup, module } = await loadMusicLyrics();

    try {
      assert.deepEqual(module.parseTimedLyrics('first\nsecond'), [
        { time: 0, text: 'first' },
        { time: 18, text: 'second' }
      ]);
    } finally {
      await cleanup();
    }
  });
});
