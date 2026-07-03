import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

async function readBlogData() {
  return JSON.parse(await readFile('data/blog.json', 'utf8'));
}

describe('target-style music, friends, and GitHub comments', () => {
  it('configures cloud music, friend applications, and Gitalk login comments as site data', async () => {
    const data = await readBlogData();

    assert.ok(Array.isArray(data.site.cloudMusicIds) && data.site.cloudMusicIds.length >= 3);
    assert.match(data.site.cloudMusicIds.join(','), /^\d+(,\d+)*$/);
    assert.match(data.site.friendLinkApplyFormat, /名称：/);
    assert.equal(data.site.comments.enabled, true);
    assert.equal(data.site.comments.provider, 'gitalk');
    assert.match(data.site.comments.repo, /^[\w.-]+$/);
    assert.match(data.site.comments.owner, /^[\w.-]+$/);
    assert.ok(Array.isArray(data.site.comments.admin));
    assert.equal(data.site.comments.proxy, '/api/github');
    assert.doesNotMatch(JSON.stringify(data.site.comments), /clientSecret/i);
  });

  it('implements the XHBlogs-like cloud music architecture with safe input validation', async () => {
    const [layout, provider, apiRoute, studio, cloudCard] = await Promise.all([
      readFile('app/layout.tsx', 'utf8'),
      readFile('components/music/MusicProvider.tsx', 'utf8'),
      readFile('app/api/music/route.ts', 'utf8'),
      readFile('components/MusicStudio.tsx', 'utf8'),
      readFile('components/music/CloudPlayerCard.tsx', 'utf8')
    ]);

    assert.match(layout, /cloudMusicIds=\{data\.site\.cloudMusicIds\}/);
    assert.match(provider, /\/api\/music\?ids=/);
    assert.match(provider, /localStorage/);
    assert.match(provider, /remoteTracks/);
    assert.match(provider, /mergePlaylist/);
    assert.match(provider, /isLoading/);
    assert.match(provider, /loadError/);
    assert.match(apiRoute, /normalizeIds/);
    assert.match(apiRoute, /\^\\d\{1,20\}\$/);
    assert.match(apiRoute, /MAX_IDS = 20/);
    assert.match(apiRoute, /AbortController/);
    assert.match(apiRoute, /music\.163\.com/);
    assert.match(studio, /music-cloud-count/);
    assert.match(studio, /music-sync-note/);
    assert.match(cloudCard, /formatTime/);
    assert.match(cloudCard, /progress/);
  });

  it('adds target-style Gitalk comment surfaces and a secure GitHub OAuth proxy', async () => {
    const [
      friendsPage,
      friendsClient,
      comments,
      momentComments,
      githubApi,
      postPage,
      chatterPage,
      musicPage,
      momentsPage,
      momentsBoard,
      globalCss,
      homeCss
    ] = await Promise.all([
      readFile('app/friends/page.tsx', 'utf8'),
      readFile('components/FriendsBoardClient.tsx', 'utf8'),
      readFile('components/comments/GitHubComments.tsx', 'utf8'),
      readFile('components/comments/MomentComments.tsx', 'utf8'),
      readFile('app/api/github/route.ts', 'utf8'),
      readFile('app/posts/[slug]/page.tsx', 'utf8'),
      readFile('app/chatter/[slug]/page.tsx', 'utf8'),
      readFile('app/music/page.tsx', 'utf8'),
      readFile('app/moments/page.tsx', 'utf8'),
      readFile('components/MomentsBoard.tsx', 'utf8'),
      readFile('app/globals.css', 'utf8'),
      readFile('app/home-overrides.css', 'utf8')
    ]);
    const css = `${globalCss}\n${homeCss}`;

    assert.match(friendsPage, /FriendsBoardClient/);
    assert.match(friendsPage, /云端引力/);
    assert.match(friendsPage, /GitHubComments/);
    assert.match(friendsClient, /friends-board-grid/);
    assert.match(friendsClient, /friend-node-card/);
    assert.match(friendsClient, /navigator\.clipboard\.writeText/);
    assert.match(friendsClient, /friend-apply-console/);
    assert.match(friendsClient, /建立神经连接/);
    assert.match(friendsClient, /#gitalk-container/);
    assert.doesNotMatch(friendsClient, /friends-command-panel|friend-filter-rail|friend-constellation-stage|friend-star-node|--node-inverse/);
    assert.match(comments, /gitalk@1\.8\.0/);
    assert.match(comments, /GITALK_SCRIPT_SRC/);
    assert.match(comments, /GITALK_STYLE_HREF/);
    assert.match(comments, /VALID_NAME/);
    assert.match(comments, /useState\(true\)/);
    assert.match(comments, /github-comments-loader/);
    assert.match(comments, /Gitalk/);
    assert.match(comments, /createGitalkId/);
    assert.match(comments, /substring\(0, 49\)/);
    assert.match(comments, /replace\(\/\\\/\$\/, ''\) \|\| '\/'/);
    assert.match(comments, /GitHub Login Comments/);
    assert.match(comments, /github-comments-shell/);
    assert.match(comments, /custom-gitalk-glass/);
    assert.match(comments, /moment-gitalk/);
    assert.match(momentComments, /moment-comments-shell/);
    assert.match(momentComments, /GitHubComments/);
    assert.match(comments, /cleanOAuthCodeFromUrl/);
    assert.match(comments, /proxy: config\.proxy \|\| '\/api\/github'/);
    assert.doesNotMatch(comments, /clientSecret/);
    assert.match(githubApi, /GITHUB_CLIENT_SECRET/);
    assert.match(githubApi, /GITALK_CLIENT_SECRET/);
    assert.match(githubApi, /https:\/\/github\.com\/login\/oauth\/access_token/);
    assert.match(githubApi, /MAX_BODY_LENGTH/);
    assert.match(githubApi, /client_secret/);
    assert.doesNotMatch(githubApi, /console\.log|console\.error/);
    assert.match(postPage, /GitHubComments/);
    assert.match(chatterPage, /GitHubComments/);
    assert.match(musicPage, /GitHubComments/);
    assert.match(momentsPage, /comments=\{data\.site\.comments\}/);
    assert.match(momentsBoard, /MomentComments/);
    assert.match(css, /\.friend-apply-console/);
    assert.doesNotMatch(css, /\.friends-command-panel/);
    assert.doesNotMatch(css, /\.friend-filter-rail/);
    assert.doesNotMatch(css, /\.friend-constellation-stage/);
    assert.doesNotMatch(css, /\.friend-star-node/);
    assert.match(css, /\.github-comments-card/);
    assert.match(css, /\.github-comments-loader/);
    assert.match(css, /\.custom-gitalk-glass/);
    assert.match(css, /\.moment-gitalk/);
    assert.match(css, /Final comments shell frame removal/);
    assert.match(css, /:is\(\.github-comments-shell, \.friends-comments, \.moment-comment-dock, \.moment-comments-shell\),[\s\S]*background: transparent !important/);
    assert.match(css, /:is\(\.github-comments-shell, \.friends-comments, \.moment-comment-dock, \.moment-comments-shell\)::before/);
    assert.match(css, /body:has\(\.friends-page\) \.friends-comments \.github-comments-shell[\s\S]*width: 100% !important/);
    assert.match(css, /html\[data-xh-theme="night"\] \.custom-gitalk-glass/);
  });
});
