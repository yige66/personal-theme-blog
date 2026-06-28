import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

const curatedFiles = [
  'app/page.tsx',
  'app/about/page.tsx',
  'app/archive/page.tsx',
  'app/console/page.tsx',
  'app/gallery/page.tsx',
  'app/links/page.tsx',
  'app/moments/page.tsx',
  'app/music/page.tsx',
  'app/posts/[slug]/page.tsx',
  'app/projects/page.tsx',
  'app/tags/page.tsx',
  'app/tags/[tag]/page.tsx',
  'components/HomeEffects.tsx',
  'components/SectionBlocks.tsx',
  'components/SiteNav.tsx',
  'data/blog.json',
  'lib/seo.ts'
];

describe('source text quality', () => {
  it('does not ship mojibake in curated Chinese UI and content files', async () => {
    const mojibake = /[绔鐨鍥鍦鏄鏂鏍闊鍙鎼寮瑰褰浠鎵]{2,}|�/;

    for (const file of curatedFiles) {
      const source = await readFile(file, 'utf8');
      assert.doesNotMatch(source, mojibake, file);
    }
  });
});
