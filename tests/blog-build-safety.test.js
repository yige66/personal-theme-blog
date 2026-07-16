import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

const dynamicContentRoutes = [
  'app/chatter/[slug]/page.tsx',
  'app/posts/[slug]/page.tsx',
  'app/tags/[tag]/page.tsx'
];

describe('dynamic content build safety', () => {
  it('does not discover Blob-backed route params during the production build', async () => {
    const sources = await Promise.all(dynamicContentRoutes.map((file) => readFile(file, 'utf8')));

    for (const source of sources) {
      assert.doesNotMatch(source, /generateStaticParams/);
    }
  });

  it('keeps data-backed metadata routes dynamic', async () => {
    const [layout, manifest, sitemap] = await Promise.all([
      readFile('app/layout.tsx', 'utf8'),
      readFile('app/manifest.ts', 'utf8'),
      readFile('app/sitemap.ts', 'utf8')
    ]);

    assert.match(layout, /export const dynamic = 'force-dynamic'/);
    assert.match(manifest, /export const dynamic = 'force-dynamic'/);
    assert.match(sitemap, /export const dynamic = 'force-dynamic'/);
  });
});
