import { createHmac, timingSafeEqual } from 'node:crypto';
import { revalidatePath, revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';
import { isAdminAuthorized } from '@/lib/admin-auth';
import { consumeAdminRateLimit } from '@/lib/admin-rate-limit';
import { getBlogData } from '@/lib/blog';
import { GITHUB_PROJECTS_CACHE_TAG, getGithubProjects, githubProjectOwnerCacheTag, resolveGithubProjectOwner } from '@/lib/github-projects';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_WEBHOOK_BODY_BYTES = 1024 * 1024;
const PROJECT_SYNC_EVENTS = new Set(['push', 'repository', 'create', 'delete', 'public', 'release']);
const IMMEDIATE_EXPIRE = { expire: 0 };

export async function GET(request: Request) {
  const rateLimit = consumeAdminRateLimit(request, 'project-sync-read', { limit: 60 });
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.retryAfterSeconds);
  }

  if (!isCronAuthorized(request) && !isAdminAuthorized(request)) {
    return NextResponse.json(
      { error: 'Project cron sync is locked. Configure CRON_SECRET or send the admin token.' },
      { status: 401 }
    );
  }

  const schedule = normalizeHeader(request.headers.get('x-vercel-cron-schedule'));
  const result = await refreshGithubProjectCache(schedule ? `cron:${schedule}` : 'cron');
  return NextResponse.json({ ok: true, schedule, ...result });
}

export async function POST(request: Request) {
  const declaredLength = Number(request.headers.get('content-length') || 0);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_WEBHOOK_BODY_BYTES) {
    return NextResponse.json({ error: 'Webhook payload is too large.' }, { status: 413 });
  }

  const body = await request.text();
  if (Buffer.byteLength(body, 'utf8') > MAX_WEBHOOK_BODY_BYTES) {
    return NextResponse.json({ error: 'Webhook payload is too large.' }, { status: 413 });
  }

  const event = normalizeHeader(request.headers.get('x-github-event'));
  const delivery = normalizeHeader(request.headers.get('x-github-delivery'));
  const signature = normalizeHeader(request.headers.get('x-hub-signature-256'));
  const isGitHubWebhook = Boolean(event || signature);

  if (isGitHubWebhook) {
    const secret = readRuntimeEnv('GITHUB_PROJECTS_WEBHOOK_SECRET');
    if (!secret) {
      return NextResponse.json({ error: 'GitHub project webhook secret is not configured.' }, { status: 503 });
    }

    if (!verifyGitHubSignature(body, signature, secret)) {
      return NextResponse.json({ error: 'Invalid GitHub webhook signature.' }, { status: 401 });
    }

    if (event === 'ping') {
      return NextResponse.json({ ok: true, event, delivery, synced: false });
    }

    if (!PROJECT_SYNC_EVENTS.has(event)) {
      return NextResponse.json({ ok: true, event, delivery, ignored: true, synced: false });
    }

    const result = await refreshGithubProjectCache(`github:${event}`);
    return NextResponse.json({ ok: true, event, delivery, ...result });
  }

  const rateLimit = consumeAdminRateLimit(request, 'project-sync-write', { limit: 20 });
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.retryAfterSeconds);
  }

  if (!isAdminAuthorized(request)) {
    return NextResponse.json(
      { error: 'Project sync is locked. Configure ADMIN_WRITE_TOKEN or GitHub webhook signing.' },
      { status: 401 }
    );
  }

  const result = await refreshGithubProjectCache('manual');
  return NextResponse.json({ ok: true, ...result });
}

function rateLimitResponse(retryAfterSeconds: number) {
  return NextResponse.json(
    { error: 'Project sync requests are too frequent. Try again later.' },
    { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } }
  );
}

async function refreshGithubProjectCache(trigger: string) {
  const data = await getBlogData();
  const username = resolveGithubProjectOwner(data.site.github);

  revalidateTag(GITHUB_PROJECTS_CACHE_TAG, IMMEDIATE_EXPIRE);
  if (username) {
    revalidateTag(githubProjectOwnerCacheTag(username), IMMEDIATE_EXPIRE);
  }

  const synced = await getGithubProjects(data.site, data.projects);
  revalidatePath('/projects');

  return {
    trigger,
    source: synced.source,
    username: synced.username,
    projectCount: synced.projects.length,
    refreshedAt: new Date().toISOString()
  };
}

function verifyGitHubSignature(payload: string, signature: string, secret: string): boolean {
  if (!signature.startsWith('sha256=')) {
    return false;
  }

  const expected = `sha256=${createHmac('sha256', secret).update(payload).digest('hex')}`;
  const providedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  return providedBuffer.length === expectedBuffer.length && timingSafeEqual(providedBuffer, expectedBuffer);
}

function isCronAuthorized(request: Request): boolean {
  const cronSecret = readRuntimeEnv('CRON_SECRET', 'GITHUB_PROJECTS_CRON_SECRET');
  if (!cronSecret) {
    return process.env.NODE_ENV !== 'production';
  }

  return secureCompare(normalizeHeader(request.headers.get('authorization')), `Bearer ${cronSecret}`);
}

function secureCompare(provided: string, expected: string): boolean {
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);

  return providedBuffer.length > 0
    && providedBuffer.length === expectedBuffer.length
    && timingSafeEqual(providedBuffer, expectedBuffer);
}

function normalizeHeader(value: string | null): string {
  return (value || '').trim();
}

function readRuntimeEnv(...keys: string[]): string {
  for (const key of keys) {
    const value = process.env[key];
    const trimmed = typeof value === 'string' ? value.trim() : '';
    if (trimmed && !isPlaceholderEnvValue(trimmed)) {
      return trimmed;
    }
  }
  return '';
}

function isPlaceholderEnvValue(value: string): boolean {
  return /^your[-_]/i.test(value) || /^change-this/i.test(value);
}
