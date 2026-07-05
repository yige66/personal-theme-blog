import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

async function readBlogData() {
  return JSON.parse(await readFile('data/blog.json', 'utf8'));
}

describe('target-style music, friends, and GitHub comments', () => {
  it('allows the cloud music id list to be empty while keeping friend and comment settings', async () => {
    const data = await readBlogData();

    assert.ok(Array.isArray(data.site.cloudMusicIds));
    assert.deepEqual(data.site.cloudMusicIds, []);
    assert.match(data.site.friendLinkApplyFormat, /名称：/);
    assert.equal(data.site.comments.enabled, true);
    assert.equal(data.site.comments.provider, 'gitalk');
    assert.match(data.site.comments.repo, /^[\w.-]+$/);
    assert.equal(data.site.comments.owner, 'yige66');
    assert.ok(Array.isArray(data.site.comments.admin));
    assert.equal(data.site.comments.proxy, '/api/github');
    assert.doesNotMatch(JSON.stringify(data.site.comments), /clientSecret/i);
  });

  it('implements the XHBlogs-like cloud music architecture with safe input validation', async () => {
    const [layout, blogLib, provider, apiRoute, studio, cloudCard, envExample] = await Promise.all([
      readFile('app/layout.tsx', 'utf8'),
      readFile('lib/blog.ts', 'utf8'),
      readFile('components/music/MusicProvider.tsx', 'utf8'),
      readFile('app/api/music/route.ts', 'utf8'),
      readFile('components/MusicStudio.tsx', 'utf8'),
      readFile('components/music/CloudPlayerCard.tsx', 'utf8'),
      readFile('.env.example', 'utf8')
    ]);

    assert.match(layout, /cloudMusicIds=\{data\.site\.cloudMusicIds\}/);
    assert.match(blogLib, /NEXT_PUBLIC_CLOUD_MUSIC_IDS/);
    assert.match(blogLib, /const source = Array\.isArray\(value\) \? value : fallbackSite\.music/);
    assert.doesNotMatch(blogLib, /return ids\.length > 0 \? ids : fallbackSite\.cloudMusicIds/);
    assert.match(blogLib, /normalizeMusicTracks/);
    assert.match(provider, /\/api\/music\?ids=/);
    assert.match(provider, /localStorage/);
    assert.match(provider, /sessionStorage/);
    assert.match(provider, /CLOUD_CACHE_KEY/);
    assert.match(provider, /reloadCloudMusic/);
    assert.match(provider, /type PlayMode = 'list' \| 'repeat-one' \| 'shuffle'/);
    assert.match(provider, /PLAY_MODE_SEQUENCE = \['list', 'repeat-one', 'shuffle'\]/);
    assert.match(provider, /mode === 'loop' \|\| mode === 'repeat-all'[\s\S]*return 'shuffle'/);
    assert.match(provider, /handleTrackEnded/);
    assert.match(provider, /playMode === 'repeat-one'[\s\S]*replayCurrentTrack/);
    assert.match(provider, /onEnded=\{handleTrackEnded\}/);
    assert.match(provider, /remoteTracks/);
    assert.match(provider, /cloudMusicIds\.length === 0[\s\S]*setRemoteTracks\(\[\]\)/);
    assert.match(provider, /mergePlaylist/);
    assert.match(provider, /isLoading/);
    assert.match(provider, /loadError/);
    assert.match(apiRoute, /normalizeIds/);
    assert.match(apiRoute, /\^\\d\{1,20\}\$/);
    assert.match(apiRoute, /MAX_IDS = 20/);
    assert.match(apiRoute, /AbortController/);
    assert.match(apiRoute, /music\.163\.com/);
    assert.match(studio, /music-cloud-count/);
    assert.match(studio, /music-player-dock/);
    assert.match(studio, /music-dock-volume/);
    assert.match(studio, /单曲循环/);
    assert.doesNotMatch(studio, /列表循环/);
    assert.doesNotMatch(studio, /music-sync-note|Sync Cloud/);
    assert.match(cloudCard, /formatTime/);
    assert.match(cloudCard, /progress/);
    assert.match(envExample, /NEXT_PUBLIC_CLOUD_MUSIC_IDS/);
  });

  it('adds target-style Gitalk comment surfaces and a secure GitHub OAuth proxy', async () => {
    const [
      friendsPage,
      aboutPage,
      friendsClient,
      comments,
      momentComments,
      githubApi,
      blogLib,
      adminLib,
      envExample,
      postPage,
      chatterPage,
      musicPage,
      momentsPage,
      momentsBoard,
      globalCss,
      homeCss
    ] = await Promise.all([
      readFile('app/friends/page.tsx', 'utf8'),
      readFile('app/about/page.tsx', 'utf8'),
      readFile('components/FriendsBoardClient.tsx', 'utf8'),
      readFile('components/comments/GitHubComments.tsx', 'utf8'),
      readFile('components/comments/MomentComments.tsx', 'utf8'),
      readFile('app/api/github/route.ts', 'utf8'),
      readFile('lib/blog.ts', 'utf8'),
      readFile('lib/blog-admin.ts', 'utf8'),
      readFile('.env.example', 'utf8'),
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
    assert.match(friendsPage, /getPageContent\(data\.site, 'friends'\)/);
    assert.match(friendsPage, /getPageActions\(page\)/);
    assert.match(friendsPage, /GitHubComments/);
    assert.match(aboutPage, /GitHubComments/);
    assert.match(aboutPage, /about-joined-panel/);
    assert.match(aboutPage, /term="\/about"/);
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
    assert.match(comments, /Gitalk/);
    assert.match(comments, /renderGitalk/);
    assert.match(comments, /createGitalkId/);
    assert.match(comments, /substring\(0, 49\)/);
    assert.match(comments, /replace\(\/\\\/\$\/, ''\) \|\| '\/'/);
    assert.match(comments, /github-comments-shell/);
    assert.match(comments, /custom-gitalk-glass/);
    assert.match(comments, /moment-gitalk/);
    assert.match(comments, /gt-container/);
    assert.match(comments, /Gitalk 加载中/);
    assert.match(comments, /data-provider="gitalk"/);
    assert.match(momentComments, /moment-comments-shell/);
    assert.match(momentComments, /GitHubComments/);
    assert.match(comments, /cleanOAuthCodeFromUrl/);
    assert.match(comments, /proxy: config\.proxy \|\| '\/api\/github'/);
    assert.doesNotMatch(comments, /clientSecret/);
    assert.match(blogLib, /normalizeCommentConfig/);
    assert.match(blogLib, /NEXT_PUBLIC_GITALK_CLIENT_ID/);
    assert.match(blogLib, /gitalkConfigured/);
    assert.match(blogLib, /parts\.length > 1 \? parts : \['', withoutProtocol\]/);
    assert.match(adminLib, /must not store OAuth secrets/);
    assert.match(adminLib, /validateLinks/);
    assert.match(githubApi, /GITHUB_CLIENT_SECRET/);
    assert.match(githubApi, /GITALK_CLIENT_SECRET/);
    assert.match(githubApi, /not configured/);
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
    assert.match(css, /\.custom-gitalk-glass/);
    assert.match(css, /\.moment-gitalk/);
    assert.match(css, /Final comments shell frame removal/);
    assert.match(css, /:is\(\.github-comments-shell, \.friends-comments, \.moment-comment-dock, \.moment-comments-shell\),[\s\S]*background: transparent !important/);
    assert.match(css, /:is\(\.github-comments-shell, \.friends-comments, \.moment-comment-dock, \.moment-comments-shell\)::before/);
    assert.match(css, /body:has\(\.friends-page\) \.friends-comments \.github-comments-shell[\s\S]*width: 100% !important/);
    assert.match(css, /About comments panel connection/);
    assert.match(css, /\.about-page \.about-joined-panel > \.github-comments-shell/);
    assert.match(css, /Final About joined panel cleanup/);
    assert.match(css, /html\[data-xh-theme="night"\] \.custom-gitalk-glass/);
    assert.match(envExample, /NEXT_PUBLIC_GITALK_CLIENT_ID/);
    assert.match(envExample, /GITHUB_CLIENT_SECRET/);
  });

  it('hardens visitor GitHub login comments for real public use', async () => {
    const [comments, githubApi, blogLib, envExample, docs] = await Promise.all([
      readFile('components/comments/GitHubComments.tsx', 'utf8'),
      readFile('app/api/github/route.ts', 'utf8'),
      readFile('lib/blog.ts', 'utf8'),
      readFile('.env.example', 'utf8'),
      readFile('docs/github-comments.md', 'utf8')
    ]);

    assert.match(comments, /aria-live="polite"/);
    assert.match(comments, /data-comment-id=\{commentId\}/);
    assert.match(comments, /commentsEnabled && clientIsConfigured/);
    assert.match(comments, /renderGitalk/);
    assert.match(comments, /gt-btn-login/);
    assert.match(comments, /data-provider="gitalk"/);
    assert.match(comments, /custom-gitalk-glass/);
    assert.match(comments, /Gitalk 加载中/);
    assert.doesNotMatch(comments, /utterances|UTTERANCES/i);

    assert.match(githubApi, /SUPPORTED_CONTENT_TYPES/);
    assert.match(githubApi, /parseOAuthPayload/);
    assert.match(githubApi, /validateOAuthPayload/);
    assert.match(githubApi, /readAllowedClientIds/);
    assert.match(githubApi, /normalizeRedirectUri/);
    assert.match(githubApi, /isAllowedRedirectUri/);
    assert.match(githubApi, /GITALK_ALLOWED_CALLBACK_ORIGIN/);
    assert.match(githubApi, /Invalid GitHub OAuth payload/);
    assert.match(githubApi, /Unsupported GitHub OAuth proxy content type/);
    assert.match(githubApi, /GitHub OAuth client id is not configured/);
    assert.match(githubApi, /Buffer\.byteLength\(rawBody, 'utf8'\)/);
    assert.doesNotMatch(githubApi, /client_secret:\s*payload\.client_secret/);

    assert.match(blogLib, /GITALK_PROXY_PATH/);
    assert.match(blogLib, /GITHUB_COMMENTS_PROXY/);
    assert.match(blogLib, /normalizeCommentMapping/);
    assert.match(blogLib, /normalizeCommentTheme/);
    assert.match(blogLib, /normalizeGitHubLabel/);

    assert.match(envExample, /GITALK_ALLOWED_CALLBACK_ORIGIN/);
    assert.match(envExample, /GITHUB_COMMENTS_PROXY/);
    assert.match(docs, /GitHub OAuth App/);
    assert.match(docs, /Authorization callback URL/);
    assert.match(docs, /NEXT_PUBLIC_GITALK_CLIENT_ID/);
    assert.match(docs, /GITHUB_CLIENT_SECRET/);
    assert.match(docs, /Gitalk/);
    assert.match(docs, /XHSBlogComment/);
    assert.doesNotMatch(docs, /utterances/i);
    assert.match(docs, /\/api\/github/);
    assert.match(docs, /npm run check/);
  });
});
