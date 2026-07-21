import { NextResponse } from 'next/server';
import { GITHUB_ACCESS_TOKEN_COOKIE, isSafeGitHubClientId, readCookie } from '@/lib/github-oauth';
import { BLOG_REPOSITORY_OWNER } from '@/lib/github-repository';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const TOKEN_ENDPOINT = 'https://github.com/login/oauth/access_token';
const GITHUB_API_ORIGIN = 'https://api.github.com';
const MAX_BODY_LENGTH = 4096;
const MAX_PROXY_BODY_LENGTH = 64 * 1024;
const GITHUB_PROXY_REQUEST_TIMEOUT_MS = 15_000;
const GITHUB_PROXY_RETRY_DELAY_MS = 150;
const SUPPORTED_CONTENT_TYPES = ['application/json', 'application/x-www-form-urlencoded'];
const OAUTH_TOKEN_FIELDS = ['client_id', 'code', 'redirect_uri', 'state', 'code_verifier'] as const;

type OAuthPayload = Partial<Record<(typeof OAUTH_TOKEN_FIELDS)[number] | 'client_secret', string>>;
type ProxyTargetKind = 'repository' | 'user' | 'markdown' | 'star' | 'starred' | 'graphql';
type ProxyTargetResult = { target?: URL; kind?: ProxyTargetKind; error?: NextResponse };

export async function GET(request: Request) {
  const proxy = getGitHubProxyTarget(request);
  if (proxy.error) {
    return proxy.error;
  }
  if (!proxy.target) {
    return NextResponse.json({ error: 'GitHub API proxy path is required.' }, { status: 400 });
  }

  return proxyGitHubApi(request, proxy.target, proxy.kind);
}

export async function POST(request: Request) {
  const proxy = getGitHubProxyTarget(request);
  if (proxy.error) {
    return proxy.error;
  }
  if (proxy.target) {
    return proxyGitHubApi(request, proxy.target, proxy.kind);
  }

  return exchangeGitHubOAuth(request);
}

export async function PUT(request: Request) {
  const proxy = getGitHubProxyTarget(request);
  if (proxy.error) {
    return proxy.error;
  }
  if (!proxy.target) {
    return NextResponse.json({ error: 'GitHub API proxy path is required.' }, { status: 400 });
  }

  return proxyGitHubApi(request, proxy.target, proxy.kind);
}

async function exchangeGitHubOAuth(request: Request) {
  const contentType = normalizeContentType(request.headers.get('content-type') || 'application/json');

  if (!SUPPORTED_CONTENT_TYPES.includes(contentType)) {
    return NextResponse.json({ error: 'Unsupported GitHub OAuth proxy content type.' }, { status: 415 });
  }

  const declaredLength = Number(request.headers.get('content-length') || 0);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_LENGTH) {
    return NextResponse.json({ error: 'Request body is too large.' }, { status: 413 });
  }

  try {
    const rawBody = await request.text();
    if (Buffer.byteLength(rawBody, 'utf8') > MAX_BODY_LENGTH) {
      return NextResponse.json({ error: 'Request body is too large.' }, { status: 413 });
    }

    const githubClientSecret = readRuntimeEnv('GITHUB_CLIENT_SECRET', 'GITALK_CLIENT_SECRET');
    if (!githubClientSecret) {
      return NextResponse.json(
        { error: 'GitHub OAuth proxy is not configured. Set GITHUB_CLIENT_SECRET or GITALK_CLIENT_SECRET.' },
        { status: 503 }
      );
    }

    const allowedClientIds = readAllowedClientIds();
    if (allowedClientIds.size === 0) {
      return NextResponse.json(
        { error: 'GitHub OAuth client id is not configured. Set NEXT_PUBLIC_GITALK_CLIENT_ID.' },
        { status: 503 }
      );
    }

    const payload = parseOAuthPayload(rawBody, contentType);
    const validationError = validateOAuthPayload(payload, request, allowedClientIds);
    if (validationError) {
      return NextResponse.json({ error: 'Invalid GitHub OAuth payload.', reason: validationError }, { status: 400 });
    }

    const body = createTokenRequestBody(payload, contentType, githubClientSecret);

    const githubResponse = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': contentType,
        Accept: 'application/json'
      },
      body,
      cache: 'no-store'
    });

    const data = await readGithubJson(githubResponse);
    return NextResponse.json(data, { status: githubResponse.ok ? 200 : githubResponse.status });
  } catch {
    return NextResponse.json({ error: 'GitHub OAuth proxy failed.' }, { status: 502 });
  }
}

