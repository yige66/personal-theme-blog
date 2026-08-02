import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

describe('remote music cover rendering', () => {
  it('bypasses the Next image optimizer for remote covers', async () => {
    const [homeEffects, sectionBlocks, cloudCard] = await Promise.all([
      readFile('components/HomeEffects.tsx', 'utf8'),
      readFile('components/SectionBlocks.tsx', 'utf8'),
      readFile('components/music/CloudPlayerCard.tsx', 'utf8')
    ]);

    assert.match(homeEffects, /isRemoteFloatingCover/);
    assert.match(homeEffects, /unoptimized=\{isRemoteFloatingCover\}/);
    assert.match(sectionBlocks, /const isRemoteCover/);
    assert.match(sectionBlocks, /unoptimized=\{isRemoteCover\}/);
    assert.match(cloudCard, /const isRemoteCover/);
    assert.match(cloudCard, /unoptimized=\{isRemoteCover\}/);
  });
});
