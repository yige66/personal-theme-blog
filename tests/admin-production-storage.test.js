import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import blogData from '../data/blog.json' with { type: 'json' };
import { createBlogDataRevision } from '../lib/blog-admin.ts';
import { normalizeBlogData } from '../lib/blog.ts';
import { assertBlogStorageWritable, assertMediaStorageWritable, getPrivateBlobCredentialOptions, isBlobStorageConfigured, normalizeBlobEtag } from '../lib/blog-storage.ts';

const originalNodeEnv = process.env.NODE_ENV;
const originalBlobToken = process.env.BLOB_READ_WRITE_TOKEN;
const originalPublicBlobToken = process.env.BLOB_PUBLIC_READ_WRITE_TOKEN;
const originalPublicStoreId = process.env.BLOB_PUBLIC_STORE_ID;
const originalPrivateStoreId = process.env.BLOB_STORE_ID;
const originalOidcToken = process.env.VERCEL_OIDC_TOKEN;

afterEach(() => {
  restoreEnv('NODE_ENV', originalNodeEnv);
  restoreEnv('BLOB_READ_WRITE_TOKEN', originalBlobToken);
  restoreEnv('BLOB_PUBLIC_READ_WRITE_TOKEN', originalPublicBlobToken);
  restoreEnv('BLOB_PUBLIC_STORE_ID', originalPublicStoreId);
  restoreEnv('BLOB_STORE_ID', originalPrivateStoreId);
  restoreEnv('VERCEL_OIDC_TOKEN', originalOidcToken);
});

describe('production admin storage policy', () => {
  it('converts weak GET etags into strong conditional-write etags', () => {
    assert.equal(normalizeBlobEtag('W/"abc123"'), '"abc123"');
    assert.equal(normalizeBlobEtag('"abc123"'), '"abc123"');
  });

  it('creates stable revisions and detects changed persisted content', () => {
    const first = { site: { title: 'Yuki' }, posts: [] };
    const same = JSON.parse(JSON.stringify(first));
    const changed = { site: { title: 'Yuki Notes' }, posts: [] };

    assert.equal(createBlogDataRevision(first), createBlogDataRevision(same));
    assert.notEqual(createBlogDataRevision(first), createBlogDataRevision(changed));
  });

  it('uses the normalized form for submitted and persisted revisions', () => {
    const submitted = JSON.parse(JSON.stringify(blogData));
    submitted.site.title = `  ${submitted.site.title}  `;
    submitted.site.projectOrder = submitted.site.projectOrder.map((item) => ` ${item} `);

    const normalized = normalizeBlogData(submitted);
    const persisted = normalizeBlogData(JSON.parse(JSON.stringify(normalized)));

    assert.equal(createBlogDataRevision(normalized), createBlogDataRevision(persisted));
    assert.equal(normalized.site.projectOrder[0], blogData.site.projectOrder[0]);
  });

  it('rejects blog writes when production Blob storage is not configured', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.BLOB_READ_WRITE_TOKEN;

    assert.throws(
      () => assertBlogStorageWritable(),
      /BLOB_READ_WRITE_TOKEN/
    );
  });

  it('rejects media writes when production public Blob storage is not configured', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.BLOB_PUBLIC_READ_WRITE_TOKEN;
    delete process.env.VERCEL_OIDC_TOKEN;

    assert.throws(
      () => assertMediaStorageWritable(),
      /public Blob token or VERCEL_OIDC_TOKEN/
    );
  });

  it('allows production blog writes when the private Blob token is configured', () => {
    process.env.NODE_ENV = 'production';
    process.env.BLOB_READ_WRITE_TOKEN = 'test-private-blob-token';

    assert.doesNotThrow(() => assertBlogStorageWritable());
  });

  it('uses the project-scoped OIDC credential for private Blob storage', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.BLOB_READ_WRITE_TOKEN;
    process.env.VERCEL_OIDC_TOKEN = 'test-private-oidc-token';
    process.env.BLOB_STORE_ID = 'store_private';

    assert.equal(isBlobStorageConfigured(), true);
    assert.deepEqual(getPrivateBlobCredentialOptions(), {
      oidcToken: 'test-private-oidc-token',
      storeId: 'store_private'
    });
    assert.doesNotThrow(() => assertBlogStorageWritable());
  });

  it('does not treat an unscoped private OIDC token as configured', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.BLOB_READ_WRITE_TOKEN;
    process.env.VERCEL_OIDC_TOKEN = 'test-private-oidc-token';
    delete process.env.BLOB_STORE_ID;

    assert.equal(isBlobStorageConfigured(), false);
    assert.throws(
      () => assertBlogStorageWritable(),
      /BLOB_STORE_ID/
    );
  });

  it('allows production media writes through the Vercel OIDC credential', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.BLOB_PUBLIC_READ_WRITE_TOKEN;
    process.env.VERCEL_OIDC_TOKEN = 'test-oidc-token';
    process.env.BLOB_PUBLIC_STORE_ID = 'store_test';

    assert.doesNotThrow(() => assertMediaStorageWritable());
  });

  it('requires an explicit public store id when production media uses OIDC', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.BLOB_PUBLIC_READ_WRITE_TOKEN;
    delete process.env.BLOB_PUBLIC_STORE_ID;
    process.env.VERCEL_OIDC_TOKEN = 'test-oidc-token';

    assert.throws(
      () => assertMediaStorageWritable(),
      /BLOB_PUBLIC_STORE_ID/
    );
  });

  it('allows local filesystem fallback outside production', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.BLOB_READ_WRITE_TOKEN;
    delete process.env.BLOB_PUBLIC_READ_WRITE_TOKEN;
    delete process.env.BLOB_PUBLIC_STORE_ID;
    delete process.env.VERCEL_OIDC_TOKEN;

    assert.doesNotThrow(() => assertBlogStorageWritable());
    assert.doesNotThrow(() => assertMediaStorageWritable());
  });
});

function restoreEnv(name, value) {
  if (value === undefined) {
    delete process.env[name];
    return;
  }
  process.env[name] = value;
}
