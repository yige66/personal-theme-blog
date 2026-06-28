import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

describe('subpage experience surfaces', () => {
  it('adds insight bars and empty states to content index pages', async () => {
    const pages = [
      'app/archive/page.tsx',
      'app/projects/page.tsx',
      'app/gallery/page.tsx',
      'app/moments/page.tsx',
      'app/music/page.tsx',
      'app/links/page.tsx',
      'app/tags/page.tsx'
    ];

    const sources = await Promise.all(pages.map((page) => readFile(page, 'utf8')));
    for (const source of sources) {
      assert.match(source, /PageInsightBar/);
      assert.match(source, /EmptyState/);
    }
  });

  it('keeps tag detail pages connected to the insight pattern', async () => {
    const tagPage = await readFile('app/tags/[tag]/page.tsx', 'utf8');
    assert.match(tagPage, /PageInsightBar/);
    assert.match(tagPage, /全部标签/);
  });

  it('defines responsive target-site inspired subpage styles', async () => {
    const css = await readFile('app/globals.css', 'utf8');
    assert.match(css, /\.page-insight-bar/);
    assert.match(css, /\.page-insight-items/);
    assert.match(css, /\.rich-empty/);
    assert.match(css, /\.gallery-masonry/);
    assert.match(css, /\.moment-waterfall/);
    assert.match(css, /\.radio-hero-card/);
    assert.match(css, /\.article-sidebar/);
  });
});
