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

  it('keeps non-visible background images and navigation routes out of the initial request burst', async () => {
    const [background, navigation, home, latestPosts, player, toolbox] = await Promise.all([
      readFile('components/BackgroundSlider.tsx', 'utf8'),
      readFile('components/SiteNav.tsx', 'utf8'),
      readFile('components/HomeWorld.tsx', 'utf8'),
      readFile('components/LatestPostCarousel.tsx', 'utf8'),
      readFile('components/music/CloudPlayerCard.tsx', 'utf8'),
      readFile('components/GlobalToolbox.tsx', 'utf8')
    ]);

    assert.match(background, /const shouldLoad = index === activeIndex \|\| isExiting/);
    assert.match(background, /style=\{shouldLoad \?/);
    assert.match(navigation, /prefetch=\{false\}/);
    assert.match(home, /href="\/about" prefetch=\{false\}/);
    assert.match(latestPosts, /href="\/archive" prefetch=\{false\}/);
    assert.match(player, /currentTrack\?\.cover\?\.startsWith\('\/'\)/);
    assert.match(player, /href="\/music" prefetch=\{false\}/);
    assert.match(toolbox, /prefetch=\{false\}/);
  });

  it('turns third-party comment request errors into a neutral retry state', async () => {
    const comments = await readFile('components/comments/GitHubComments.tsx', 'utf8');

    assert.match(comments, /GITALK_REMOTE_ERROR_PATTERN/);
    assert.match(comments, /MutationObserver/);
    assert.match(comments, /评论暂时无法加载/);
    assert.match(comments, /重新加载评论/);
    assert.match(comments, /container\.replaceChildren\(\)/);
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
