import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

describe('GitHub starring flow', () => {
  it('removes the profile repository while keeping the current blog repository available', async () => {
    const [dataRaw, projectSource, blogSource, repository] = await Promise.all([
      readFile('data/blog.json', 'utf8'),
      readFile('lib/github-projects.ts', 'utf8'),
      readFile('lib/blog.ts', 'utf8'),
      readFile('lib/github-repository.ts', 'utf8')
    ]);
    const data = JSON.parse(dataRaw);

    assert.equal(data.projects.some((project) => project.repo?.endsWith('/personal-theme-blog')), true);
    assert.equal(data.site.projectOrder.some((entry) => entry.includes('/personal-theme-blog')), true);
    assert.match(repository, /BLOG_REPOSITORY_NAME = 'personal-theme-blog'/);
    assert.match(projectSource, /filter\(\(repo\) => !isGitHubProfileRepository\(repo, username\)\)/);
    assert.doesNotMatch(projectSource, /isBlogRepository/);
    assert.match(blogSource, /id: 'project-console'/);
  });

  it('uses the same-origin API first and starts OAuth for unauthenticated visitors', async () => {
    const [starButton, floating, layout, api, oauthCallback, splash, starMessage] = await Promise.all([
      readFile('components/projects/ProjectStarButton.tsx', 'utf8'),
      readFile('components/github/GitHubStarFloating.tsx', 'utf8'),
      readFile('app/layout.tsx', 'utf8'),
      readFile('app/api/github/route.ts', 'utf8'),
      readFile('components/github/GitHubOAuthCallback.tsx', 'utf8'),
      readFile('components/SplashScreen.tsx', 'utf8'),
      readFile('lib/github-star.ts', 'utf8')
    ]);

    assert.match(starButton, /method: 'PUT'/);
    assert.match(starButton, /credentials: 'include'/);
    assert.match(starButton, /api\/github\?path=/);
    assert.match(starButton, /api\/github\/oauth\/start/);
    assert.match(starButton, /window\.open\('', GITHUB_STAR_POPUP_NAME, GITHUB_STAR_POPUP_FEATURES\)/);
    assert.match(starButton, /watchOAuthPopup/);
    assert.match(starButton, /isGitHubStarOAuthMessage/);
    assert.match(starButton, /window\.location\.assign\(startUrl\.toString\(\)\)/);
    assert.doesNotMatch(starButton, /window\.location\.assign\(repositoryUrl\)/);
    assert.match(starButton, /github_star/);
    assert.match(floating, /BLOG_REPOSITORY_URL/);
    assert.match(floating, /personal-theme-blog:splash-complete/);
    assert.match(floating, /MutationObserver/);
    assert.match(floating, /!splashComplete/);
    assert.match(floating, /pathname === '\/projects'/);
    assert.match(layout, /<GitHubOAuthCallback \/>/);
    assert.match(layout, /<GitHubStarFloating \/>/);
    assert.match(layout, /window\.location\.pathname !== '\/'/);
    assert.match(layout, /xh-splash-seen\.xh-splash-bypass/);
    assert.match(oauthCallback, /credentials: 'include'/);
    assert.match(oauthCallback, /postMessage/);
    assert.match(oauthCallback, /window\.close/);
    assert.match(starMessage, /GITHUB_STAR_MESSAGE_SOURCE/);
    assert.match(splash, /pathname\.startsWith\('\/admin'\) \|\| pathname !== '\/'/);
    assert.match(api, /GITHUB_STAR_OWNER/);
    assert.match(api, /readCookie\(request\.headers\.get\('cookie'\), GITHUB_ACCESS_TOKEN_COOKIE\)/);
    assert.match(api, /Content-Length/);
  });

  it('routes stale legacy-token failures back through OAuth instead of trapping the button', async () => {
    const [starButton, githubApi] = await Promise.all([
      readFile('components/projects/ProjectStarButton.tsx', 'utf8'),
      readFile('app/api/github/route.ts', 'utf8')
    ]);

    assert.match(starButton, /let usedLegacyToken = false/);
    assert.match(starButton, /usedLegacyToken = true/);
    assert.match(starButton, /usedLegacyToken && response\.status >= 500/);
    assert.match(starButton, /if \(usedLegacyToken\) \{\s*startGitHubOAuth\(repository, authWindow\)/);
    assert.match(githubApi, /const retryStarRequest = kind === 'star' && request\.method === 'PUT'/);
    assert.match(githubApi, /fetchGitHubRequest\(target, githubRequest, retryStarRequest\)/);
    assert.match(githubApi, /GitHub star proxy request failed after retry/);
  });

  it('protects the OAuth exchange with state, PKCE, identity validation, and HttpOnly cookies', async () => {
    const [start, exchange, oauth, env, docs, callback] = await Promise.all([
      readFile('app/api/github/oauth/start/route.ts', 'utf8'),
      readFile('app/api/github/oauth/exchange/route.ts', 'utf8'),
      readFile('lib/github-oauth.ts', 'utf8'),
      readFile('.env.example', 'utf8'),
      readFile('docs/github-comments.md', 'utf8'),
      readFile('components/github/GitHubOAuthCallback.tsx', 'utf8')
    ]);

    assert.match(start, /scope', 'public_repo'/);
    assert.match(start, /code_challenge/);
    assert.match(start, /GITHUB_OAUTH_STATE_COOKIE/);
    assert.match(exchange, /stateCookie !== payload\.state/);
    assert.match(exchange, /code_verifier: verifier/);
    assert.match(exchange, /api\.github\.com\/user/);
    assert.match(exchange, /httpOnly: true/);
    assert.match(exchange, /GITHUB_ACCESS_TOKEN_COOKIE/);
    assert.match(exchange, /GITHUB_STAR_ENDPOINT/);
    assert.match(exchange, /starGitHubRepository\(state\.owner, state\.repo, accessToken\)/);
    assert.match(exchange, /starApplied \? 'success' : 'error'/);
    assert.match(exchange, /body: ''/);
    assert.doesNotMatch(exchange, /access_token: accessToken/);
    assert.match(oauth, /timingSafeEqual/);
    assert.match(oauth, /GITHUB_OAUTH_STATE_MAX_AGE_SECONDS/);
    assert.match(env, /GITHUB_STAR_OWNER=yige66/);
    assert.match(env, /GITHUB_STAR_CALLBACK_URL=/);
    assert.match(docs, /public_repo/);
    assert.match(docs, /HttpOnly cookie/);
    assert.match(callback, /github-oauth-status/);
    assert.match(callback, /setStatus\(\{ tone: 'error'/);
    assert.doesNotMatch(callback, /visually-hidden/);
  });

  it('styles the floating star as a compact GitHub control on mobile too', async () => {
    const [css, homeOverrides, comments] = await Promise.all([
      readFile('app/globals.css', 'utf8'),
      readFile('app/home-overrides.css', 'utf8'),
      readFile('components/comments/GitHubComments.tsx', 'utf8')
    ]);
    assert.match(css, /\.github-star-floating \{/);
    assert.match(css, /\.github-star-floating \.github-star-glyph/);
    assert.match(css, /\.github-star-floating:focus-visible/);
    assert.match(css, /\.github-star-floating \{[\s\S]*?top: 96px;/);
    assert.match(css, /\.github-oauth-status \{/);
    assert.match(css, /\.github-oauth-status\.is-error/);
    assert.match(homeOverrides, /\.moment-gitalk \.gt-header-comment > \.gt-header-controls[\s\S]*grid-column: 1 !important/);
    assert.match(homeOverrides, /\.moment-gitalk \.gt-user[\s\S]*margin-left: auto !important/);
    assert.match(homeOverrides, /\.moment-gitalk \.gt-user[\s\S]*position: relative !important/);
    assert.match(homeOverrides, /\.moment-gitalk \.gt-meta \.gt-popup/);
    assert.match(homeOverrides, /\.moment-gitalk \.gt-user > \.gt-popup/);
    assert.match(comments, /installGitalkAccountPopup\(container\)/);
    assert.match(comments, /GITALK_ACCOUNT_POPUP_MANAGED_ATTR/);
    assert.match(comments, /\{ capture: true \}/);
    assert.match(comments, /loginButton\?\.click\(\)/);
    assert.match(homeOverrides, /body:has\(\.projects-page\) \.xh-floating-player/);
    assert.match(homeOverrides, /html\[data-xh-theme\]\[data-xh-theme-phase\]\[data-xh-theme-transition\] body:has\(\.projects-page\) \.xh-floating-player \{\s*display: none !important;/);
  });
});
