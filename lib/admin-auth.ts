import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export const ADMIN_SESSION_COOKIE = 'personal-theme-blog-admin';
export const ADMIN_SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;

export function isAdminAuthorized(request: Request): boolean {
  const expected = process.env.ADMIN_WRITE_TOKEN || '';

  if (!expected) {
    return process.env.NODE_ENV !== 'production' && process.env.LOCAL_ADMIN_BYPASS === 'true';
  }

  const provided = extractAdminToken(request);
  if (secureCompare(provided, expected)) {
    return true;
  }

  return isAdminSessionAuthorized(readCookie(request.headers.get('cookie'), ADMIN_SESSION_COOKIE), expected);
}

export function extractAdminToken(request: Request): string {
  const bearer = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  return (request.headers.get('x-admin-token') || bearer || '').trim();
}

export function isConfiguredAdminToken(provided: string, expected = process.env.ADMIN_WRITE_TOKEN || ''): boolean {
  return Boolean(expected) && secureCompare(provided.trim(), expected);
}

export function createAdminSessionToken(secret: string, now = Date.now()): string {
  const expiresAt = Math.floor(now / 1_000) + ADMIN_SESSION_MAX_AGE_SECONDS;
  const payload = `${expiresAt}.${randomBytes(18).toString('base64url')}`;
  return `${payload}.${signSessionPayload(payload, secret)}`;
}

export function isAdminSessionAuthorized(value: string | undefined, secret = process.env.ADMIN_WRITE_TOKEN || '', now = Date.now()): boolean {
  return verifyAdminSessionToken(value, secret, now);
}

export function verifyAdminSessionToken(value: string | undefined, secret: string, now = Date.now()): boolean {
  if (!value || !secret) {
    return false;
  }

  const [expiresText, nonce, signature, ...extra] = value.split('.');
  if (extra.length > 0 || !/^\d+$/.test(expiresText) || !nonce || !signature) {
    return false;
  }

  const expiresAt = Number(expiresText);
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= Math.floor(now / 1_000)) {
    return false;
  }

  return secureCompare(signature, signSessionPayload(`${expiresText}.${nonce}`, secret));
}

function secureCompare(provided: string, expected: string): boolean {
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);

  if (providedBuffer.length === 0 || providedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(providedBuffer, expectedBuffer);
}

function signSessionPayload(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

function readCookie(header: string | null, name: string): string | undefined {
  if (!header) {
    return undefined;
  }

  for (const item of header.split(';')) {
    const separator = item.indexOf('=');
    if (separator < 0 || item.slice(0, separator).trim() !== name) {
      continue;
    }

    const value = item.slice(separator + 1).trim();
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }

  return undefined;
}
