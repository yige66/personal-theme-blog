import { timingSafeEqual } from 'node:crypto';

export function isAdminAuthorized(request: Request): boolean {
  const expected = process.env.ADMIN_WRITE_TOKEN || '';

  if (!expected) {
    return process.env.NODE_ENV !== 'production';
  }

  const provided = extractAdminToken(request);
  return secureCompare(provided, expected);
}

export function extractAdminToken(request: Request): string {
  const bearer = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  return (request.headers.get('x-admin-token') || bearer || '').trim();
}

function secureCompare(provided: string, expected: string): boolean {
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);

  if (providedBuffer.length === 0 || providedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(providedBuffer, expectedBuffer);
}
