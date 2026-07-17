import { NextResponse } from 'next/server';
import { getGitHubOAuthRedirectUri, normalizeGitHubReturnTo, createGitHubOAuthState, createPkceCodeChallenge, createPkceCodeVerifier, GITHUB_OAUTH_STATE_COOKIE, GITHUB_OAUTH_STATE_MAX_AGE_SECONDS, GITHUB_OAUTH_VERIFIER_COOKIE, readGitHubOAuthClientId, readGitHubOAuthClientSecret, readGitHubStarOwner } from '@/lib/github-oauth';
import { parseGitHubRepository } from '@/lib/github-repository';

const GITHUB_AUTHORIZE_ENDPOINT = 'https://github.com/login/oauth/authorize';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const repository = parseGitHubRepository(requestUrl.searchParams.get('repo'));
  const returnTo = normalizeGitHubReturnTo(requestUrl.searchParams.get('returnTo'), '/projects');
  const allowedOwner = readGitHubStarOwner();

  if (!repository || repository.owner.toLowerCase() !== allowedOwner.toLowerCase()) {
    return redirectWithStatus(request, returnTo, 'error');
  }

  const clientId = readGitHubOAuthClientId();
  const clientSecret = readGitHubOAuthClientSecret();
  if (!clientId || !clientSecret) {
    return redirectWithStatus(request, returnTo, 'configuration', repository);
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
    return redirectWithStatus(request, returnTo, 'configuration', repository);
  }

  const authorizationUrl = new URL(GITHUB_AUTHORIZE_ENDPOINT);
  authorizationUrl.searchParams.set('client_id', clientId);
  authorizationUrl.searchParams.set('redirect_uri', redirectUri);
  authorizationUrl.searchParams.set('scope', 'public_repo');
  authorizationUrl.searchParams.set('state', state);
  authorizationUrl.searchParams.set('code_challenge', createPkceCodeChallenge(verifier));
  authorizationUrl.searchParams.set('code_challenge_method', 'S256');

  const response = NextResponse.redirect(authorizationUrl);
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

function redirectWithStatus(request: Request, returnTo: string, status: string, repository?: { owner: string; repo: string }) {
  const target = new URL(normalizeGitHubReturnTo(returnTo), request.url);
  target.searchParams.set('github_star', status);
  if (repository) {
    target.searchParams.set('github_repo', `${repository.owner}/${repository.repo}`);
  }
  return NextResponse.redirect(target);
}
