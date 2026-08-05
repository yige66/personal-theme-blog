import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';
import { createPostMetadata, createSiteMetadata, createTagMetadata, staticPageMetadata } from '../lib/seo.ts';

describe('RSS publishing surface wiring', () => {
  it('keeps the data-backed feed dynamic and returns cacheable RSS content', async () => {
    const route = await readFile('app/feed.xml/route.ts', 'utf8');

    assert.match(route, /export const dynamic = 'force-dynamic'/);
    assert.match(route, /Promise\.all\(\[getBlogData\(\), getPublishedPosts\(\)\]\)/);
    assert.match(route, /createRssFeed/);
    assert.match(route, /application\/rss\+xml; charset=utf-8/);
    assert.match(route, /s-maxage=300/);
  });

  it('advertises the article feed through standard Metadata alternates', () => {
    const site = {
      title: 'Yuki',
      subtitle: 'A personal blog',
      owner: 'Yuki',
      github: 'https://github.com/yige66',
      heroImage: '/hero.svg'
    };
    const metadata = createSiteMetadata(site);
    const postMetadata = createPostMetadata(site, {
      title: 'A post',
      summary: 'A summary',
      slug: 'a-post',
      tags: ['rss'],
      cover: '/cover.svg',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z'
    });
    const tagMetadata = createTagMetadata('rss', 1);
    const expectedTypes = {
      'application/rss+xml': '/feed.xml'
    };

    assert.deepEqual(metadata.alternates?.types, expectedTypes);
    assert.deepEqual(postMetadata.alternates?.types, expectedTypes);
    assert.deepEqual(tagMetadata.alternates?.types, expectedTypes);
    assert.deepEqual(staticPageMetadata.about.alternates?.types, expectedTypes);
  });
});
