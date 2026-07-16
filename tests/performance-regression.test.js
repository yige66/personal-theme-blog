import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

describe('production interaction performance guards', () => {
  it('keeps the interactive water canvas while bounding its rendering cost', async () => {
    const splash = await readFile('components/SplashScreen.tsx', 'utf8');
    const splashEffects = await readFile('components/splashEffects.ts', 'utf8');

    assert.match(splash, /startRainRipple/);
    assert.match(splash, /setVisible\(false\);[\s\S]*dispatchEvent/);
    assert.match(splashEffects, /const waterFrameIntervalMs = 1000 \/ 30/);
    assert.match(splashEffects, /Math\.min\(520/);
  });

  it('defers home effects until the splash is gone and leaves the ripple canvas idle without ripples', async () => {
    const effects = await readFile('components/HomeEffects.tsx', 'utf8');

    assert.match(effects, /function ActiveHomeEffects/);
    assert.match(effects, /personal-theme-blog:splash-complete/);
    assert.match(effects, /if \(ripples\.length === 0\)/);
    assert.doesNotMatch(effects, /resize\(\);\s*draw\(\);/);
  });

  it('deduplicates private Blob reads inside one server render', async () => {
    const blog = await readFile('lib/blog.ts', 'utf8');

    assert.match(blog, /import \{ cache \} from 'react'/);
    assert.match(blog, /export const getBlogData = cache\(/);
  });

  it('falls back to repository data when private Blob reads fail', async () => {
    const blog = await readFile('lib/blog.ts', 'utf8');

    assert.match(blog, /if \(isBlobStorageConfigured\(\)\) \{\s*try \{\s*const remoteRaw = await readBlogDataBlob\(\)/s);
    assert.match(blog, /Blog data Blob read failed; falling back to repository data/);
  });
});
