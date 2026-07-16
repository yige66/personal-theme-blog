import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

describe('deployment workflow configuration', () => {
  it('declares Vercel, environment, and GitHub Actions deployment settings', async () => {
    const [vercelRaw, envExample, ci, docs, projectSyncRoute] = await Promise.all([
      readFile('vercel.json', 'utf8'),
      readFile('.env.example', 'utf8'),
      readFile('.github/workflows/ci.yml', 'utf8'),
      readFile('docs/deployment.md', 'utf8'),
      readFile('app/api/github/projects/route.ts', 'utf8')
    ]);
    const vercel = JSON.parse(vercelRaw);

    assert.equal(vercel.framework, 'nextjs');
    assert.equal(vercel.installCommand, 'npm ci');
    assert.equal(vercel.buildCommand, 'npm run build');
    assert.equal(vercel.outputDirectory, '.next');
    assert.deepEqual(vercel.crons, [{ path: '/api/github/projects', schedule: '0 3 * * *' }]);
    assert.match(envExample, /NEXT_PUBLIC_SITE_URL=/);
    assert.match(envExample, /BLOB_READ_WRITE_TOKEN=/);
    assert.match(envExample, /BLOB_PUBLIC_STORE_ID=/);
    assert.match(envExample, /CRON_SECRET=/);
    assert.match(envExample, /GITHUB_PROJECTS_OWNER=/);
    assert.match(envExample, /GITHUB_PROJECTS_TOKEN=/);
    assert.match(envExample, /GITHUB_PROJECTS_WEBHOOK_SECRET=/);
    assert.match(ci, /actions\/setup-node@v4/);
    assert.match(ci, /npm run build/);
    assert.match(ci, /npx tsc --noEmit/);
    assert.doesNotMatch(ci, /server\.js/);
    assert.match(docs, /GitHub/);
    assert.match(docs, /Vercel/);
    assert.match(docs, /GitHub project auto sync/);
    assert.match(docs, /\/api\/github\/projects/);
    assert.match(docs, /GITHUB_PROJECTS_WEBHOOK_SECRET/);
    assert.match(docs, /New repositories also sync into the project page/);
    assert.match(docs, /Authorization: Bearer \$CRON_SECRET/);
    assert.match(projectSyncRoute, /export async function GET/);
    assert.match(projectSyncRoute, /isCronAuthorized/);
    assert.match(projectSyncRoute, /CRON_SECRET/);
    assert.match(projectSyncRoute, /GITHUB_PROJECTS_CRON_SECRET/);
    assert.match(projectSyncRoute, /x-hub-signature-256/);
    assert.match(projectSyncRoute, /content-length/);
    assert.match(projectSyncRoute, /MAX_WEBHOOK_BODY_BYTES/);
    assert.match(projectSyncRoute, /createHmac\('sha256'/);
    assert.match(projectSyncRoute, /timingSafeEqual/);
    assert.match(projectSyncRoute, /IMMEDIATE_EXPIRE = \{ expire: 0 \}/);
    assert.match(projectSyncRoute, /revalidateTag\(GITHUB_PROJECTS_CACHE_TAG, IMMEDIATE_EXPIRE\)/);
    assert.match(projectSyncRoute, /revalidatePath\('\/projects'\)/);
    assert.match(projectSyncRoute, /PROJECT_SYNC_EVENTS/);
    assert.match(projectSyncRoute, /GITHUB_PROJECTS_WEBHOOK_SECRET/);
    assert.match(projectSyncRoute, /getGithubProjects/);
    assert.match(projectSyncRoute, /isAdminAuthorized/);
    assert.doesNotMatch(docs, /local CMS|npm run cms|server\.js/);
  });

  it('keeps the admin surface private and removes the public publishing route', async () => {
    const [adminPage, seo, blogLib, robots] = await Promise.all([
      readFile('app/admin/page.tsx', 'utf8'),
      readFile('lib/seo.ts', 'utf8'),
      readFile('lib/blog.ts', 'utf8'),
      readFile('app/robots.ts', 'utf8')
    ]);

    assert.match(adminPage, /BlogAdminConsole/);
    assert.match(adminPage, /robots/);
    assert.doesNotMatch(adminPage, /SiteNav/);
    assert.doesNotMatch(seo, /path: '\/console'/);
    assert.doesNotMatch(blogLib, /href: '\/console'|primaryActionHref: '\/console'|secondaryActionHref: '\/console'/);
    assert.match(robots, /'\/admin'/);
    assert.match(seo, /VERCEL_URL/);
  });
});
