import { NextResponse } from 'next/server';
import { appendGitHubStarIntent, getGitHubOAuthRedirectUri, GITHUB_ACCESS_TOKEN_COOKIE, GITHUB_ACCESS_TOKEN_MAX_AGE_SECONDS, GITHUB_OAUTH_STATE_COOKIE, GITHUB_OAUTH_VERIFIER_COOKIE, readCookie, readGitHubOAuthClientId, readGitHubOAuthClientSecret, readGitHubStarOwner, verifyGitHubOAuthState } from '@/lib/github-oauth';

const GITHUB_TOKEN_ENDPOINT = 'https://github.com/login/oauth/access_token';
const GITHUB_USER_ENDPOINT = 'https://api.github.com/user';
const GITHUB_STAR_ENDPOINT = 'https://api.github.com/user/starred';
const GITHUB_REQUEST_TIMEOUT_MS = 15_000;
const MAX_BODY_LENGTH = 4096;

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  const contentType = request.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() || '';
  if (contentType !== 'application/json') {
    return NextResponse.json({ error: 'GitHub OAuth exchange expects JSON.' }, { status: 415 });
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

    const payload = parseExchangePayload(rawBody);
    if (!payload || !payload.code || !payload.state || hasControlCharacters(payload.code) || hasControlCharacters(payload.state)) {
      return NextResponse.json({ error: 'Invalid GitHub OAuth exchange payload.' }, { status: 400 });
    }

    const secret = readGitHubOAuthClientSecret();
    const clientId = readGitHubOAuthClientId();
    const stateCookie = readCookie(request.headers.get('cookie'), GITHUB_OAUTH_STATE_COOKIE);
    const verifier = readCookie(request.headers.get('cookie'), GITHUB_OAUTH_VERIFIER_COOKIE);
    if (!secret || !clientId || !stateCookie || !verifier || stateCookie !== payload.state) {
      return NextResponse.json({ error: 'GitHub OAuth state is invalid or expired.' }, { status: 400 });
    }

    const state = verifyGitHubOAuthState(payload.state, secret);
    const allowedOwner = readGitHubStarOwner();
    if (!state || state.owner.toLowerCase() !== allowedOwner.toLowerCase()) {
      return NextResponse.json({ error: 'GitHub OAuth state is invalid or expired.' }, { status: 400 });
    }

    const redirectUri = getGitHubOAuthRedirectUri(request);
    if (!redirectUri) {
      return NextResponse.json({ error: 'GitHub OAuth callback is not configured.' }, { status: 503 });
    }

    const tokenResponse = await fetchGitHub(GITHUB_TOKEN_ENDPOINT, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: secret,
        code: payload.code,
        code_verifier: verifier,
        redirect_uri: redirectUri
      }),
      cache: 'no-store'
    });
    const tokenData = await readJson(tokenResponse);
    const accessToken = typeof tokenData?.access_token === 'string' ? tokenData.access_token.trim() : '';
    if (!tokenResponse.ok || !isValidAccessToken(accessToken)) {
      return NextResponse.json({ error: 'GitHub OAuth token exchange failed.' }, { status: 502 });
    }

    const identityResponse = await fetchGitHub(GITHUB_USER_ENDPOINT, {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'personal-theme-blog',
        'X-GitHub-Api-Version': '2022-11-28'
      },
      cache: 'no-store'
    });
    if (!identityResponse.ok) {
      return NextResponse.json({ error: 'GitHub identity validation failed.' }, { status: 502 });
    }

    // Apply the requested Star while the freshly exchanged token is in hand.
    // This removes the fragile second request that used to depend on the browser
    // observing the new HttpOnly cookie before the page re-rendered.
    const starApplied = await starGitHubRepository(state.owner, state.repo, accessToken);
    const response = NextResponse.json({
      redirectTo: appendGitHubStarIntent(
        state.returnTo,
        state.owner,
        state.repo,
        starApplied ? 'success' : 'error'
      )
    });
    const secure = new URL(request.url).protocol === 'https:';
    response.cookies.set(GITHUB_ACCESS_TOKEN_COOKIE, accessToken, {
      httpOnly: true,
      maxAge: GITHUB_ACCESS_TOKEN_MAX_AGE_SECONDS,
      path: '/',
      sameSite: 'lax',
      secure
    });
    response.cookies.set(GITHUB_OAUTH_STATE_COOKIE, '', { httpOnly: true, maxAge: 0, path: '/', sameSite: 'lax', secure });
    response.cookies.set(GITHUB_OAUTH_VERIFIER_COOKIE, '', { httpOnly: true, maxAge: 0, path: '/', sameSite: 'lax', secure });
    return response;
  } catch {
    return NextResponse.json({ error: 'GitHub OAuth exchange failed.' }, { status: 502 });
  }
}

/**
 * Stars the repository for the authenticated OAuth user. A failed upstream
 * request is converted into a false result so the callback can return the
 * user to the original page with an explicit error state.
 */
async function starGitHubRepository(owner: string, repo: string, accessToken: string): Promise<boolean> {
  try {
    const target = `${GITHUB_STAR_ENDPOINT}/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
    const response = await fetchGitHub(target, {
      method: 'PUT',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${accessToken}`,
        'Content-Length': '0',
        'User-Agent': 'personal-theme-blog',
        'X-GitHub-Api-Version': '2022-11-28'
      },
      body: '',
      cache: 'no-store'
    });

    if (!response.ok) {
      console.warn('GitHub Star request was rejected.', { owner, repo, status: response.status });
      return false;
    }

    const verificationResponse = await fetchGitHub(target, {
      method: 'GET',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'personal-theme-blog',
        'X-GitHub-Api-Version': '2022-11-28'
      },
      cache: 'no-store'
    });
    if (verificationResponse.status !== 204) {
      console.warn('GitHub Star verification did not return 204.', { owner, repo, status: verificationResponse.status });
      return false;
    }

    return true;
  } catch (error) {
    console.warn('GitHub Star request failed.', {
      owner,
      repo,
      errorName: error instanceof Error ? error.name : 'unknown'
    });
    return false;
  }
}

/** Bounds GitHub calls so an upstream stall cannot leave the OAuth callback pending forever. */
async function fetchGitHub(input: string, init: RequestInit): Promise<Response> {
  return fetch(input, {
    ...init,
    signal: AbortSignal.timeout(GITHUB_REQUEST_TIMEOUT_MS)
  });
}

function parseExchangePayload(rawBody: string): { code: string; state: string } | null {
  try {
    const value = JSON.parse(rawBody || '{}') as Record<string, unknown>;
    const code = typeof value.code === 'string' ? value.code.trim() : '';
    const state = typeof value.state === 'string' ? value.state.trim() : '';
    if (code.length > 512 || state.length > 2048) {
      return null;
    }
    return { code, state };
  } catch {
    return null;
  }
}

async function readJson(response: Response): Promise<Record<string, unknown> | null> {
  try {
    const value: unknown = await response.json();
    return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

function isValidAccessToken(value: string): boolean {
  return Boolean(value && value.length <= 2048 && !hasControlCharacters(value));
}

function hasControlCharacters(value: string): boolean {
  return /[\u0000-\u001f\u007f]/.test(value);
}
