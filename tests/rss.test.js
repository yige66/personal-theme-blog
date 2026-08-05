import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createRssFeed } from '../lib/rss.ts';

const feedItems = [
  {
    id: 'post-new',
    title: 'New & useful <notes>',
    summary: 'A summary with <details> & symbols.',
    url: 'https://example.com/posts/new-notes',
    status: 'published',
    createdAt: '2025-02-01T00:00:00.000Z',
    updatedAt: '2025-02-03T00:00:00.000Z'
  },
  {
    id: 'post-old',
    title: 'Older post',
    summary: 'Older summary',
    url: 'https://example.com/posts/older-post',
    status: 'published',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'post-draft',
    title: 'Draft post',
    summary: 'This must stay private.',
    url: 'https://example.com/posts/draft-post',
    status: 'draft',
    createdAt: '2025-04-01T00:00:00.000Z',
    updatedAt: '2025-04-01T00:00:00.000Z'
  }
];

describe('createRssFeed', () => {
  it('serializes published posts as escaped, newest-first RSS items', () => {
    const xml = createRssFeed({
      title: 'Yuki & Notes',
      description: 'Long-term <article> updates',
      siteUrl: 'https://example.com',
      feedUrl: 'https://example.com/feed.xml',
      items: feedItems
    });

    assert.match(xml, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
    assert.match(xml, /<rss version="2\.0" xmlns:atom="http:\/\/www\.w3\.org\/2005\/Atom">/);
    assert.match(xml, /<title>Yuki &amp; Notes<\/title>/);
    assert.match(xml, /<description>Long-term &lt;article&gt; updates<\/description>/);
    assert.match(xml, /<atom:link href="https:\/\/example\.com\/feed\.xml" rel="self" type="application\/rss\+xml"\s*\/>/);
    assert.match(xml, /<title>New &amp; useful &lt;notes&gt;<\/title>/);
    assert.match(xml, /<description>A summary with &lt;details&gt; &amp; symbols\.<\/description>/);
    assert.match(xml, /<link>https:\/\/example\.com\/posts\/new-notes<\/link>/);
    assert.match(xml, /<guid isPermaLink="true">https:\/\/example\.com\/posts\/new-notes<\/guid>/);
    assert.match(xml, /<pubDate>Sat, 01 Feb 2025 00:00:00 GMT<\/pubDate>/);
    assert.match(xml, /<atom:updated>Mon, 03 Feb 2025 00:00:00 GMT<\/atom:updated>/);
    assert.doesNotMatch(xml, /Draft post|This must stay private|draft-post/);

    assert.ok(xml.indexOf('posts/new-notes') < xml.indexOf('posts/older-post'));
  });

  it('omits a channel update date when the feed has no valid published items', () => {
    const xml = createRssFeed({
      title: 'Empty feed',
      description: 'No posts yet',
      siteUrl: 'https://example.com',
      feedUrl: 'https://example.com/feed.xml',
      items: [{
        ...feedItems[2],
        createdAt: 'invalid-date',
        updatedAt: 'invalid-date'
      }]
    });

    assert.doesNotMatch(xml, /<lastBuildDate>/);
    assert.doesNotMatch(xml, /<item>/);
  });

  it('keeps the latest valid channel date when another item has an invalid update date', () => {
    const xml = createRssFeed({
      title: 'Mixed feed',
      description: 'Some content',
      siteUrl: 'https://example.com',
      feedUrl: 'https://example.com/feed.xml',
      items: [
        feedItems[0],
        {
          ...feedItems[1],
          updatedAt: 'not-a-date'
        }
      ]
    });

    assert.match(xml, /<lastBuildDate>Mon, 03 Feb 2025 00:00:00 GMT<\/lastBuildDate>/);
  });
});
