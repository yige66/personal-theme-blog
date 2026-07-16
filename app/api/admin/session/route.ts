import { NextResponse } from 'next/server';
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE_SECONDS,
  createAdminSessionToken,
  isConfiguredAdminToken
} from '@/lib/admin-auth';
import { consumeAdminRateLimit } from '@/lib/admin-rate-limit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_SESSION_BODY_BYTES = 16 * 1024;

export async function POST(request: Request) {
  const rateLimit = consumeAdminRateLimit(request, 'admin-session', { limit: 10 });
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.retryAfterSeconds);
  }

  const secret = process.env.ADMIN_WRITE_TOKEN;
  if (!secret) {
    return sessionResponse({ error: '后台认证尚未配置。' }, 503);
  }

  const contentLength = Number(request.headers.get('content-length') || 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_SESSION_BODY_BYTES) {
    return sessionResponse({ error: '请求体过大。' }, 413);
  }

  let body: unknown;
  try {
    const rawBody = await readLimitedBody(request, MAX_SESSION_BODY_BYTES);
    if (rawBody === null) {
      return sessionResponse({ error: '请求体过大。' }, 413);
    }
    body = JSON.parse(rawBody);
  } catch {
    return sessionResponse({ error: '请输入后台密码。' }, 400);
  }

  const token = isRecord(body) && typeof body.token === 'string' ? body.token.trim() : '';
  if (token.length > 256 || !isConfiguredAdminToken(token)) {
    return sessionResponse({ error: '后台密码不正确。' }, 401);
  }

  const response = sessionResponse({ authenticated: true }, 200);
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: createAdminSessionToken(secret),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS
  });
  return response;
}

export async function DELETE() {
  const response = sessionResponse({ authenticated: false }, 200);
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0
  });
  return response;
}

function sessionResponse(body: Record<string, unknown>, status: number): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' }
  });
}

function rateLimitResponse(retryAfterSeconds: number) {
  const response = sessionResponse({ error: '请求过于频繁，请稍后重试。' }, 429);
  response.headers.set('Retry-After', String(retryAfterSeconds));
  return response;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

async function readLimitedBody(request: Request, maxBytes: number): Promise<string | null> {
  if (!request.body) {
    return '';
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      const chunk = value || new Uint8Array();
      totalBytes += chunk.byteLength;
      if (totalBytes > maxBytes) {
        try {
          await reader.cancel();
        } catch {
          // The request is already being rejected; cancellation is best effort.
        }
        return null;
      }
      chunks.push(chunk);
    }
  } finally {
    reader.releaseLock();
  }

  const body = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(body);
}
