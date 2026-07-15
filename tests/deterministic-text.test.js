import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';
import { compareTextCodePoints } from '../lib/deterministic-text.ts';

describe('deterministic text ordering', () => {
  it('orders mixed-language labels without environment-specific collation', () => {
    const labels = ['后台管理', 'AI 应用', 'Vue2', 'MySQL'];
    assert.deepEqual(labels.sort(compareTextCodePoints), ['AI 应用', 'MySQL', 'Vue2', '后台管理']);
    assert.equal(compareTextCodePoints('same', 'same'), 0);
  });

  it('keeps the archive tag rail on the deterministic comparator', async () => {
    const [archive, blog, portal] = await Promise.all([
      readFile('components/ArchiveSwitchboard.tsx', 'utf8'),
      readFile('lib/blog.ts', 'utf8'),
      readFile('lib/portal-index.ts', 'utf8')
    ]);
    assert.match(archive, /compareTextCodePoints\(a\.name, b\.name\)/);
    assert.doesNotMatch(archive, /localeCompare/);
    assert.match(blog, /compareTextCodePoints\(a\.name, b\.name\)/);
    assert.match(portal, /compareTextCodePoints\(a\.title, b\.title\)/);
    assert.doesNotMatch(blog, /localeCompare/);
    assert.doesNotMatch(portal, /localeCompare/);
  });
});
