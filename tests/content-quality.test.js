import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

async function readBlogData() {
  return JSON.parse(await readFile('data/blog.json', 'utf8'));
}

describe('published content quality', () => {
  it('does not expose placeholder question marks in curated content', async () => {
    const raw = await readFile('data/blog.json', 'utf8');
    assert.doesNotMatch(raw, /\?{3,}/);
  });

  it('uses concrete profile and navigation links', async () => {
    const data = await readBlogData();

    assert.equal(data.site.github, 'https://github.com/yige66');
    assert.ok(data.links.some((link) => link.url === 'https://github.com/yige66'));
    assert.ok(data.links.every((link) => link.url.startsWith('http')));
  });

  it('keeps project cards complete enough for the homepage and projects page', async () => {
    const data = await readBlogData();

    assert.ok(data.projects.length >= 2);
    for (const project of data.projects) {
      assert.ok(project.id);
      assert.ok(project.title.length >= 4);
      assert.ok(project.description.length >= 20);
      assert.ok(project.cover.startsWith('/assets/'));
      assert.ok(Array.isArray(project.tags));
      assert.ok(project.tags.length > 0);
    }
  });
});
