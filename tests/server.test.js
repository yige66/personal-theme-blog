import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { createBlogServer } from '../server.js';

let server;
let baseUrl;
let dataDir;

const TEST_ADMIN_PASSPHRASE = 'test-fixture-passphrase';
const INVALID_ADMIN_PASSPHRASE = 'invalid-test-passphrase';

beforeEach(async () => {
  dataDir = await mkdtemp(join(tmpdir(), 'personal-theme-blog-'));
  await writeFile(join(dataDir, 'blog.json'), `${JSON.stringify(createSeedData(), null, 2)}\n`, 'utf8');
  server = createBlogServer({
    rootDir: process.cwd(),
    dataDir,
    publicDir: process.cwd()
  });
  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

afterEach(async () => {
  await new Promise((resolve) => server.close(resolve));
  await rm(dataDir, { recursive: true, force: true });
});

describe('public blog API', () => {
  it('returns published posts only with aggregate stats', async () => {
    const response = await fetch(`${baseUrl}/api/blog`);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.data.posts.length, 1);
    assert.equal(payload.data.posts[0].status, 'published');
    assert.equal(payload.data.stats.posts, 1);
    assert.equal(payload.data.stats.tags, 1);
  });
});

describe('admin authentication and article management', () => {
  it('supports setup, rejects missing CSRF, then creates and deletes a post', async () => {
    const setupStatus = await json('/api/setup-status');
    assert.equal(setupStatus.data.needsSetup, true);

    const setup = await json('/api/setup', {
      method: 'POST',
      body: { password: TEST_ADMIN_PASSPHRASE }
    });
    assert.equal(setup.status, 201);
    const cookie = setup.headers.get('set-cookie').split(';')[0];
    const csrfToken = setup.data.csrfToken;

    const unauthorizedCreate = await json('/api/admin/posts', {
      method: 'POST',
      cookie,
      body: createPostInput()
    });
    assert.equal(unauthorizedCreate.status, 403);

    const created = await json('/api/admin/posts', {
      method: 'POST',
      cookie,
      csrfToken,
      body: createPostInput()
    });
    assert.equal(created.status, 201);
    assert.equal(created.data.posts.length, 3);

    const post = created.data.posts.find((item) => item.slug === 'api-created-post');
    assert.ok(post);

    const updated = await json(`/api/admin/posts/${post.id}`, {
      method: 'PUT',
      cookie,
      csrfToken,
      body: {
        ...post,
        title: 'API Updated Post',
        slug: 'api-updated-post'
      }
    });
    assert.equal(updated.status, 200);
    assert.equal(updated.data.posts.find((item) => item.id === post.id).title, 'API Updated Post');

    const deleted = await json(`/api/admin/posts/${post.id}`, {
      method: 'DELETE',
      cookie,
      csrfToken
    });
    assert.equal(deleted.status, 200);
    assert.equal(deleted.data.posts.some((item) => item.id === post.id), false);
  });

  it('requires the initialized password for later logins', async () => {
    const setup = await json('/api/setup', {
      method: 'POST',
      body: { password: TEST_ADMIN_PASSPHRASE }
    });
    assert.equal(setup.status, 201);

    const failedLogin = await json('/api/login', {
      method: 'POST',
      body: { password: INVALID_ADMIN_PASSPHRASE }
    });
    assert.equal(failedLogin.status, 401);

    const passedLogin = await json('/api/login', {
      method: 'POST',
      body: { password: TEST_ADMIN_PASSPHRASE }
    });
    assert.equal(passedLogin.status, 200);
    assert.ok(passedLogin.data.csrfToken);
  });

  it('validates post slugs and prevents duplicates', async () => {
    const setup = await json('/api/setup', {
      method: 'POST',
      body: { password: TEST_ADMIN_PASSPHRASE }
    });
    const cookie = setup.headers.get('set-cookie').split(';')[0];
    const csrfToken = setup.data.csrfToken;

    const duplicate = await json('/api/admin/posts', {
      method: 'POST',
      cookie,
      csrfToken,
      body: {
        ...createPostInput(),
        slug: 'published-post'
      }
    });
    assert.equal(duplicate.status, 409);

    const invalid = await json('/api/admin/posts', {
      method: 'POST',
      cookie,
      csrfToken,
      body: {
        ...createPostInput(),
        slug: 'Invalid Slug'
      }
    });
    assert.equal(invalid.status, 400);
  });
});

async function json(path, options = {}) {
  const headers = {
    Accept: 'application/json'
  };

  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (options.cookie) {
    headers.Cookie = options.cookie;
  }

  if (options.csrfToken) {
    headers['X-CSRF-Token'] = options.csrfToken;
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method || 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });
  const payload = await response.json();

  return {
    status: response.status,
    headers: response.headers,
    ...payload
  };
}

function createSeedData() {
  return {
    site: {
      title: 'Test Blog',
      subtitle: 'A testable personal blog',
      owner: 'Tester',
      bio: 'Testing local blog content.',
      location: 'Test City',
      email: 'test@example.com',
      github: 'https://github.com/example',
      themeColor: '#2f7d68',
      accentColor: '#e7b85a',
      heroImage: '/assets/img/hero-mountain.svg'
    },
    links: [],
    notes: [],
    posts: [
      {
        id: 'published-1',
        title: 'Published Post',
        slug: 'published-post',
        summary: 'Visible summary',
        content: 'Visible content',
        tags: ['test'],
        category: 'Testing',
        cover: '/assets/img/hero-mountain.svg',
        status: 'published',
        featured: true,
        createdAt: '2026-06-01T00:00:00.000Z',
        updatedAt: '2026-06-01T00:00:00.000Z'
      },
      {
        id: 'draft-1',
        title: 'Draft Post',
        slug: 'draft-post',
        summary: 'Hidden summary',
        content: 'Hidden content',
        tags: ['draft'],
        category: 'Testing',
        cover: '/assets/img/hero-mountain.svg',
        status: 'draft',
        featured: false,
        createdAt: '2026-06-02T00:00:00.000Z',
        updatedAt: '2026-06-02T00:00:00.000Z'
      }
    ]
  };
}

function createPostInput() {
  return {
    title: 'API Created Post',
    slug: 'api-created-post',
    summary: 'Created through the admin API.',
    content: '## API\n\nThis post was created by a test.',
    tags: ['api', 'test'],
    category: 'Testing',
    cover: '/assets/img/hero-mountain.svg',
    status: 'published',
    featured: false
  };
}

