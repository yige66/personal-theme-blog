import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { consumeAdminRateLimit } from '../lib/admin-rate-limit.ts';

describe('admin API rate limiting', () => {
  it('blocks requests that exceed the configured window limit', () => {
    const request = new Request('https://example.test/api/admin/blog', {
      headers: { 'x-forwarded-for': '203.0.113.10' }
    });

    assert.equal(consumeAdminRateLimit(request, 'blog-write', { limit: 2, windowMs: 60_000, now: 1_000 }).allowed, true);
    assert.equal(consumeAdminRateLimit(request, 'blog-write', { limit: 2, windowMs: 60_000, now: 2_000 }).allowed, true);

    const blocked = consumeAdminRateLimit(request, 'blog-write', { limit: 2, windowMs: 60_000, now: 3_000 });
    assert.equal(blocked.allowed, false);
    assert.equal(blocked.retryAfterSeconds, 58);
  });

  it('keeps limits isolated by operation and resets after the window', () => {
    const request = new Request('https://example.test/api/admin/blog', {
      headers: { 'x-real-ip': '203.0.113.11' }
    });

    assert.equal(consumeAdminRateLimit(request, 'blog-write', { limit: 1, windowMs: 1_000, now: 10_000 }).allowed, true);
    assert.equal(consumeAdminRateLimit(request, 'blog-write', { limit: 1, windowMs: 1_000, now: 10_500 }).allowed, false);
    assert.equal(consumeAdminRateLimit(request, 'blog-read', { limit: 1, windowMs: 1_000, now: 10_500 }).allowed, true);
    assert.equal(consumeAdminRateLimit(request, 'blog-write', { limit: 1, windowMs: 1_000, now: 11_000 }).allowed, true);
  });
});
