import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

async function readBlogData() {
  return JSON.parse(await readFile('data/blog.json', 'utf8'));
}

describe('XHBlogs-inspired experience density', () => {
  it('curates gallery, moments, and music with richer operational metadata', async () => {
    const data = await readBlogData();

    assert.ok(data.site.gallery.length >= 5);
    assert.ok(data.site.gallery.some((item) => Array.isArray(item.items) && item.items.length >= 2));
    assert.ok(data.notes.length >= 6);
    assert.ok(data.notes.some((note) => Array.isArray(note.tags) && note.tags.length > 0));
    assert.ok(data.site.music.length >= 5);
    assert.ok(data.site.music.every((track) => track.cover));
  });

  it('renders the upgraded gallery, moment, and music surfaces', async () => {
    const [blocks, gallery, moments, music, css] = await Promise.all([
      readFile('components/SectionBlocks.tsx', 'utf8'),
      readFile('app/gallery/page.tsx', 'utf8'),
      readFile('app/moments/page.tsx', 'utf8'),
      readFile('app/music/page.tsx', 'utf8'),
      readFile('app/globals.css', 'utf8')
    ]);

    assert.match(blocks, /GalleryCollectionCard/);
    assert.match(blocks, /MomentTimelineCard/);
    assert.match(blocks, /MusicTrackCard/);
    assert.match(gallery, /featuredCollections/);
    assert.match(moments, /moment-mood-rail/);
    assert.match(music, /RadioHeroCard/);
    assert.match(css, /\.gallery-collection/);
    assert.match(css, /\.moment-mood-rail/);
    assert.match(css, /\.radio-hero-card/);
  });
});