function getGitHubProxyTarget(request: Request): ProxyTargetResult {
  const rawTarget = new URL(request.url).searchParams.get('path');
  if (!rawTarget) {
    return {};
  }

  if (rawTarget.length > 2048) {
    return { error: NextResponse.json({ error: 'GitHub API proxy path is too long.' }, { status: 413 }) };
  }

  let target: URL;
  try {
    target = new URL(rawTarget);
  } catch {
    return { error: NextResponse.json({ error: 'GitHub API proxy path is invalid.' }, { status: 400 }) };
  }

  if (target.origin !== GITHUB_API_ORIGIN) {
    return { error: NextResponse.json({ error: 'GitHub API proxy target is not allowed.' }, { status: 403 }) };
  }

  const owner = readRuntimeEnv('NEXT_PUBLIC_GITALK_OWNER', 'GITALK_OWNER', 'GITHUB_COMMENTS_OWNER');
  const repo = readRuntimeEnv('NEXT_PUBLIC_GITALK_REPO', 'GITALK_REPO', 'GITHUB_COMMENTS_REPO');
  const repositoryPath = owner && repo && isSafeGitHubName(owner) && isSafeGitHubName(repo)
    ? `/repos/${owner}/${repo}`
    : '';
  const path = target.pathname.replace(/\/$/, '') || '/';
  const isRepositoryRequest = Boolean(repositoryPath && (path === repositoryPath || path.startsWith(`${repositoryPath}/`)));
  const isUserRequest = path === '/user';
  const isStarredCollectionRequest = path === '/user/starred';
  const isMarkdownRequest = path === '/markdown';
  const isGraphqlRequest = path === '/graphql';
  const projectOwner = readRuntimeEnv(
    'GITHUB_STAR_OWNER',
    'GITHUB_PROJECTS_OWNER',
    'GITHUB_USERNAME',
    'NEXT_PUBLIC_GITHUB_USERNAME',
    'NEXT_PUBLIC_GITALK_OWNER'
  ) || owner || BLOG_REPOSITORY_OWNER;
  const starMatch = path.match(/^\/user\/starred\/([^/]+)\/([^/]+)$/);
  const isStarRequest = Boolean(
    isStarredCollectionRequest
      || (projectOwner
        && starMatch
        && starMatch[1]
        && starMatch[2]
        && starMatch[1].toLowerCase() === projectOwner.toLowerCase()
        && isSafeGitHubName(starMatch[1])
        && isSafeGitHubName(starMatch[2]))
  );

  if (!isRepositoryRequest && !isUserRequest && !isMarkdownRequest && !isStarRequest && !isGraphqlRequest) {
    return { error: NextResponse.json({ error: 'GitHub API proxy path is not allowed.' }, { status: 403 }) };
  }

  if (isGraphqlRequest && !/^(Bearer|token)\s+\S+/i.test(request.headers.get('authorization') || '')) {
    return { error: NextResponse.json({ error: 'GitHub GraphQL proxy requires a bearer token.' }, { status: 401 }) };
  }

  const allowedMethods = isRepositoryRequest
    ? ['GET', 'POST']
    : isUserRequest
      ? ['GET']
      : isMarkdownRequest
        ? ['POST']
        : isGraphqlRequest
          ? ['POST']
          : isStarredCollectionRequest
            ? ['GET']
          : ['GET', 'PUT'];
  if (!allowedMethods.includes(request.method)) {
    return { error: NextResponse.json({ error: 'GitHub API proxy method is not allowed.' }, { status: 405 }) };
  }

  return {
    target,
    kind: isRepositoryRequest ? 'repository' : isUserRequest ? 'user' : isMarkdownRequest ? 'markdown' : isGraphqlRequest ? 'graphql' : isStarredCollectionRequest ? 'starred' : 'star'
  };
}

