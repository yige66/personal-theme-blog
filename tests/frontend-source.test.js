import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

describe('homepage experience showcase wiring', () => {
  it('connects the homepage to the multi-surface experience component', async () => {
    const [page, component, css] = await Promise.all([
      readFile('app/page.tsx', 'utf8'),
      readFile('components/ExperienceShowcase.tsx', 'utf8'),
      readFile('app/globals.css', 'utf8')
    ]);

    assert.match(page, /ExperienceShowcase/);
    assert.match(page, /data=\{data\} stats=\{stats\} projects=\{projects\}/);
    assert.match(component, /data\.site\.gallery\.slice\(0, 3\)/);
    assert.match(component, /data\.site\.music\[0\]/);
    assert.match(component, /data\.notes\[0\]/);
    assert.match(component, /featuredProject/);
    assert.match(component, /aria-labelledby="experience-title"/);
    assert.match(css, /\.experience-showcase/);
    assert.match(css, /\.experience-layout/);
    assert.match(css, /\.experience-current/);
  });
});
