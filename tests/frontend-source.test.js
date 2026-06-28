import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

describe('homepage experience showcase wiring', () => {
  it('connects the homepage to the multi-surface experience component', async () => {
    const [page, component, css] = await Promise.all([
      readFile('app/page.tsx', 'utf8'),
      readFile('components/ExperienceShowcase.tsx', 'utf8'),
      readFile('app/globals.css', 'utf8')
    ]);

    assert.match(page, /ExperienceShowcase/);
    assert.match(page, /data=\{data\} stats=\{stats\} projects=\{projects\}/);
    assert.match(component, /data\.site\.gallery\.slice\(0, 3\)/);
    assert.match(component, /data\.site\.music\[0\]/);
    assert.match(component, /data\.notes\[0\]/);
    assert.match(component, /featuredProject/);
    assert.match(component, /aria-labelledby="experience-title"/);
    assert.match(css, /\.experience-showcase/);
    assert.match(css, /\.experience-layout/);
    assert.match(css, /\.experience-current/);
  });
});

describe('target-inspired homepage shell', () => {
  it('keeps the configurable profile card and target-style entry cards on the homepage', async () => {
    const [page, nav, css] = await Promise.all([
      readFile('app/page.tsx', 'utf8'),
      readFile('components/SiteNav.tsx', 'utf8'),
      readFile('app/globals.css', 'utf8')
    ]);

    assert.match(page, /data\.site\.owner \|\| data\.site\.title/);
    assert.match(page, /data\.site\.avatar/);
    assert.match(page, /data\.site\.motto/);
    assert.match(page, /CONNECTING/);
    assert.match(page, /Latest Insight/);
    assert.match(page, /xh-profile-card/);
    assert.match(page, /xh-side-stack/);
    assert.match(page, /xh-tech-strip/);
    assert.match(page, /JSON CMS/);
    assert.match(nav, /照片墙/);
    assert.match(nav, /说说/);
    assert.match(css, /\.xh-profile-card/);
    assert.match(css, /\.xh-insight-card/);
    assert.match(css, /\.xh-tech-strip/);
  });

  it('implements target-inspired anime effects without hardcoding them into the page', async () => {
    const [page, component, blog, css] = await Promise.all([
      readFile('app/page.tsx', 'utf8'),
      readFile('components/HomeEffects.tsx', 'utf8'),
      readFile('lib/blog.ts', 'utf8'),
      readFile('app/globals.css', 'utf8')
    ]);

    assert.match(page, /<HomeEffects site=\{data\.site\} posts=\{posts\} notes=\{data\.notes\} activeTrack=\{activeTrack\}/);
    assert.match(component, /xh-danmaku-layer/);
    assert.match(component, /xh-firefly-layer/);
    assert.match(component, /xh-petal-layer/);
    assert.match(component, /xh-grass-layer/);
    assert.match(component, /xh-floating-companion/);
    assert.match(component, /prefers-reduced-motion/);
    assert.match(blog, /VisualEffectsConfig/);
    assert.match(blog, /danmaku: string\[\]/);
    assert.match(css, /\.xh-danmaku-item/);
    assert.match(css, /@keyframes xh-petal-fall/);
    assert.match(css, /html\[data-xh-theme="night"\]/);
  });
});
