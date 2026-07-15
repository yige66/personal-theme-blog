import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import {
  ADMIN_SESSION_COOKIE,
  createAdminSessionToken,
  isAdminAuthorized,
  isAdminSessionAuthorized,
  verifyAdminSessionToken
} from '../lib/admin-auth.ts';

const originalNodeEnv = process.env.NODE_ENV;
const originalAdminToken = process.env.ADMIN_WRITE_TOKEN;
const originalLocalAdminBypass = process.env.LOCAL_ADMIN_BYPASS;

afterEach(() => {
  restoreEnv('NODE_ENV', originalNodeEnv);
  restoreEnv('ADMIN_WRITE_TOKEN', originalAdminToken);
  restoreEnv('LOCAL_ADMIN_BYPASS', originalLocalAdminBypass);
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

  it('accepts a valid signed session cookie without exposing the admin token', () => {
    process.env.NODE_ENV = 'production';
    process.env.ADMIN_WRITE_TOKEN = 'test-admin-token';

    const session = createAdminSessionToken('test-admin-token');
    const request = new Request('https://example.test/api/admin/blog', {
      headers: { cookie: `${ADMIN_SESSION_COOKIE}=${session}` }
    });

    assert.equal(isAdminAuthorized(request), true);
    assert.equal(session.includes('test-admin-token'), false);
    assert.equal(isAdminSessionAuthorized(session, 'test-admin-token', 1_700_000_001_000), true);
  });

  it('rejects expired and tampered sessions', () => {
    const session = createAdminSessionToken('test-admin-token', 1_700_000_000_000);

    assert.equal(verifyAdminSessionToken(session, 'test-admin-token', 1_700_000_000_000 + 8 * 60 * 60 * 1000), false);
    assert.equal(verifyAdminSessionToken(`${session}x`, 'test-admin-token', 1_700_000_001_000), false);
    assert.equal(verifyAdminSessionToken(session, 'different-token', 1_700_000_001_000), false);
  });

  it('keeps local development usable when no token is configured', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.ADMIN_WRITE_TOKEN;
    process.env.LOCAL_ADMIN_BYPASS = 'true';

    assert.equal(isAdminAuthorized(new Request('http://localhost/api/admin/blog')), true);
  });

  it('fails closed outside production unless the local bypass is explicit', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.ADMIN_WRITE_TOKEN;
    delete process.env.LOCAL_ADMIN_BYPASS;

    assert.equal(isAdminAuthorized(new Request('http://preview.example/api/admin/blog')), false);
  });
});

function restoreEnv(name, value) {
  if (value === undefined) {
    delete process.env[name];
    return;
  }
  process.env[name] = value;
}
