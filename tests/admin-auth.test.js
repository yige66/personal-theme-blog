import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import { isAdminAuthorized } from '../lib/admin-auth.ts';

const originalNodeEnv = process.env.NODE_ENV;
const originalAdminToken = process.env.ADMIN_WRITE_TOKEN;

afterEach(() => {
  restoreEnv('NODE_ENV', originalNodeEnv);
  restoreEnv('ADMIN_WRITE_TOKEN', originalAdminToken);
});

describe('admin API authorization', () => {
  it('fails closed in production when the server token is missing', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.ADMIN_WRITE_TOKEN;

    assert.equal(isAdminAuthorized(new Request('https://example.test/api/admin/blog')), false);
  });

  it('accepts the configured token through the dedicated header', () => {
    process.env.NODE_ENV = 'production';
    process.env.ADMIN_WRITE_TOKEN = 'test-admin-token';

    const request = new Request('https://example.test/api/admin/blog', {
      headers: { 'x-admin-token': 'test-admin-token' }
    });

    assert.equal(isAdminAuthorized(request), true);
  });

  it('accepts the configured token through a bearer header', () => {
    process.env.NODE_ENV = 'production';
    process.env.ADMIN_WRITE_TOKEN = 'test-admin-token';

    const request = new Request('https://example.test/api/admin/blog', {
      headers: { authorization: 'Bearer test-admin-token' }
    });

    assert.equal(isAdminAuthorized(request), true);
  });

  it('rejects an incorrect token', () => {
    process.env.NODE_ENV = 'production';
    process.env.ADMIN_WRITE_TOKEN = 'test-admin-token';

    const request = new Request('https://example.test/api/admin/blog', {
      headers: { 'x-admin-token': 'wrong-token' }
    });

    assert.equal(isAdminAuthorized(request), false);
  });

  it('keeps local development usable when no token is configured', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.ADMIN_WRITE_TOKEN;

    assert.equal(isAdminAuthorized(new Request('http://localhost/api/admin/blog')), true);
  });
});

function restoreEnv(name, value) {
  if (value === undefined) {
    delete process.env[name];
    return;
  }
  process.env[name] = value;
}
