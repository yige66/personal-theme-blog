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

    const retiredCopySnippets = [
      'XHBlogs Reference',
      'InternalBeyond Reference',
      '目标站',
      '参考站',
      '复刻',
      '项目截图位',
      '占位',
      '后续项目上线后'
    ];
    for (const snippet of retiredCopySnippets) {
      assert.equal(raw.includes(snippet), false, `retired copy remains: ${snippet}`);
    }
    assert.doesNotMatch(raw, /Changsha, China/);
    assert.equal(data.site.email, '1772365571@qq.com');
    assert.equal(raw.includes('联系方式不直接公开，优先通过 GitHub 或评论区沟通'), false);
    assert.match(data.site.bio, /Spring Boot|Next\.js|TypeScript|Java/);
    assert.match(raw, /sky-take-out|anti-fraud|Isekai-LifeSim|personal-theme-blog/);
  });

  it('keeps the profile compact while articles read like medium-length Xinghuisama-style notes', async () => {
    const data = await readBlogData();
    const publishedPosts = data.posts.filter((post) => post.status === 'published');

    assert.ok(data.site.bio.length <= 150, 'site bio should stay one compact paragraph');
    assert.ok(data.site.status.length <= 110, 'site status should not become a long resume sentence');
    for (const post of publishedPosts) {
      const headingCount = (post.content.match(/^## /gm) || []).length;
      const paragraphs = post.content.split(/\n{2,}/).filter(Boolean);
      assert.ok(post.summary.length <= 90, `${post.slug} summary is too long`);
      assert.ok(post.content.length >= 450, `${post.slug} article body is too short for the requested reference style`);
      assert.ok(post.content.length <= 1100, `${post.slug} article body is too long for this content surface`);
      assert.ok(headingCount >= 2 && headingCount <= 4, `${post.slug} should use a few section headings like a medium article`);
      assert.ok(paragraphs.length >= 6, `${post.slug} should read like a multi-paragraph article`);
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
    assert.ok(data.notes.some((note) => /sky-take-out|鏍″洯璁㈤/.test(`${note.title} ${note.content}`)));
    assert.ok(data.notes.some((note) => /Isekai-LifeSim|鍒嗘敮鍙欎簨/.test(`${note.title} ${note.content}`)));
    assert.ok(data.chatters.every((chatter) => !/XHBlogs|InternalBeyond|鐩爣绔檤澶嶅埢/.test(`${chatter.title} ${chatter.content}`)));

    assert.ok(Array.isArray(data.site.tags), 'site.tags should keep a derived tag index for compatibility');
    assert.ok(data.site.tags.length > 0, 'site.tags should not be empty');
    const derivedTags = new Set([...publishedPosts, ...data.chatters].flatMap((entry) => entry.tags ?? []));
    for (const tag of derivedTags) {
      assert.ok(data.site.tags.includes(tag), `derived tag index should include content-owned tag: ${tag}`);
    }
    assert.ok(data.notes.every((note) => !note.tags || note.tags.length === 0), 'moments should not use tags');

    assert.ok(data.site.gallery.some((item) => /鍚庣|Spring Boot|鎺ュ彛/.test(`${item.title} ${item.description} ${item.tags?.join(' ')}`)));
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
