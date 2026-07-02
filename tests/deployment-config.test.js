import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

describe('deployment workflow configuration', () => {
  it('declares Vercel, environment, and GitHub Actions deployment settings', async () => {
    const [vercelRaw, envExample, ci, docs] = await Promise.all([
      readFile('vercel.json', 'utf8'),
      readFile('.env.example', 'utf8'),
      readFile('.github/workflows/ci.yml', 'utf8'),
      readFile('docs/deployment.md', 'utf8')
    ]);
    const vercel = JSON.parse(vercelRaw);

    assert.equal(vercel.framework, 'nextjs');
    assert.equal(vercel.installCommand, 'npm ci');
    assert.equal(vercel.buildCommand, 'npm run build');
    assert.equal(vercel.outputDirectory, '.next');
    assert.match(envExample, /NEXT_PUBLIC_SITE_URL=/);
    assert.match(ci, /actions\/setup-node@v4/);
    assert.match(ci, /npm run build/);
    assert.match(ci, /npx tsc --noEmit/);
    assert.doesNotMatch(ci, /server\.js/);
    assert.match(docs, /GitHub/);
    assert.match(docs, /Vercel/);
    assert.doesNotMatch(docs, /local CMS|npm run cms|server\.js/);
  });

  it('keeps the public publishing console deployment-first', async () => {
    const [consolePage, seo, homeCss] = await Promise.all([
      readFile('app/console/page.tsx', 'utf8'),
      readFile('lib/seo.ts', 'utf8'),
      readFile('app/home-overrides.css', 'utf8')
    ]);

    assert.doesNotMatch(consolePage, /localhost:4173/);
    assert.match(consolePage, /Deploy Workflow/);
    assert.match(consolePage, /GitHub/);
    assert.match(consolePage, /Vercel/);
    assert.match(consolePage, /console-page/);
    assert.match(homeCss, /Final home and publish tone guard/);
    assert.match(homeCss, /body:has\(\.console-page\) \.console-shell/);
    assert.match(seo, /VERCEL_URL/);
  });
});
