import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const TOKEN_ENDPOINT = 'https://github.com/login/oauth/access_token';
const MAX_BODY_LENGTH = 4096;
const SUPPORTED_CONTENT_TYPES = ['application/json', 'application/x-www-form-urlencoded'];
const OAUTH_TOKEN_FIELDS = ['client_id', 'code', 'redirect_uri', 'state', 'code_verifier'] as const;

type OAuthPayload = Partial<Record<(typeof OAUTH_TOKEN_FIELDS)[number] | 'client_secret', string>>;

export async function POST(request: Request) {
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

  return new Set(values.filter((value) => /^[A-Za-z0-9_-]{8,128}$/.test(value)));
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
