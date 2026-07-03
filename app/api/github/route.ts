import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const TOKEN_ENDPOINT = 'https://github.com/login/oauth/access_token';
const MAX_BODY_LENGTH = 4096;

export async function POST(request: Request) {
  const contentType = request.headers.get('content-type') || 'application/json';

  try {
    const rawBody = await request.text();
    if (rawBody.length > MAX_BODY_LENGTH) {
      return NextResponse.json({ error: 'Request body is too large.' }, { status: 413 });
    }

    const githubClientSecret = process.env.GITHUB_CLIENT_SECRET || process.env.GITALK_CLIENT_SECRET;
    if (!githubClientSecret) {
      return NextResponse.json(
        { error: 'GitHub OAuth proxy is not configured. Set GITHUB_CLIENT_SECRET or GITALK_CLIENT_SECRET.' },
        { status: 503 }
      );
    }

    const body = injectClientSecret(rawBody, contentType, githubClientSecret);

    const githubResponse = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': contentType,
        Accept: 'application/json'
      },
      body,
      cache: 'no-store'
    });

    const data = await githubResponse.json();
    return NextResponse.json(data, { status: githubResponse.ok ? 200 : githubResponse.status });
  } catch {
    return NextResponse.json({ error: 'GitHub OAuth proxy failed.' }, { status: 502 });
  }
}

function injectClientSecret(rawBody: string, contentType: string, secret?: string): string {
  if (!secret) {
    return rawBody;
  }

  if (contentType.includes('application/json')) {
    try {
      const payload = JSON.parse(rawBody) as Record<string, unknown>;
      return JSON.stringify({ ...payload, client_secret: secret });
    } catch {
      return rawBody;
    }
  }

  const params = new URLSearchParams(rawBody);
  params.set('client_secret', secret);
  return params.toString();
}