async function proxyGitHubApi(request: Request, target: URL, kind?: ProxyTargetKind): Promise<NextResponse> {
  const declaredLength = Number(request.headers.get('content-length') || 0);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_PROXY_BODY_LENGTH) {
    return NextResponse.json({ error: 'GitHub API proxy body is too large.' }, { status: 413 });
  }

  try {
    const body = request.method === 'GET' ? undefined : await request.text();
    if (body && Buffer.byteLength(body, 'utf8') > MAX_PROXY_BODY_LENGTH) {
      return NextResponse.json({ error: 'GitHub API proxy body is too large.' }, { status: 413 });
    }
    if (kind === 'star' && request.method === 'PUT' && body) {
      return NextResponse.json({ error: 'GitHub star requests must not include a body.' }, { status: 400 });
    }

    const headers = new Headers({
      Accept: 'application/vnd.github+json',
      'User-Agent': 'yuki-blog-comments',
      'X-GitHub-Api-Version': '2022-11-28'
    });
    const authorization = request.headers.get('authorization') || '';
    const cookieToken = kind === 'star' || kind === 'starred'
      ? readCookie(request.headers.get('cookie'), GITHUB_ACCESS_TOKEN_COOKIE) || ''
      : '';
    const isPublicRead = (kind === 'repository' && request.method === 'GET') || kind === 'markdown';
    const serverToken = isPublicRead ? readRuntimeEnv('GITHUB_PROJECTS_TOKEN', 'GITHUB_TOKEN') : '';
    if (serverToken) {
      headers.set('Authorization', `Bearer ${serverToken}`);
    } else if (/^(Bearer|token)\s+/i.test(authorization)) {
      headers.set('Authorization', authorization);
    } else if (cookieToken) {
      headers.set('Authorization', `Bearer ${cookieToken}`);
    }
    if (kind === 'star' && request.method === 'PUT') {
      // GitHub's starring endpoint requires an explicit zero-length request body.
      headers.set('Content-Length', '0');
    }
    if (body) {
      headers.set('Content-Type', request.headers.get('content-type') || 'application/json');
    }

    const githubRequest: RequestInit = {
      method: request.method,
      headers,
      body,
      cache: 'no-store'
    };
    const retryStarRequest = (kind === 'star' || kind === 'starred') && ['GET', 'PUT'].includes(request.method);
    let githubResponse = await fetchGitHubRequest(target, githubRequest, retryStarRequest);

    // A stale or revoked deployment token must never make public comments
    // unreadable. Retry the same public request without that token first.
    if (isPublicRead && serverToken && [401, 403].includes(githubResponse.status)) {
      const anonymousHeaders = new Headers(headers);
      anonymousHeaders.delete('Authorization');
      githubResponse = await fetchGitHubRequest(target, {
        method: request.method,
        headers: anonymousHeaders,
        body,
        cache: 'no-store'
      }, false);
    }

    if (kind === 'repository' && request.method === 'GET' && [401, 403].includes(githubResponse.status)) {
      const fallback = createPublicRepositoryFallback(target);
      if (fallback !== null) {
        return NextResponse.json(fallback, {
          status: 200,
          headers: { 'Cache-Control': 'no-store' }
        });
      }
    }

    if (kind === 'user' && request.method === 'GET' && [401, 403].includes(githubResponse.status)) {
      return new NextResponse('{}', {
        status: 200,
        headers: {
          'Cache-Control': 'no-store',
          'Content-Type': 'application/json'
        }
      });
    }
    const responseBody = await githubResponse.text();
    const responseHeaders = new Headers({
      'Cache-Control': 'no-store',
      'Content-Type': githubResponse.headers.get('content-type') || 'application/json'
    });

    return new NextResponse(responseBody, {
      status: githubResponse.status,
      headers: responseHeaders
    });
  } catch {
    return NextResponse.json({ error: 'GitHub API proxy failed.' }, { status: 502 });
  }
}

/** 对 Star 查询和写入设置上游超时，并对可安全重试的瞬态错误重试一次。 */
async function fetchGitHubRequest(target: URL, request: RequestInit, retryOnFailure: boolean): Promise<Response> {
  const fetchOnce = () => fetch(target, {
    ...request,
    signal: AbortSignal.timeout(GITHUB_PROXY_REQUEST_TIMEOUT_MS)
  });

  try {
    const response = await fetchOnce();
    if (!retryOnFailure || !isRetryableGitHubStatus(response.status)) {
      return response;
    }

    await new Promise((resolve) => setTimeout(resolve, GITHUB_PROXY_RETRY_DELAY_MS));
    const retryResponse = await fetchOnce();
    if (isRetryableGitHubStatus(retryResponse.status)) {
      logGitHubRetryFailure(target, request, retryResponse.status);
    }
    return retryResponse;
  } catch (error) {
    if (!retryOnFailure) {
      throw error;
    }

    await new Promise((resolve) => setTimeout(resolve, GITHUB_PROXY_RETRY_DELAY_MS));
    try {
      const retryResponse = await fetchOnce();
      if (isRetryableGitHubStatus(retryResponse.status)) {
        logGitHubRetryFailure(target, request, retryResponse.status);
      }
      return retryResponse;
    } catch (retryError) {
      console.warn('GitHub star proxy request failed after retry.', {
        errorName: retryError instanceof Error ? retryError.name : 'unknown',
        method: request.method || 'GET',
        path: target.pathname
      });
      throw retryError;
    }
  }
}

function isRetryableGitHubStatus(status: number): boolean {
  return [408, 500, 502, 503, 504].includes(status);
}

function logGitHubRetryFailure(target: URL, request: RequestInit, status: number): void {
  console.warn('GitHub star proxy request remained unavailable after retry.', {
    method: request.method || 'GET',
    path: target.pathname,
    status
  });
}

