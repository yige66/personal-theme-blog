import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

describe('publishing SEO surface wiring', () => {
  it('declares crawlable public routes and generated discovery files', async () => {
    const [seo, sitemap, robots, manifest, layout] = await Promise.all([
      readFile('lib/seo.ts', 'utf8'),
      readFile('app/sitemap.ts', 'utf8'),
      readFile('app/robots.ts', 'utf8'),
      readFile('app/manifest.ts', 'utf8'),
      readFile('app/layout.tsx', 'utf8')
    ]);

    for (const route of ['/', '/archive', '/projects', '/tags', '/gallery', '/moments', '/music', '/links', '/about', '/console']) {
      assert.ok(seo.includes(`path: '${route}'`), `missing public route ${route}`);
    }

    assert.match(layout, /createSiteMetadata/);
    assert.match(sitemap, /getPublishedPosts/);
    assert.match(sitemap, /getTagSummaries/);
    assert.match(sitemap, /PUBLIC_ROUTES/);
    assert.match(robots, /disallow: \['\/api\/', '\/admin.html'\]/);
    assert.match(manifest, /display: 'standalone'/);
  });

  it('adds page and article metadata plus JSON-LD output', async () => {
    const [home, post, tag, projects] = await Promise.all([
      readFile('app/page.tsx', 'utf8'),
      readFile('app/posts/[slug]/page.tsx', 'utf8'),
      readFile('app/tags/[tag]/page.tsx', 'utf8'),
      readFile('app/projects/page.tsx', 'utf8')
    ]);

    assert.match(home, /createWebsiteJsonLd/);
    assert.match(home, /application\/ld\+json/);
    assert.match(post, /createPostMetadata/);
    assert.match(post, /createArticleJsonLd/);
    assert.match(post, /application\/ld\+json/);
    assert.match(tag, /generateMetadata/);
    assert.match(tag, /createTagMetadata/);
    assert.match(projects, /staticPageMetadata\.projects/);
  });
});
