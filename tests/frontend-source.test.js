import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

describe('target-inspired homepage portal', () => {
  it('keeps the homepage as a first-screen portal instead of a long content wall', async () => {
    const [page, nav, css] = await Promise.all([
      readFile('app/page.tsx', 'utf8'),
      readFile('components/SiteNav.tsx', 'utf8'),
      readFile('app/globals.css', 'utf8')
    ]);

    assert.match(page, /xh-scene-shell/);
    assert.match(page, /xh-search-orbit/);
    assert.match(page, /xh-profile-panel/);
    assert.match(page, /xh-music-panel/);
    assert.match(page, /xh-feature-board/);
    assert.match(page, /xh-runtime-dock/);
    assert.doesNotMatch(page, /ExperienceShowcase/);
    assert.doesNotMatch(page, /ArticleExplorer/);
    assert.doesNotMatch(page, /post-teasers/);
    assert.doesNotMatch(page, /projects-section/);
    assert.doesNotMatch(page, /gallery-section/);
    assert.doesNotMatch(page, /links-section/);
    assert.match(page, /data\.site\.owner \|\| data\.site\.title/);
    assert.match(page, /data\.site\.avatar/);
    assert.match(page, /data\.site\.bio \|\| data\.site\.motto/);
    assert.match(page, /搜寻标题、标签、照片或灵感碎片/);
    assert.match(page, /xh-profile-identity/);
    assert.match(page, /Latest Insight/);
    assert.match(page, /Cloud Music/);
    assert.match(page, /GitHub \/ Vercel/);
    assert.match(nav, /照片墙/);
    assert.match(nav, /说说/);
    assert.match(css, /\.xh-scene-shell/);
    assert.match(css, /\.xh-feature-board/);
    assert.match(css, /\.xh-profile-panel/);
    assert.match(css, /\.xh-music-panel/);
    assert.match(css, /grid-auto-flow: dense/);
  });

  it('moves target-style anime effects into the global layout', async () => {
    const [page, layout, component, motion, blog, css] = await Promise.all([
      readFile('app/page.tsx', 'utf8'),
      readFile('app/layout.tsx', 'utf8'),
      readFile('components/HomeEffects.tsx', 'utf8'),
      readFile('components/TasteMotion.tsx', 'utf8'),
      readFile('lib/blog.ts', 'utf8'),
      readFile('app/globals.css', 'utf8')
    ]);

    assert.doesNotMatch(page, /<HomeEffects/);
    assert.match(layout, /<HomeEffects site=\{data\.site\} posts=\{posts\} notes=\{data\.notes\} activeTrack=\{activeTrack\}/);
    assert.match(layout, /<TasteMotion \/>/);
    assert.match(page, /data-motion="portal-card"/);
    assert.match(page, /data-motion="image-scale"/);
    assert.match(page, /data-motion="stack-card"/);
    assert.match(component, /usePathname/);
    assert.match(component, /xh-danmaku-layer/);
    assert.match(component, /xh-firefly-layer/);
    assert.match(component, /xh-petal-layer/);
    assert.match(component, /xh-grass-layer/);
    assert.match(component, /xh-floating-companion/);
    assert.match(component, /prefers-reduced-motion/);
    assert.match(motion, /gsap/);
    assert.match(motion, /ScrollTrigger/);
    assert.match(motion, /prefers-reduced-motion/);
    assert.match(blog, /VisualEffectsConfig/);
    assert.match(blog, /danmaku: string\[\]/);
    assert.match(css, /\.xh-danmaku-item/);
    assert.match(component, /dailyDanmaku/);
    assert.match(component, /BGM 已循环到第三遍/);
    assert.match(component, /补番前先写两段/);
    assert.match(css, /\.xh-danmaku-item \{[\s\S]*border: 0;/);
    assert.match(css, /\.xh-danmaku-item \{[\s\S]*background: transparent;/);
    assert.match(css, /\.xh-danmaku-item \{[\s\S]*backdrop-filter: none;/);
    assert.match(css, /@keyframes xh-petal-fall/);
    assert.match(css, /html\[data-xh-theme="night"\]/);
    assert.match(css, /--xh-sakura: #ff8fc7/);
    assert.match(css, /--xh-cyan: #7cd9ff/);
    assert.match(css, /grid-auto-flow: dense/);
  });
});