function createPublicRepositoryFallback(target: URL): Record<string, unknown> | unknown[] | null {
  const path = target.pathname.replace(/\/$/, '');
  if (/\/issues\/[^/]+\/comments$/.test(path)) {
    return [];
  }

  if (/\/issues\/[^/]+$/.test(path)) {
    const issueNumber = Number(path.split('/').at(-1));
    return {
      number: Number.isInteger(issueNumber) && issueNumber > 0 ? issueNumber : 0,
      comments: 0,
      comments_url: `${target.origin}${path}/comments`
    };
  }

  if (/\/issues$/.test(path)) {
    return [];
  }

  return null;
}

function normalizeContentType(value: string): string {
  return value.split(';')[0]?.trim().toLowerCase() || 'application/json';
}

function parseOAuthPayload(rawBody: string, contentType: string): OAuthPayload {
  if (contentType.includes('application/json')) {
    const input = JSON.parse(rawBody || '{}') as Record<string, unknown>;
    return OAUTH_TOKEN_FIELDS.reduce<OAuthPayload>((payload, key) => {
      if (typeof input[key] === 'string') {
        return { ...payload, [key]: input[key].trim() };
      }
      return payload;
    }, {});
  }

  const params = new URLSearchParams(rawBody);
  return OAUTH_TOKEN_FIELDS.reduce<OAuthPayload>((payload, key) => {
    const value = params.get(key);
    if (value) {
      return { ...payload, [key]: value.trim() };
    }
    return payload;
  }, {});
}

function validateOAuthPayload(payload: OAuthPayload, request: Request, allowedClientIds: Set<string>): string {
  if (!payload.client_id || !allowedClientIds.has(payload.client_id)) {
    return 'client_id is not allowed';
  }

  if (!payload.code || payload.code.length > 512 || hasControlCharacters(payload.code)) {
    return 'code is required';
  }

  if (payload.state && (payload.state.length > 512 || hasControlCharacters(payload.state))) {
    return 'state is invalid';
  }

  const redirectUri = normalizeRedirectUri(payload.redirect_uri);
  if (redirectUri && !isAllowedRedirectUri(redirectUri, request)) {
    return 'redirect_uri is not allowed';
  }

  return '';
}

function createTokenRequestBody(payload: OAuthPayload, contentType: string, secret: string): string {
  const safePayload = OAUTH_TOKEN_FIELDS.reduce<OAuthPayload>((result, key) => {
    const value = payload[key];
    return value ? { ...result, [key]: value } : result;
  }, {});

  if (contentType.includes('application/json')) {
    return JSON.stringify({ ...safePayload, client_secret: secret });
  }

  const params = new URLSearchParams();
  Object.entries(safePayload).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });
  params.set('client_secret', secret);
  return params.toString();
}

function readAllowedClientIds(): Set<string> {
  const values = [
    readRuntimeEnv('NEXT_PUBLIC_GITALK_CLIENT_ID'),
    readRuntimeEnv('GITALK_CLIENT_ID'),
    readRuntimeEnv('GITHUB_CLIENT_ID'),
    readRuntimeEnv('NEXT_PUBLIC_GITHUB_CLIENT_ID')
  ];

  return new Set(values.filter(isSafeGitHubClientId));
}

function normalizeRedirectUri(value: string | undefined): URL | null {
  if (!value) {
    return null;
  }

  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function isAllowedRedirectUri(redirectUri: URL, request: Request): boolean {
  if (!['http:', 'https:'].includes(redirectUri.protocol)) {
    return false;
  }

  const allowedOrigins = new Set(
    [
      request.headers.get('origin') || '',
      readRuntimeEnv('NEXT_PUBLIC_SITE_URL'),
      readRuntimeEnv('GITALK_ALLOWED_CALLBACK_ORIGIN')
    ]
      .flatMap((value) => value.split(','))
      .map((value) => normalizeOrigin(value))
      .filter(Boolean)
  );

  if (process.env.NODE_ENV !== 'production' && /^https?:\/\/localhost(?::\d+)?$/i.test(redirectUri.origin)) {
    return true;
  }

  return allowedOrigins.has(redirectUri.origin);
}

function normalizeOrigin(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  try {
    return new URL(trimmed).origin;
  } catch {
    return '';
  }
}

async function readGithubJson(response: Response): Promise<Record<string, unknown>> {
  const text = await response.text();
  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return { error: response.ok ? 'GitHub OAuth proxy received an invalid response.' : 'GitHub OAuth token exchange failed.' };
  }
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

function hasControlCharacters(value: string): boolean {
  return /[\u0000-\u001f\u007f]/.test(value);
}

function isSafeGitHubName(value: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/.test(value);
}
