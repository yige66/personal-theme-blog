import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { extractTableOfContents, renderMarkdown } from '../lib/blog.ts';

describe('renderMarkdown', () => {
  it('renders links, images, blockquotes and fenced code blocks safely', () => {
    const html = renderMarkdown(`## Heading

> quoted **text**

[GitHub](https://github.com/yige66) and ![Cover](/assets/img/hero-mountain.svg)

\`\`\`ts
const unsafe = "<script>";
\`\`\`
`);

    assert.match(html, /<h2 id="toc-heading">Heading<\/h2>/);
    assert.match(html, /<blockquote><p>quoted <strong>text<\/strong><\/p><\/blockquote>/);
    assert.match(html, /<a href="https:\/\/github\.com\/yige66" target="_blank" rel="noreferrer">GitHub<\/a>/);
    assert.match(html, /<img src="\/assets\/img\/hero-mountain\.svg" alt="Cover" loading="lazy" \/>/);
    assert.match(html, /<pre><code class="language-ts">const unsafe = &quot;&lt;script&gt;&quot;;\n<\/code><\/pre>/);
  });

  it('extracts heading ids that match rendered markdown headings', () => {
    const markdown = `## Reading path

### [Linked title](/posts/example)

### Reading path
`;

    const toc = extractTableOfContents(markdown);
    const html = renderMarkdown(markdown);

    assert.deepEqual(toc, [
      { level: 2, text: 'Reading path', id: 'toc-reading-path' },
      { level: 3, text: 'Linked title', id: 'toc-linked-title' },
      { level: 3, text: 'Reading path', id: 'toc-reading-path-2' }
    ]);
    assert.match(html, /<h2 id="toc-reading-path">Reading path<\/h2>/);
    assert.match(html, /<h3 id="toc-linked-title"><a href="\/posts\/example">Linked title<\/a><\/h3>/);
    assert.match(html, /<h3 id="toc-reading-path-2">Reading path<\/h3>/);
  });

  it('does not create unsafe javascript links', () => {
    const html = renderMarkdown('[bad](javascript:alert(1))');
    assert.doesNotMatch(html, /href="javascript:/);
    assert.match(html, /<span>bad<\/span>/);
  });

  it('keeps markdown syntax inside inline code literal', () => {
    const html = renderMarkdown('Use `[docs](/posts/example) and ![cover](/x.png)` as text.');

    assert.match(html, /<code>\[docs\]\(\/posts\/example\) and !\[cover\]\(\/x\.png\)<\/code>/);
    assert.doesNotMatch(html, /<code>.*<a /);
    assert.doesNotMatch(html, /<code>.*<img /);
  });

  it('keeps local and hash links in-place while external links open separately', () => {
    const html = renderMarkdown('[local](/posts/example) [jump](#comments) [external](https://example.com)');

    assert.match(html, /<a href="\/posts\/example">local<\/a>/);
    assert.match(html, /<a href="#comments">jump<\/a>/);
    assert.match(html, /<a href="https:\/\/example\.com" target="_blank" rel="noreferrer">external<\/a>/);
  });

  it('rejects scheme-relative URLs', () => {
    const html = renderMarkdown('[cdn](//example.com/file.js) ![remote](//example.com/image.png)');

    assert.doesNotMatch(html, /href="\/\//);
    assert.doesNotMatch(html, /src="\/\//);
    assert.match(html, /<span>cdn<\/span>/);
    assert.match(html, /<span>remote<\/span>/);
  });
});
