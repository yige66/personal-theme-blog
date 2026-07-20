import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { BLOG_REPOSITORY_OWNER, isSafeGitHubName } from './github-repository';

export const GITHUB_ACCESS_TOKEN_COOKIE = 'personal-theme-blog-github-token';
export const GITHUB_OAUTH_STATE_COOKIE = 'personal-theme-blog-github-oauth-state';
export const GITHUB_OAUTH_VERIFIER_COOKIE = 'personal-theme-blog-github-oauth-verifier';
export const GITHUB_OAUTH_STATE_MAX_AGE_SECONDS = 10 * 60;
export const GITHUB_ACCESS_TOKEN_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

const GITHUB_CLIENT_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{7,127}$/;

export type GitHubOAuthStatePayload = {
  issuedAt: number;
  nonce: string;
  owner: string;
  repo: string;
  returnTo: string;
};

export function readGitHubOAuthClientId(): string {
  const value = readRuntimeEnv('NEXT_PUBLIC_GITALK_CLIENT_ID', 'GITALK_CLIENT_ID', 'GITHUB_CLIENT_ID', 'NEXT_PUBLIC_GITHUB_CLIENT_ID');
  return isSafeGitHubClientId(value) ? value : '';
}

/** Accepts GitHub OAuth App IDs, including the dotted `Iv1.` format. */
export function isSafeGitHubClientId(value: string): boolean {
  return GITHUB_CLIENT_ID_PATTERN.test(value);
}

export function readGitHubOAuthClientSecret(): string {
  const value = readRuntimeEnv('GITHUB_CLIENT_SECRET', 'GITALK_CLIENT_SECRET');
  return value.length <= 512 && !/[\u0000-\u001f\u007f]/.test(value) ? value : '';
}

export function readGitHubStarOwner(): string {
  const value = readRuntimeEnv(
    'GITHUB_STAR_OWNER',
    'GITHUB_PROJECTS_OWNER',
    'GITHUB_USERNAME',
    'NEXT_PUBLIC_GITHUB_USERNAME',
    'NEXT_PUBLIC_GITALK_OWNER',
    'GITALK_OWNER',
    'GITHUB_COMMENTS_OWNER'
  );
  return isSafeGitHubName(value) ? value : BLOG_REPOSITORY_OWNER;
}

export function getGitHubOAuthRedirectUri(request: Request): string {
  const configured = readRuntimeEnv('GITHUB_STAR_CALLBACK_URL');
  const siteUrl = configured || readRuntimeEnv('NEXT_PUBLIC_SITE_URL');

  try {
    const url = new URL(siteUrl || request.url);
    if (!['http:', 'https:'].includes(url.protocol)) {
      return '';
    }

    if (!configured) {
      url.pathname = '/';
      url.search = '';
      url.hash = '';
    }

    return url.toString();
  } catch {
    return '';
  }
}

export function createPkceCodeVerifier(): string {
  return randomBytes(32).toString('base64url');
}

export function createPkceCodeChallenge(verifier: string): string {
  return createHash('sha256').update(verifier).digest('base64url');
}

export function createGitHubOAuthState(input: Omit<GitHubOAuthStatePayload, 'issuedAt' | 'nonce'>, secret: string, now = Date.now()): string {
  const payload: GitHubOAuthStatePayload = {
    ...input,
    issuedAt: now,
    nonce: randomBytes(18).toString('base64url')
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  return `${encodedPayload}.${signState(encodedPayload, secret)}`;
}

export function verifyGitHubOAuthState(value: string, secret: string, now = Date.now()): GitHubOAuthStatePayload | null {
  const [encodedPayload, signature, ...extra] = value.split('.');
  if (extra.length > 0 || !encodedPayload || !signature || !secureCompare(signature, signState(encodedPayload, secret))) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as Partial<GitHubOAuthStatePayload>;
    const issuedAt = typeof payload.issuedAt === 'number' ? payload.issuedAt : Number.NaN;
    const age = now - issuedAt;
    if (
      !Number.isSafeInteger(issuedAt)
      || age < -60_000
      || age > GITHUB_OAUTH_STATE_MAX_AGE_SECONDS * 1_000
      || !payload.nonce
      || !isSafeGitHubName(payload.owner)
      || !isSafeGitHubName(payload.repo)
      || !normalizeGitHubReturnTo(payload.returnTo)
    ) {
      return null;
    }

    return {
      issuedAt,
      nonce: payload.nonce,
      owner: payload.owner,
      repo: payload.repo,
      returnTo: normalizeGitHubReturnTo(payload.returnTo)
    };
  } catch {
    return null;
  }
}

export function normalizeGitHubReturnTo(value: unknown, fallback = '/projects'): string {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!raw || raw.startsWith('//') || /[\u0000-\u001f\u007f]/.test(raw) || raw.length > 512) {
    return fallback;
  }

  try {
    const url = new URL(raw, 'https://local.invalid');
    if (url.origin !== 'https://local.invalid' || !url.pathname.startsWith('/')) {
      return fallback;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

export function appendGitHubStarIntent(
  returnTo: string,
  owner: string,
  repo: string,
  intent: 'ready' | 'success' | 'error' = 'ready'
): string {
  const normalized = normalizeGitHubReturnTo(returnTo);
  const url = new URL(normalized, 'https://local.invalid');
  url.searchParams.set('github_star', intent);
  url.searchParams.set('github_repo', `${owner}/${repo}`);
  return `${url.pathname}${url.search}${url.hash}`;
}

export function readCookie(header: string | null, name: string): string | undefined {
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

function signState(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

function secureCompare(provided: string, expected: string): boolean {
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  if (!providedBuffer.length || providedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(providedBuffer, expectedBuffer);
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
  return /^your[-_]/i.test(value) || /^change-this/i.test(value) || /:\/\/your[-_]/i.test(value);
}
