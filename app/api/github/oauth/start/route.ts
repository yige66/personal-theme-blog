import { NextResponse } from 'next/server';
import { getGitHubOAuthRedirectUri, normalizeGitHubReturnTo, createGitHubOAuthState, createPkceCodeChallenge, createPkceCodeVerifier, GITHUB_OAUTH_STATE_COOKIE, GITHUB_OAUTH_STATE_MAX_AGE_SECONDS, GITHUB_OAUTH_VERIFIER_COOKIE, readGitHubOAuthClientId, readGitHubOAuthClientSecret, readGitHubStarOwner } from '@/lib/github-oauth';
import { parseGitHubRepository } from '@/lib/github-repository';
import { GITHUB_STAR_MESSAGE_SOURCE } from '@/lib/github-star';

const GITHUB_AUTHORIZE_ENDPOINT = 'https://github.com/login/oauth/authorize';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const repository = parseGitHubRepository(requestUrl.searchParams.get('repo'));
  const returnTo = normalizeGitHubReturnTo(requestUrl.searchParams.get('returnTo'), '/projects');
  const popup = requestUrl.searchParams.get('popup') === '1';
  const allowedOwner = readGitHubStarOwner();

  if (!repository || repository.owner.toLowerCase() !== allowedOwner.toLowerCase()) {
    return redirectWithStatus(request, returnTo, 'error', undefined, popup);
  }

  const clientId = readGitHubOAuthClientId();
  const clientSecret = readGitHubOAuthClientSecret();
  if (!clientId || !clientSecret) {
    return redirectWithStatus(request, returnTo, 'configuration', repository, popup);
  }

  const verifier = createPkceCodeVerifier();
  const state = createGitHubOAuthState(
    {
      owner: repository.owner,
      repo: repository.repo,
      returnTo
    },
    clientSecret
  );
  const redirectUri = getGitHubOAuthRedirectUri(request);
  if (!redirectUri) {
    return redirectWithStatus(request, returnTo, 'configuration', repository, popup);
  }

  const authorizationUrl = new URL(GITHUB_AUTHORIZE_ENDPOINT);
  authorizationUrl.searchParams.set('client_id', clientId);
  authorizationUrl.searchParams.set('redirect_uri', redirectUri);
  authorizationUrl.searchParams.set('scope', 'public_repo');
  authorizationUrl.searchParams.set('state', state);
  authorizationUrl.searchParams.set('code_challenge', createPkceCodeChallenge(verifier));
  authorizationUrl.searchParams.set('code_challenge_method', 'S256');

  const response = wantsJsonResponse(request)
    ? NextResponse.json({ authorizationUrl: authorizationUrl.toString() })
    : NextResponse.redirect(authorizationUrl);
  const cookieOptions = {
    httpOnly: true,
    maxAge: GITHUB_OAUTH_STATE_MAX_AGE_SECONDS,
    path: '/',
    sameSite: 'lax' as const,
    secure: new URL(request.url).protocol === 'https:'
  };
  response.cookies.set(GITHUB_OAUTH_STATE_COOKIE, state, cookieOptions);
  response.cookies.set(GITHUB_OAUTH_VERIFIER_COOKIE, verifier, cookieOptions);
  return response;
}

function wantsJsonResponse(request: Request) {
  const requestUrl = new URL(request.url);
  return requestUrl.searchParams.get('format') === 'json'
    || request.headers.get('accept')?.toLowerCase().includes('application/json') === true;
}

function redirectWithStatus(
  request: Request,
  returnTo: string,
  status: string,
  repository?: { owner: string; repo: string },
  popup = false
) {
  if (popup) {
    return createOAuthFailureResponse(status);
  }

  const target = new URL(normalizeGitHubReturnTo(returnTo), request.url);
  target.searchParams.set('github_star', status);
  if (repository) {
    target.searchParams.set('github_repo', `${repository.owner}/${repository.repo}`);
  }
  return NextResponse.redirect(target);
}

/** Returns an honest popup error and reports it to the opener without redirecting to the app again. */
function createOAuthFailureResponse(status: string) {
  const configuration = status === 'configuration';
  const title = configuration ? 'GitHub Star 尚未配置' : 'GitHub Star 无法开始';
  const message = configuration
    ? '当前站点没有可用的 GitHub OAuth 配置，无法真实执行 Star。请使用已配置的线上环境，或为本地开发配置 OAuth App。'
    : 'GitHub Star 请求无效，请返回原页面重试。';
  const payload = JSON.stringify({ source: GITHUB_STAR_MESSAGE_SOURCE, status: 'error' });
  const html = `<!doctype html>
<html lang="zh-CN">
  <head><meta charset="utf-8"><title>${title}</title></head>
  <body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#171329;color:#fff;font:16px/1.6 system-ui,sans-serif;text-align:center">
    <main style="max-width:520px;padding:32px">
      <h1>${title}</h1>
      <p>${message}</p>
      <p>此页面不会伪造 Star 成功状态。</p>
    </main>
    <script>
      try {
        if (window.opener && window.opener !== window) {
          window.opener.postMessage(${payload}, window.location.origin);
          window.setTimeout(function () { window.close(); }, 80);
        }
      } catch (_) {}
    </script>
  </body>
</html>`;
  return new NextResponse(html, {
    status: configuration ? 503 : 400,
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': 'text/html; charset=utf-8'
    }
  });
}
