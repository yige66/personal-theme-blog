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

  it('removes old test copy and keeps public profile content privacy-safe', async () => {
    const data = await readBlogData();
    const raw = await readFile('data/blog.json', 'utf8');

    assert.doesNotMatch(raw, /XHBlogs Reference|InternalBeyond Reference|目标站|参考站|复刻|项目截图位|占位|后续项目上线后/);
    assert.doesNotMatch(raw, /1772365571@qq\.com|Changsha, China/);
    assert.doesNotMatch(data.site.email, /@/);
    assert.match(data.site.bio, /Spring Boot|Next\.js|TypeScript|Java/);
    assert.match(raw, /sky-take-out|anti-fraud|Isekai-LifeSim|personal-theme-blog/);
  });

  it('keeps the profile and articles concise in the XinghuisamaBlogs reference style', async () => {
    const data = await readBlogData();
    const publishedPosts = data.posts.filter((post) => post.status === 'published');

    assert.ok(data.site.bio.length <= 120, 'site bio should stay one compact paragraph');
    assert.ok(data.site.status.length <= 90, 'site status should not become a long resume sentence');
    for (const post of publishedPosts) {
      const headingCount = (post.content.match(/^## /gm) || []).length;
      const paragraphs = post.content.split(/\n{2,}/).filter(Boolean);
      assert.ok(post.summary.length <= 72, `${post.slug} summary is too long`);
      assert.ok(post.content.length <= 230, `${post.slug} article body is too long`);
      assert.ok(headingCount <= 1, `${post.slug} should use at most one section heading`);
      assert.ok(paragraphs.length <= 4, `${post.slug} should read like a short note`);
    }
  });

  it('curates realistic articles, moments, chatters, photo wall, and tags from public project work', async () => {
    const data = await readBlogData();
    const publishedPosts = data.posts.filter((post) => post.status === 'published');
    const allTags = new Set(publishedPosts.flatMap((post) => post.tags));

    assert.ok(publishedPosts.length >= 3);
    for (const expectedTag of ['Spring Boot', 'Next.js', 'TypeScript', 'Java', '项目复盘']) {
      assert.ok(allTags.has(expectedTag), `missing grounded tag: ${expectedTag}`);
    }
    assert.ok(data.notes.some((note) => /sky-take-out|校园订餐/.test(`${note.title} ${note.content}`)));
    assert.ok(data.notes.some((note) => /Isekai-LifeSim|分支叙事/.test(`${note.title} ${note.content}`)));
    assert.ok(data.chatters.every((chatter) => !/XHBlogs|InternalBeyond|目标站|复刻/.test(`${chatter.title} ${chatter.summary} ${chatter.content}`)));
    assert.ok(data.site.gallery.some((item) => /后端|Spring Boot|接口/.test(`${item.title} ${item.description} ${item.tags?.join(' ')}`)));
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
