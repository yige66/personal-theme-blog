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

  it('keeps public writing conversational instead of template-like', async () => {
    const data = await readBlogData();
    const publicWriting = [
      data.site.subtitle,
      data.site.status,
      ...data.notes.flatMap((note) => [note.title, note.content]),
      ...data.chatters.flatMap((chatter) => [chatter.title, chatter.content]),
      ...data.projects.flatMap((project) => [project.title, project.description]),
      ...data.posts.flatMap((post) => [post.title, post.summary, post.content])
    ].join('\n');

    const aiFormulaSnippets = [
      '在当今',
      '随着技术的不断发展',
      '值得注意的是',
      '综上所述',
      '总而言之',
      '这不仅仅是',
      '让我们一起',
      '具有重要意义'
    ];
    for (const snippet of aiFormulaSnippets) {
      assert.equal(publicWriting.includes(snippet), false, `formulaic copy remains: ${snippet}`);
    }

    assert.ok(data.notes.every((note) => note.content.trim().length >= 8 && note.content.length <= 180));
    assert.ok(data.notes.every((note) => note.mood && !/^\?+$/.test(note.mood)), 'moments should use readable moods');
    assert.ok(data.chatters.every((chatter) => chatter.content.split(/\n{2,}/).filter(Boolean).length >= 2));
    assert.ok(data.posts.every((post) => !/^## (边界|拆法|复盘|下一步)$/m.test(post.content)), 'article headings should not read like a generated template');
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
    assert.ok(data.notes.some((note) => /sky-take-out|校园订餐/.test(`${note.title} ${note.content}`)));
    assert.ok(data.notes.some((note) => /Isekai-LifeSim|分支叙事/.test(`${note.title} ${note.content}`)));
    assert.ok(data.chatters.every((chatter) => !/XHBlogs|InternalBeyond|目标站|复刻/.test(`${chatter.title} ${chatter.content}`)));

    assert.ok(Array.isArray(data.site.tags), 'site.tags should keep a derived tag index for compatibility');
    assert.ok(data.site.tags.length > 0, 'site.tags should not be empty');
    const derivedTags = new Set([...publishedPosts, ...data.chatters].flatMap((entry) => entry.tags ?? []));
    for (const tag of derivedTags) {
      assert.ok(data.site.tags.includes(tag), `derived tag index should include content-owned tag: ${tag}`);
    }
    assert.ok(data.notes.every((note) => !note.tags || note.tags.length === 0), 'moments should not use tags');

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
