import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

describe('admin session boundary', () => {
  it('renders a locked page until the server session is established', async () => {
    const [page, gate, route] = await Promise.all([
      readFile('app/admin/page.tsx', 'utf8'),
      readFile('components/admin/AdminAccessGate.tsx', 'utf8'),
      readFile('app/api/admin/session/route.ts', 'utf8')
    ]);

    assert.match(page, /isAdminSessionAuthorized/);
    assert.match(page, /AdminAccessGate/);
    assert.match(gate, /\/api\/admin\/session/);
    assert.match(gate, /credentials:\s*['"]same-origin['"]/);
    assert.doesNotMatch(gate, /localStorage|sessionStorage/);
    assert.match(route, /ADMIN_SESSION_COOKIE/);
    assert.match(route, /httpOnly:\s*true/);
    assert.match(route, /sameSite:\s*['"]strict['"]/);
    assert.match(route, /consumeAdminRateLimit/);
    assert.match(route, /MAX_SESSION_BODY_BYTES/);
    assert.match(route, /readLimitedBody/);
  });
});
