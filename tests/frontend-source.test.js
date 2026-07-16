import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

describe('target-inspired homepage portal', () => {
  it('keeps the homepage profile window controlled by site profile fields', async () => {
    const [page, homeWorld, adminConfig] = await Promise.all([
      readFile('app/page.tsx', 'utf8'),
      readFile('components/HomeWorld.tsx', 'utf8'),
      readFile('components/admin/adminConfig.ts', 'utf8')
    ]);

    assert.match(page, /export const dynamic = 'force-dynamic'/);
    assert.match(adminConfig, /path: \['site', 'title'\]/);
    assert.match(adminConfig, /path: \['site', 'subtitle'\]/);
    assert.match(homeWorld, /<h1>\{data\.site\.title\}<\/h1>/);
    assert.match(homeWorld, /data\.site\.subtitle \|\| data\.site\.bio \|\| data\.site\.motto/);
    assert.doesNotMatch(homeWorld, /data\.site\.owner \|\| data\.site\.title/);
  });
  it('keeps the homepage as the normal route ecosystem outside the game start shell', async () => {
    const [
      page,
      homeWorld,
      layout,
      nav,
      spaceDock,
      portalSearch,
      portalIndex,
      musicProvider,
      cloudPlayer,
      lyricStrip,
      siteDashboard,
      latestCarousel,
      themeSceneCard,
      experience,
      globalCss,
      homeCss
    ] = await Promise.all([
      readFile('app/page.tsx', 'utf8'),
      readFile('components/HomeWorld.tsx', 'utf8'),
      readFile('app/layout.tsx', 'utf8'),
      readFile('components/SiteNav.tsx', 'utf8'),
      readFile('components/SpaceDock.tsx', 'utf8'),
      readFile('components/PortalSearch.tsx', 'utf8'),
      readFile('lib/portal-index.ts', 'utf8'),
      readFile('components/music/MusicProvider.tsx', 'utf8'),
      readFile('components/music/CloudPlayerCard.tsx', 'utf8'),
      readFile('components/music/LyricStrip.tsx', 'utf8'),
      readFile('components/SiteDashboard.tsx', 'utf8'),
      readFile('components/LatestPostCarousel.tsx', 'utf8'),
      readFile('components/ThemeSceneCard.tsx', 'utf8'),
      readFile('lib/experience.ts', 'utf8'),
      readFile('app/globals.css', 'utf8'),
      readFile('app/home-overrides.css', 'utf8')
    ]);
    const css = `${globalCss}\n${homeCss}`;
    const brandAfterRule = css.match(/\.top-nav \.brand span::after\s*\{[\s\S]*?\}/)?.[0] ?? '';

    assert.match(page, /HomeWorld/);
    assert.match(page, /createPortalSearchEntries/);
    assert.doesNotMatch(homeWorld, /HomeEntranceStage/);
    assert.doesNotMatch(homeWorld, /xh-clean-home__entry/);
    assert.match(homeWorld, /PortalSearch/);
    assert.doesNotMatch(homeWorld, /SpaceDock/);
    assert.match(homeWorld, /CloudPlayerCard/);
    assert.match(homeWorld, /LyricStrip/);
    assert.match(homeWorld, /getPageContent\(data\.site, 'home'\)/);
    assert.match(homeWorld, /getPageActions\(homePage\)/);
    assert.match(homeWorld, /getPageStatLabel\(homePage/);
    assert.match(homeWorld, /SiteDashboard/);
    assert.match(homeWorld, /LatestPostCarousel/);
    assert.match(homeWorld, /ThemeSceneCard/);
    assert.match(homeWorld, /xh-clean-home/);
    assert.match(homeWorld, /xh-clean-home__grid/);
    assert.match(homeWorld, /xh-clean-home__identity/);
    assert.match(homeWorld, /xh-clean-home__showcase/);
    assert.match(homeWorld, /xh-clean-home__media/);
    assert.match(homeWorld, /xh-clean-home__mini-grid/);
    assert.match(homeWorld, /xh-clean-routes/);
    assert.match(homeWorld, /xh-clean-route/);
    assert.match(homeWorld, /function getSpotlightCount\(id: string, stats: BlogStats\)/);
    assert.match(homeWorld, /archive: stats\.posts/);
    assert.match(homeWorld, /photowall: stats\.gallery/);
    assert.match(homeWorld, /music: stats\.tracks/);
    assert.match(homeWorld, /chatter: stats\.chatters/);
    assert.match(homeWorld, /friends: stats\.links/);
    assert.match(homeWorld, /getSpotlightColumns\(data, stats\)/);
    assert.doesNotMatch(homeWorld, /xh-home-bottom-grid/);
    assert.doesNotMatch(homeWorld, /xh-home-world|xh-home-minimal|xh-home-row-primary|xh-home-row-secondary|xh-clean-feature|xh-clean-feed/);
    assert.match(homeWorld, /photowall/);
    assert.match(homeWorld, /friends/);
    assert.match(homeWorld, /chatter/);
    assert.match(homeWorld, /archive/);
    assert.doesNotMatch(homeWorld, /timeline/);
    assert.match(homeWorld, /music/);
    assert.doesNotMatch(homeWorld, /\/tree|??|Tree Lab|is-tree/);
    assert.doesNotMatch(homeWorld, /RoomConsole/);
    assert.doesNotMatch(homeWorld, /xh-home-room-deck/);
    assert.doesNotMatch(page, /ExperienceShowcase|ArticleExplorer|post-teasers|projects-section|gallery-section|links-section/);

    assert.match(spaceDock, /xh-space-dock/);
    assert.match(spaceDock, /createSpaceModules/);
    assert.match(spaceDock, /createSpaceSignals/);
    assert.match(spaceDock, /experienceRoutes/);
    assert.match(spaceDock, /Portal Index/);
    assert.match(spaceDock, /????/);
    assert.match(portalSearch, /searchPortal/);
    assert.match(portalSearch, /highlightMatchedText/);
    assert.match(portalSearch, /portal-channel-grid/);
    assert.match(portalIndex, /createPortalSearchEntries/);
    assert.match(portalIndex, /createPortalChannels/);
    assert.match(portalIndex, /scoreEntry/);
    assert.match(layout, /MusicProvider/);
    assert.match(layout, /BackgroundSlider/);
    assert.match(layout, /HomeEffects/);
    assert.match(layout, /SplashScreen/);
    assert.match(layout, /xh-app-root/);
    assert.match(layout, /xh-splash-seen/);
    assert.match(layout, /TasteMotion/);
    assert.match(layout, /GlobalToolbox/);
    assert.match(musicProvider, /currentTrack/);
    assert.match(musicProvider, /selectTrack/);
    assert.match(musicProvider, /togglePlaying/);
    assert.match(musicProvider, /togglePlayMode/);
    assert.match(musicProvider, /shuffle/);
    assert.match(cloudPlayer, /xh-cloud-player-card/);
    assert.match(cloudPlayer, /useMusic/);
    assert.match(lyricStrip, /xh-lyric-strip/);
    assert.match(lyricStrip, /currentLyric/);
    assert.match(lyricStrip, /xh-lyric-caption/);
    assert.match(lyricStrip, /xh-lyric-text/);
    assert.match(lyricStrip, /data-playing=\{isPlaying \? 'true' : 'false'\}/);
    assert.doesNotMatch(lyricStrip, /currentTrack|xh-lyric-meta|Local Playlist/);
    assert.match(css, /xh-lyric-strip\[data-playing="false"\] \.xh-lyric-caption/);
    assert.match(css, /@keyframes xh-lyric-caption-in/);
    assert.match(css, /@keyframes xh-lyric-caption-sweep/);
    assert.match(css, /-webkit-text-fill-color: transparent/);
    assert.match(css, /-webkit-text-stroke: 0\.35px/);
    assert.match(css, /@keyframes xh-lyric-text-glow/);
    assert.match(css, /xh-lyric-strip\[data-playing="true"\] \.xh-lyric-text/);
    assert.doesNotMatch(css, /@keyframes xh-lyric\s*\{/);
    assert.match(latestCarousel, /xh-latest-card/);
    assert.match(latestCarousel, /xh-latest-carousel/);
    assert.match(latestCarousel, /xh-latest-main-link/);
    assert.match(latestCarousel, /setInterval/);
    assert.match(latestCarousel, /stopPropagation/);
    assert.match(latestCarousel, /aria-current/);
    assert.match(themeSceneCard, /xh-theme-scene-card/);
    assert.match(themeSceneCard, /xh-toggle-theme/);
    assert.match(themeSceneCard, /MutationObserver/);
    assert.match(themeSceneCard, /data-theme-phase/);
    assert.match(themeSceneCard, /data-transitioning/);
    assert.match(themeSceneCard, /xh-theme-orb-scene/);
    assert.match(siteDashboard, /xh-site-dashboard/);
    assert.match(siteDashboard, /xh-dashboard-meta/);
    assert.match(siteDashboard, /formatUptime/);
    assert.match(siteDashboard, /xh-clock-caption/);
    assert.match(siteDashboard, /xh-clock-digit/);
    assert.doesNotMatch(siteDashboard, /????|formatLocation|????|data\.site\.location|data\.site\.assistantName/);
    assert.doesNotMatch(siteDashboard, /xh-dashboard-badges|createDashboardBadges|badges\.map/);
    assert.match(siteDashboard, /Next\.js 16/);
    assert.match(siteDashboard, /React 19/);
    assert.match(siteDashboard, /CSS ??/);
    assert.doesNotMatch(siteDashboard, /xh-dashboard-icp|ICP?|?ICP?|20260240/);
    assert.doesNotMatch(siteDashboard, /Local Time|POSTS|WORDS|PROJECTS|RADIO|\$\{data\.site\.streak\} days/);
    assert.match(siteDashboard, /setInterval/);
    assert.match(experience, /experienceRoutes/);
    assert.match(experience, /photowall/);
    assert.match(experience, /friends/);
    assert.doesNotMatch(experience, /timeline|\/timeline/);
    assert.doesNotMatch(experience, /id: 'tree'|\/tree|??/);
    assert.match(nav, /className=\{active \? 'active' : ''\}/);
    assert.match(nav, /mobile-orbit-toggle/);
    assert.match(nav, /mobile-orbit-panel/);
    assert.match(nav, /aria-expanded=\{menuOpen\}/);
    assert.match(nav, /orbitRotation/);
    assert.match(nav, /onPointerMove/);
    assert.match(nav, /brandSuffix/);
    assert.match(nav, /data-brand-suffix/);

    assert.match(css, /\.xh-clean-home/);
    assert.match(css, /\.xh-clean-home__grid/);
    assert.match(css, /\.xh-clean-home__identity/);
    assert.match(css, /\.xh-clean-home__showcase/);
    assert.match(css, /\.xh-clean-home__mini-grid/);
    assert.match(css, /\.xh-clean-home__posts \.xh-latest-carousel-copy/);
    assert.match(css, /\.xh-clean-home__posts \.xh-latest-card[\s\S]*grid-area: auto !important/);
    assert.match(css, /\.xh-clean-routes/);
    assert.match(css, /\.xh-clean-route/);
    assert.match(css, /--xh-panel: rgba\(236, 205, 225, 0\.32\)/);
    assert.match(css, /"main"/);
    assert.match(css, /\.portal-search/);
    assert.match(css, /\.xh-portal-grid/);
    assert.match(css, /\.xh-space-dock/);
    assert.match(css, /\.xh-cloud-player-card/);
    assert.match(css, /Card player icons are text glyphs, not nested circular controls\./);
    assert.match(css, /\.xh-player-controls button > span/);
    assert.match(css, /background: transparent !important/);
    assert.match(css, /box-shadow: none !important/);
    assert.match(css, /pointer-events: none !important/);
    assert.match(css, /\.xh-latest-carousel/);
    assert.match(css, /\.xh-latest-card\.xh-latest-carousel \{[\s\S]*aspect-ratio: auto !important;[\s\S]*height: clamp\(500px, 55vh, 620px\) !important/);
    assert.match(css, /\.xh-latest-card\.xh-latest-carousel > img,[\s\S]*min-height: 100% !important;[\s\S]*object-fit: cover !important/);
    assert.match(css, /@media \(max-width: 760px\)[\s\S]*\.xh-clean-home__posts \.xh-latest-card\.xh-latest-carousel[\s\S]*height: max\(535px, calc\(100svh - 48px\)\) !important/);
    assert.match(css, /@media \(min-width: 821px\)[\s\S]*\.xh-clean-home__posts,[\s\S]*\.xh-clean-home__posts \.xh-latest-card\.xh-latest-carousel,[\s\S]*\.xh-clean-home__media \{[\s\S]*height: clamp\(520px, 36vw, 600px\) !important;[\s\S]*min-height: 0 !important/);
    assert.match(css, /\.xh-carousel-dots button[\s\S]*min-width: 32px !important;[\s\S]*min-height: 32px !important/);
    assert.match(css, /\.xh-carousel-dots button::after[\s\S]*width: 10px !important;[\s\S]*height: 10px !important/);
    assert.match(css, /\.xh-clean-home__media \{[\s\S]*grid-template-rows: minmax\(230px, 0\.92fr\) minmax\(240px, 1fr\) !important/);
    assert.match(css, /\.xh-clean-home__mini-grid \{[\s\S]*height: auto !important;[\s\S]*min-height: 0 !important/);
    assert.match(css, /\.xh-dashboard-clock/);
    assert.match(css, /\.xh-clean-dashboard \.xh-clock-caption/);
    assert.match(css, /\.xh-clean-dashboard \.xh-clock-digit/);
    assert.match(css, /grid-template-columns: minmax\(290px, 360px\)/);
    assert.match(css, /\.xh-dashboard-clock > span[\s\S]*display: none !important/);
    assert.match(css, /@keyframes xh-dashboard-large-digit-tick/);
    assert.doesNotMatch(css, /\.xh-clean-dashboard \.xh-dashboard-icp|text-decoration-style: dashed/);
    assert.match(css, /@keyframes xh-event-clock-scan/);
    assert.match(css, /@keyframes xh-dashboard-clock-ring/);
    assert.match(css, /@keyframes xh-dashboard-clock-hand/);
    assert.match(css, /@keyframes xh-dashboard-digit-tick/);
    assert.match(css, /@keyframes xh-dashboard-colon-pulse/);
    assert.match(brandAfterRule, /content: attr\(data-brand-suffix\)/);
    assert.doesNotMatch(brandAfterRule, /????/);
  });

  it('loads project cards from GitHub and opens repository pages from project cards', async () => {
    const [projectsPage, showcase, githubProjects, portalIndex, blog, homeCss, iconAttribution] = await Promise.all([
      readFile('app/projects/page.tsx', 'utf8'),
      readFile('components/channels/ProjectShowcase.tsx', 'utf8'),
      readFile('lib/github-projects.ts', 'utf8'),
      readFile('lib/portal-index.ts', 'utf8'),
      readFile('lib/blog.ts', 'utf8'),
      readFile('app/home-overrides.css', 'utf8'),
      readFile('public/assets/project-icons/ATTRIBUTION.md', 'utf8')
    ]);

    assert.match(projectsPage, /getGithubProjects/);
    assert.match(projectsPage, /githubProjects\.projects/);
    assert.match(projectsPage, /source=\{githubProjects\}/);
    assert.match(githubProjects, /api\.github\.com\/users\/\$\{username\}\/repos/);
    assert.match(githubProjects, /GITHUB_PROJECTS_OWNER/);
    assert.match(githubProjects, /GITHUB_PROJECTS_TOKEN/);
    assert.match(githubProjects, /GITHUB_PROJECTS_CACHE_TAG/);
    assert.match(githubProjects, /githubProjectOwnerCacheTag/);
    assert.match(githubProjects, /tags: \[GITHUB_PROJECTS_CACHE_TAG, githubProjectOwnerCacheTag\(username\)\]/);
    assert.match(githubProjects, /Pick<BlogSite, 'github' \| 'projectOrder'>/);
    assert.match(githubProjects, /applyProjectOrder/);
    assert.match(githubProjects, /normalizeProjectReference/);
    assert.match(githubProjects, /html_url/);
    assert.match(githubProjects, /url: repoUrl/);
    assert.match(githubProjects, /repo: repoUrl/);
    assert.match(githubProjects, /title: name/);
    assert.doesNotMatch(githubProjects, /title: fallback\?\.title \|\| name/);
    assert.match(githubProjects, /startedAt: updatedAt \|\| createdAt/);
    assert.match(githubProjects, /source: 'fallback'/);
    assert.match(githubProjects, /isProjectPageProject/);
    assert.match(githubProjects, /INTRODUCTION_ONLY_PROJECT_NAMES/);
    assert.match(showcase, /project\.repo \|\| project\.url \|\| '#'/);
    assert.match(showcase, /className="project-matrix-card"/);
    assert.match(showcase, /function GitHubGlyph/);
    assert.match(showcase, /getProjectVisualIcon/);
    assert.match(showcase, /pickProjectIcon/);
    assert.match(showcase, /createProjectVisualMap/);
    assert.match(showcase, /recentIcons/);
    assert.match(showcase, /usageDifference/);
    assert.match(showcase, /usage\.set/);
    assert.match(showcase, /ProjectAnimeIcon/);
    assert.match(showcase, /projectVisualIcons/);
    assert.match(showcase, /const projectVisualIcons: ProjectVisualIcon\[\] = \['sabres', 'lantern', 'flower', 'moon', 'compass'\]/);
    assert.match(showcase, /project-wax-seal/);
    assert.match(showcase, /project-wax-seal-frame/);
    assert.match(showcase, /project-rpg-glyph/);
    assert.match(showcase, /project-wax-seal-sabres/);
    assert.match(showcase, /project-wax-seal-moon/);
    assert.match(showcase, /project-wax-seal-lantern/);
    assert.match(showcase, /project-wax-seal-flower/);
    assert.match(showcase, /project-wax-seal-compass/);
    assert.doesNotMatch(showcase, /sabresAlt/);
    assert.doesNotMatch(showcase, /project-wax-seal-sabres-alt/);
    assert.doesNotMatch(showcase, /project-wax-seal-star/);
    assert.doesNotMatch(showcase, /project-wax-seal-flower-star/);
    assert.doesNotMatch(showcase, /project-wax-seal-sparkles/);
    assert.doesNotMatch(showcase, /project-wax-seal-shield/);
    assert.doesNotMatch(showcase, /project-wax-seal-ice/);
    assert.doesNotMatch(showcase, /project-wax-seal-crystal/);
    assert.doesNotMatch(showcase, /project-rpg-icon/);
    assert.doesNotMatch(showcase, /ProjectCrestGlyph/);
    assert.doesNotMatch(showcase, /project-wax-emblem/);
    assert.doesNotMatch(showcase, /anime-badge-frame/);
    assert.doesNotMatch(showcase, /snow-badge-field/);
    assert.doesNotMatch(showcase, /sakura-badge-field/);
    assert.doesNotMatch(showcase, /project-source-note/);
    assert.doesNotMatch(showcase, /<p className="eyebrow">\{page\.eyebrow\}<\/p>/);
    assert.match(showcase, /?? GitHub/);
    assert.doesNotMatch(showcase, /<article className="project-matrix-card"/);
    assert.match(portalIndex, /href: project\.repo \|\| project\.url \|\| '\/projects'/);
    assert.match(blog, /projectOrder: string\[\]/);
    assert.match(blog, /projectOrder: normalizeProjectOrder\(siteInput\.projectOrder\)/);
    assert.match(blog, /?? GitHub ?????????/);
    assert.doesNotMatch(homeCss, /\.project-source-note/);
    assert.match(homeCss, /\.project-anime-icon/);
    assert.match(homeCss, /\.project-wax-seal/);
    assert.match(homeCss, /\.project-wax-seal-frame/);
    assert.match(homeCss, /\.project-wax-seal-frame::before/);
    assert.match(homeCss, /repeating-conic-gradient/);
    assert.match(homeCss, /\.project-rpg-glyph/);
    assert.match(homeCss, /project-icons\/plain-circle\.svg/);
    assert.match(homeCss, /project-icons\/crossed-sabres\.svg/);
    assert.match(homeCss, /project-icons\/lantern\.svg/);
    assert.match(homeCss, /project-icons\/flower-emblem\.svg/);
    assert.match(homeCss, /project-icons\/moon-orbit\.svg/);
    assert.match(homeCss, /project-icons\/compass\.svg/);
    assert.doesNotMatch(homeCss, /\.project-wax-seal-sabres-alt/);
    assert.match(iconAttribution, /plain-circle\.svg/);
    assert.match(iconAttribution, /crossed-sabres\.svg/);
    assert.match(iconAttribution, /Creative Commons Attribution 3\.0/);
    assert.doesNotMatch(homeCss, /\.project-rpg-icon/);
    assert.doesNotMatch(homeCss, /\.project-wax-emblem/);
    assert.doesNotMatch(homeCss, /project-icons\/checked-shield\.svg/);
    assert.doesNotMatch(homeCss, /project-icons\/ice-spell\.svg/);
    assert.doesNotMatch(homeCss, /project-icons\/crystal-growth\.svg/);
    assert.doesNotMatch(homeCss, /project-icons\/flower-star\.svg/);
    assert.doesNotMatch(homeCss, /project-icons\/round-star\.svg/);
    assert.doesNotMatch(homeCss, /project-icons\/sparkles\.svg/);
    assert.doesNotMatch(homeCss, /project-icons\/katana\.svg/);
    assert.match(homeCss, /font-size: clamp\(12px, 0\.78vw, 14px\)/);
    assert.match(homeCss, /width: min\(1280px, 100%\)/);
    assert.match(homeCss, /width: min\(1608px, calc\(100% - 48px\)\)/);
    assert.match(homeCss, /width: min\(1508px, 100%\)/);
    assert.match(homeCss, /\.project-matrix-card::before/);
    assert.match(homeCss, /\.project-repo-link svg/);
    assert.match(homeCss, /\.project-matrix-actions span/);
  });

  it('keeps GitHub project starring separate from the project card link', async () => {
    const [showcase, starButton, githubApi, homeCss] = await Promise.all([
      readFile('components/channels/ProjectShowcase.tsx', 'utf8'),
      readFile('components/projects/ProjectStarButton.tsx', 'utf8'),
      readFile('app/api/github/route.ts', 'utf8'),
      readFile('app/home-overrides.css', 'utf8')
    ]);

    assert.match(showcase, /ProjectStarButton/);
    assert.match(showcase, /project-matrix-card-shell/);
    assert.match(starButton, /gitalk-token/);
    assert.match(starButton, /authPrompt/);
    assert.match(starButton, /project-star-login-dialog/);
    assert.match(starButton, /???? GitHub ??? Star/);
    assert.match(starButton, /getGitHubLoginUrl/);
    assert.match(starButton, /method: 'PUT'/);
    assert.match(starButton, /user\/starred/);
    assert.match(githubApi, /export async function PUT/);
    assert.match(githubApi, /isStarRequest/);
    assert.match(homeCss, /\.project-star-button/);
    assert.match(homeCss, /\.project-matrix-card-shell/);
  });

  it('implements a full source-level game start shell for the splash layer', async () => {
    const [splash, effects, entryCss] = await Promise.all([
      readFile('components/SplashScreen.tsx', 'utf8'),
      readFile('components/splashEffects.ts', 'utf8'),
      readFile('app/entry-overrides.css', 'utf8')
    ]);

    assert.match(splash, /personal-theme-blog:splash-seen/);
    assert.match(splash, /splashLayoutArchitecture/);
    assert.match(splash, /entryOnly: true/);
    assert.match(splash, /enterBlog/);
    assert.match(splash, /entryOriginal/);
    assert.match(splash, /entryBeyond/);
    assert.match(splash, /entryOriginal\.eyebrow/);
    assert.match(splash, /entryBeyond\.eyebrowHighlight/);
    assert.match(splash, /startRainCanvas/);
    assert.match(splash, /ib-game-start/);
    assert.match(splash, /ib-game-preloader/);
    assert.match(splash, /ib-game-bg-internal/);
    assert.match(splash, /id="rain-container"/);
    assert.match(splash, /ib-game-rain-canvas/);
    assert.match(splash, /ib-game-flow-veil/);
    assert.match(splash, /ib-game-wordmark/);
    assert.match(splash, /ib-game-note/);
    assert.match(splash, /ib-game-action-btn/);
    assert.match(splash, /is-dissolving/);
    assert.match(splash, /const entry = site\.entry/);
    assert.match(splash, /entry\.preloaderTitle/);
    assert.match(splash, /entry\.preloaderSubtitle/);
    assert.match(splash, /entry\.enterButton/);
    assert.match(splash, /entry\.original/);
    assert.match(splash, /entry\.beyond/);
    assert.doesNotMatch(splash, /startInteractions|startModules|startMenuActions|ambientMeters|startOutfits/);
    assert.doesNotMatch(splash, /selectedInteraction|activeModule|selectedOutfit|characterPose/);
    assert.doesNotMatch(splash, /ib-game-stage-shell|ib-game-viewport|ib-game-hotspot|ib-game-dialogue/);
    assert.doesNotMatch(splash, /ib-game-module-panel|ib-game-floating-tools|ib-game-mini-room|ib-game-pet-window|ib-game-console/);
    assert.doesNotMatch(splash, /bg-internal\.jpg|bg-infernal\.jpg|game_module|room_day\.png|room_night\.png/);
    assert.doesNotMatch(splash, /const startCopy/);
    assert.match(splash, /startGlassCanvas/);
    assert.match(splash, /startRainRipple/);
    assert.match(splash, /waterRipples/);
    assert.match(splash, /glassScratches/);
    assert.match(splash, /ib-game-welcome-window/);
    assert.match(splash, /ib-game-water-surface/);
    assert.match(splash, /ib-game-glass-scratches/);
    assert.match(splash, /ib-game-ripple-bg/);
    assert.match(splash, /gw-slot/);
    assert.match(splash, /gw-pane/);
    assert.match(splash, /gw-ripple/);
    assert.match(splash, /gw-fogwipe/);
    assert.match(splash, /gw-draw/);
    assert.match(splash, /gw-toggle/);
    assert.match(splash, /gw-ctrl/);
    assert.match(splash, /gw-therms/);
    assert.doesNotMatch(splash, /ib-game-shell-grid/);
    assert.doesNotMatch(splash, /Now Loading\.\.\./);
    assert.doesNotMatch(splash, /preparing your space/);
    assert.doesNotMatch(splash, />Enter Site</);
    assert.doesNotMatch(splash, />ENTRY LOG</);

    assert.match(effects, /export function startRainCanvas/);
    assert.match(effects, /export function startGlassCanvas/);
    assert.match(effects, /export function startRainRipple/);
    assert.match(effects, /document\.createElement\('canvas'\)/);
    assert.match(effects, /for \(let i = 0; i < 45; i \+= 1\)/);
    assert.match(effects, /Float32Array/);
    assert.match(effects, /getImageData/);
    assert.match(effects, /destination-out/);
    assert.match(effects, /requestAnimationFrame/);
    assert.match(effects, /pointerdown/);
    assert.match(effects, /gwToggle/);
    assert.match(effects, /makeTherm/);
    assert.match(effects, /gw-tool-pen/);
    assert.match(effects, /gw-tool-finger/);
    assert.match(effects, /gw-clear/);
    assert.match(effects, /gw-therm-fog/);
    assert.match(effects, /gw-therm-brush/);
    assert.match(effects, /FOG|fogDepth/);
    assert.match(effects, /gw-exit/);
    assert.match(effects, /gw-off/);
    assert.match(effects, /gw-rippling/);
    assert.match(effects, /rain-visible/);

    assert.match(entryCss, /\.ib-game-start/);
    assert.match(entryCss, /\.ib-game-start\.is-dissolving/);
    assert.match(entryCss, /\.ib-game-rain-canvas/);
    assert.match(entryCss, /\.ib-game-rain-canvas canvas/);
    assert.match(entryCss, /\.ib-game-flow-veil/);
    assert.match(entryCss, /\.ib-game-wordmark/);
    assert.match(entryCss, /\.ib-game-note/);
    assert.match(entryCss, /max-width: 900px/);
    assert.match(splash, /ib-game-art-pane/);
    assert.match(splash, /ib-game-water-canvas/);
    assert.match(splash, /ib-game-fog-wipe/);
    assert.match(splash, /ib-game-draw/);
    assert.match(splash, /gw-grade-c/);
    assert.match(splash, /gw-grade-s/);
    assert.match(splash, /gw-frost/);
    assert.match(splash, /gw-scratch/);
    assert.match(splash, /gw-tool-finger/);
    assert.match(splash, /gw-tool-pen/);
    assert.match(splash, /gw-clear/);
    assert.doesNotMatch(entryCss, /\.ib-game-meter-panel|\.ib-game-start-menu|\.ib-game-stage-shell|\.ib-game-viewport/);
    assert.doesNotMatch(entryCss, /\.ib-game-room-object|\.ib-game-hotspot|\.ib-game-dialogue|\.ib-game-module-panel/);
    assert.doesNotMatch(entryCss, /\.ib-game-floating-tools|\.ib-game-mini-room|\.ib-game-pet-window|\.ib-game-console/);
    assert.match(entryCss, /@keyframes ib-game-water-drift/);
    assert.match(entryCss, /@keyframes ib-game-water-ripple/);
    assert.match(entryCss, /@keyframes ib-game-water-caustic/);
    assert.match(entryCss, /@keyframes ib-game-glass-scratch-glint/);
    assert.match(entryCss, /@keyframes ib-game-glass-scratch-shiver/);
    assert.match(entryCss, /@keyframes ib-game-fog-wipe/);
    assert.doesNotMatch(entryCss, /InternalBeyond|bg-internal\.jpg|bg-infernal\.jpg|game_module|room_day\.png|room_night\.png/);
  });

  it('implements background layers and day/night transition states', async () => {
    const [layout, background, component, toolbox, motion, blog, blogData, globalCss, homeCss, entryCss] = await Promise.all([
      readFile('app/layout.tsx', 'utf8'),
      readFile('components/BackgroundSlider.tsx', 'utf8'),
      readFile('components/HomeEffects.tsx', 'utf8'),
      readFile('components/GlobalToolbox.tsx', 'utf8'),
      readFile('components/TasteMotion.tsx', 'utf8'),
      readFile('lib/blog.ts', 'utf8'),
      readFile('data/blog.json', 'utf8'),
      readFile('app/globals.css', 'utf8'),
      readFile('app/home-overrides.css', 'utf8'),
      readFile('app/entry-overrides.css', 'utf8')
    ]);
    const css = `${globalCss}\n${homeCss}`;

    assert.match(layout, /<BackgroundSlider site=\{data\.site\} \/>/);
    assert.match(layout, /<HomeEffects site=\{data\.site\} posts=\{posts\} notes=\{data\.notes\} \/>/);
    assert.match(background, /xh-background-slider/);
    assert.match(background, /BACKGROUND_FADE_MS = 1800/);
    assert.match(background, /exitingIndex/);
    assert.match(background, /is-exiting/);
    assert.match(background, /themeTransitionActive/);
    assert.match(background, /document\.documentElement\.dataset\.xhThemeTransition === 'active'/);
    assert.match(background, /document\.documentElement\.dataset\.xhThemeNext === 'night' \? 'night' : 'day'/);
    assert.match(background, /setExitingIndex\(null\)/);
    assert.match(background, /is-theme-transitioning/);
    assert.match(background, /data-theme-transitioning/);
    assert.match(background, /!themeTransitionActive && index === exitingIndex/);
    assert.match(background, /MutationObserver/);
    assert.match(background, /parseSeason/);
    assert.match(background, /root\.dataset\.xhSeasonTransition === 'active'/);
    assert.match(background, /root\.dataset\.xhSeasonNext/);
    assert.doesNotMatch(background, /root\.dataset\.xhSeasonPrevious \|\| root\.dataset\.xhSeason/);
    assert.match(background, /'data-xh-season-settle'/);
    assert.match(background, /data-scene-theme/);
    assert.match(background, /ib-scene-shell/);
    assert.match(background, /ib-scene-day/);
    assert.match(background, /ib-scene-night/);
    assert.doesNotMatch(background, /ib-desk-line/);
    assert.doesNotMatch(background, /ib-window-grid|ib-glass-refraction|const panes/);
    assert.match(background, /ib-light-beams/);
    assert.match(background, /ib-rain-layer/);
    assert.match(background, /ib-dust-field/);
    assert.doesNotMatch(background, /ib-moon-halo|ib-crystal-glow|ib-candle-row/);
    assert.match(background, /ib-transition-wipe/);
    assert.match(background, /ib-horizon-glow/);
    assert.match(homeCss, /body:has\(\.xh-clean-home\) \.xh-background-image\.is-active/);
    assert.match(homeCss, /opacity: 0\.88 !important/);
    assert.match(
      homeCss,
      /body:has\(:is\(\.xh-home, \.console-page\)\) \.xh-background-slider \.xh-background-image\.is-active[\s\S]*brightness\(0\.68\)/
    );
    assert.match(
      homeCss,
      /html\[data-xh-theme="night"\]:not\(\[data-xh-theme-phase="dawn"\]\) body:has\(:is\(\.xh-home, \.console-page\)\)[\s\S]*#241532/
    );
    assert.match(css, /\.xh-background-image\s*\{[\s\S]*transition:\s*[\s\S]*opacity 1800ms ease/);
    assert.match(homeCss, /\.xh-background-image\.is-exiting\s*\{[\s\S]*opacity: 0 !important/);
    const finalTransitionLockIndex = homeCss.indexOf('transition: none !important');
    const backgroundTransitionRestoreIndex = homeCss.lastIndexOf('.xh-background-slider .xh-background-image');
    assert.ok(backgroundTransitionRestoreIndex > finalTransitionLockIndex, 'background image transition restore must follow broad transition locks');
    assert.match(homeCss.slice(backgroundTransitionRestoreIndex), /transition:\s*[\s\S]*opacity 1800ms ease/);
    assert.match(homeCss, /mix-blend-mode: normal !important/);
    assert.doesNotMatch(homeCss, /body:has\(\.xh-clean-home\) \.xh-background-image\.is-active \{\n\s*opacity: 0\.48 !important/);
    assert.match(component, /pointerdown/);
    assert.match(component, /usePathname/);
    assert.match(component, /import Link from 'next\/link'/);
    assert.match(component, /className="xh-floating-player-open" href="\/music"/);
    assert.match(homeCss, /\.xh-floating-player > \.xh-floating-player-open[\s\S]*z-index: 1 !important/);
    assert.match(homeCss, /\.xh-floating-player > :is\(span, strong, small\)[\s\S]*pointer-events: none !important/);
    assert.match(homeCss, /\.xh-floating-player-controls[\s\S]*z-index: 3 !important/);
    assert.match(homeCss, /\.xh-floating-player-volume[\s\S]*z-index: 3 !important/);
    assert.match(component, /isTransitioning/);
    assert.match(component, /nextMode/);
    assert.doesNotMatch(component, /commitTimerRef/);
    assert.match(component, /xhThemeTransition/);
    assert.match(component, /xh-theme-transition/);
    assert.match(component, /data-xh-theme-next/);
    assert.match(component, /data-theme-phase=\{renderedPhase\}/);
    assert.match(component, /xh-theme-switch-orbit/);
    assert.match(component, /xh-theme-switch-body is-sun/);
    assert.match(component, /data-transitioning/);
    assert.match(homeCss, /@keyframes xh-toggle-sun-set/);
    assert.match(homeCss, /@keyframes xh-toggle-moon-drop/);
    assert.match(homeCss, /@keyframes xh-toggle-moon-rise/);
    assert.match(homeCss, /@keyframes xh-toggle-sun-rise/);
    assert.match(homeCss, /xh-theme-switch\.is-transitioning\[data-next-mode="night"\]\[data-theme-phase="dusk"\]/);
    assert.match(homeCss, /data-xh-theme-phase="dusk"[\s\S]*xh-phase-slider-day-to-night/);
    assert.match(homeCss, /data-xh-theme-phase="day"[\s\S]*animation: none !important/);
    assert.match(homeCss, /Richer sun\/moon glyph details/);
    assert.match(homeCss, /@keyframes xh-toggle-sun-breathe/);
    assert.match(homeCss, /@keyframes xh-toggle-stars-twinkle/);
    assert.match(homeCss, /@property --xh-action-bg-top/);
    assert.match(homeCss, /all var\(--xh-phase-duration, 2600ms\) linear/);
    assert.match(homeCss, /@keyframes xh-action-tone-fade/);
    assert.match(homeCss, /--xh-phase-duration: 3400ms/);
    assert.match(homeCss, /data-xh-theme=\"day\"\]\[data-xh-theme-next=\"night\"[\s\S]*background-color: #241532 !important/);
    assert.match(homeCss, /data-xh-theme=\"night\"\]\[data-xh-theme-next=\"day\"[\s\S]*background-color: #c894b9 !important/);
    assert.match(homeCss, /data-xh-theme=\"night\"\]\[data-xh-theme-next=\"day\"[\s\S]*\.xh-background-slider[\s\S]*background-color: rgb\(190, 134, 170\) !important/);
    assert.match(homeCss, /18% \{\s*opacity: 0;/);
    assert.match(homeCss, /a::before[\s\S]*linear-gradient\(180deg, var\(--xh-action-fade-top\), var\(--xh-action-fade-bottom\)\)/);
    assert.match(
      homeCss,
      /data-xh-theme="day"\]\[data-xh-theme-next="night"\]\[data-xh-theme-transition="active"\]\[data-xh-theme-phase="dusk"\][\s\S]*--xh-phase-body-bg: rgb\(200, 148, 185\)/
    );
    assert.match(
      homeCss,
      /data-xh-theme="night"\]\[data-xh-theme-next="day"\]\[data-xh-theme-transition="active"\]\[data-xh-theme-phase="dawn"\][\s\S]*--xh-phase-body-bg: rgb\(36, 21, 50\)/
    );
    assert.match(homeCss, /@keyframes xh-transition-veil-soft/);
    assert.match(homeCss, /\.xh-theme-transition\.is-active[\s\S]*opacity: 0 !important/);
    assert.match(homeCss, /\.xh-theme-transition\.is-active span[\s\S]*opacity: 0 !important/);
    assert.match(homeCss, /xh-background-slider::before[\s\S]*background-color: rgb\(255, 182, 222\) !important;[\s\S]*opacity: 0\.1 !important/);
    assert.match(homeCss, /xh-background-slider::after[\s\S]*background-color: rgb\(18, 10, 30\) !important;[\s\S]*opacity: 0\.16 !important/);
    assert.match(homeCss, /--xh-action-base-top: rgba\(76, 58, 92, 0\.44\)/);
    assert.match(homeCss, /is-theme-transitioning \.xh-background-image[\s\S]*transform: scale\(1\.02\) translateZ\(0\) !important/);
    assert.match(homeCss, /is-theme-transitioning \.xh-background-image[\s\S]*will-change: opacity, filter !important/);
    assert.match(homeCss, /xh-clean-profile \.xh-profile-actions a/);
    assert.match(component, /setTimeout/);
    assert.match(component, /preventDefault/);
    assert.match(component, /stopPropagation/);
    assert.match(component, /prefersReducedMotion/);
    assert.match(component, /const \[reducedMotion, setReducedMotion\] = useState\(false\)/);
    assert.match(component, /const mediaQuery = window\.matchMedia\('\(prefers-reduced-motion: reduce\)'\)/);
    assert.match(component, /mediaQuery\.addEventListener\('change', handleReducedMotionChange\)/);
    assert.match(component, /mediaQuery\.removeEventListener\('change', handleReducedMotionChange\)/);
    assert.match(component, /xh-danmaku-layer/);
    assert.match(component, /xh-season-vfx-canvas/);
    assert.match(component, /SeasonalVfxParticle/);
    assert.match(component, /nightModeRef\.current = nightMode/);
    assert.match(component, /const themeTransitionDurationMs = 3400/);
    assert.match(component, /const themeTransitionCommitBufferMs = 400/);
    assert.match(component, /const commitDelay = reducedMotion \? 160 : visualDuration \+ themeTransitionCommitBufferMs/);
    assert.match(component, /const getThemeWeights = \(now = performance\.now\(\)\) =>/);
    assert.match(component, /const getNightMode = \(\) => getThemeWeights\(\)\.night >= 0\.5/);
    assert.match(component, /dayCount \* weights\.day \+ nightCount \* weights\.night/);
    assert.match(component, /const sceneAlpha = particle\.kind === 'firefly'[\s\S]*weights\.night[\s\S]*particle\.kind === 'bug' \? weights\.day : 1/);
    assert.match(component, /const nightWeight = getThemeWeights\(now\)\.night/);
    assert.match(component, /const dayWeight = getThemeWeights\(now\)\.day/);
    assert.doesNotMatch(component, /summer-beam/);
    assert.doesNotMatch(component, /drawImage\(beam/);
    assert.match(component, /const seasonTransitionStartedAtRef = useRef\(0\)/);
    assert.match(component, /const seasonSettleDurationMs = 2600/);
    assert.match(component, /const seasonSettleRef = useRef<SeasonSettleState>/);
    assert.match(component, /type SeasonGroundLevels = Record<Season, number>/);
    assert.match(component, /const seasonGroundLevelsRef = useRef<SeasonGroundLevels>/);
    assert.match(component, /const xhSeasonSettleAttribute = 'data-xh-season-settle'/);
    assert.match(component, /const getSeasonState = \(\) => \(\{/);
    assert.match(component, /const getSeasonSettleState = \(now = performance\.now\(\)\) => \{/);
    assert.match(component, /const getParticleSeason = \(\) => \{/);
    assert.match(component, /season: Season/);
    assert.match(component, /const getParticleSeasonAlpha = \(particleSeason: Season, now = performance\.now\(\)\) => \{/);
    assert.match(component, /return 1 - progress/);
    assert.match(component, /return progress/);
    assert.match(component, /const withAlpha = \(alpha: number, drawLayer: \(\) => void\) => \{/);
    assert.match(component, /\}, \[effects\.enabled, intensity, reducedMotion\]\);/);
    assert.match(component, /if \(!effects\.enabled \|\| intensity <= 0 \|\| reducedMotion \|\| prefersReducedMotion\(\)\)/);
    assert.match(component, /context\.clearRect\(0, 0, width, height\)/);
    assert.doesNotMatch(component, /\}, \[effects\.enabled, intensity, isSeasonTransitioning, nextSeason, previousSeason, season\]\);/);
    assert.doesNotMatch(component, /\}, \[effects\.enabled, intensity, isSeasonTransitioning, nextSeason, nightMode, previousSeason, season\]\);/);
    assert.match(component, /kind: 'petal' \| 'firefly' \| 'bug' \| 'leaf' \| 'snow'/);
    assert.match(component, /\/assets\/seasonal\/spring-petal-source\.png/);
    assert.match(component, /\/assets\/seasonal\/spring-firefly\.png/);
    assert.doesNotMatch(component, /leafPile/);
    assert.doesNotMatch(component, /autumn-leaf-pile\.png/);
    assert.doesNotMatch(component, /drawImage\(sprites\.leafPile/);
    assert.match(component, /\/assets\/seasonal\/winter-snow-mist\.png/);
    assert.match(component, /const markSpriteReady = \(\) => \{/);
    assert.match(component, /image\.onerror = \(\) => \{\s*delete sprites\[key\];\s*markSpriteReady\(\);\s*\}/);
    assert.doesNotMatch(component, /snowbank/);
    assert.doesNotMatch(component, /className="xh-firefly-layer"/);
    assert.doesNotMatch(component, /className="xh-petal-layer"/);
    assert.doesNotMatch(component, /className=\{`xh-space-rain/);
    assert.doesNotMatch(component, /effects\.fireflies \?/);
    assert.doesNotMatch(component, /effects\.petals \?/);
    assert.match(component, /Math\.min\(window\.devicePixelRatio \|\| 1, 1\.35\)/);
    assert.match(component, /const frameIntervalMs = 1000 \/ 24/);
    assert.match(component, /Math\.round\(intensity \/ 4\.8\)/);
    assert.match(component, /Math\.round\(intensity \/ 7\.2\)/);
    assert.match(component, /if \(intensity <= 0\) \{\s*return 0;\s*\}/);
    assert.match(component, /return Math\.round\(intensity \/ 2\.2\)/);
    assert.doesNotMatch(component, /Math\.max\(32, Math\.round\(intensity \/ 2\.2\)\)/);
    assert.match(component, /resetParticle\(particle, true\)/);
    assert.match(component, /particle\.season = activeSeason/);
    assert.match(component, /const seasonAlpha = getParticleSeasonAlpha\(particle\.season, now\)/);
    assert.match(component, /alpha \* sceneAlpha \* seasonAlpha/);
    assert.match(component, /drawSummer\(now, transitionProgress\)/);
    assert.match(component, /drawGround\(now, transitionProgress\)/);
    assert.match(component, /drawTransition\(now, transitionProgress\)/);
    assert.doesNotMatch(component, /className=\{`xh-season-transition/);
    assert.doesNotMatch(component, /className="xh-seasonal-aura"/);
    assert.match(component, /drawStableSeasonGround = \(targetSeason: Season, targetGrowth: number, windAway = 0, dry = 0, melt = 0, thaw = 0\) => \{/);
    assert.match(component, /drawPetalAccumulation\(targetGrowth, now, windAway\)/);
    assert.match(component, /particle\.kind = 'bug'/);
    assert.match(component, /const wingBeat = 0\.55 \+ Math\.sin\(now \* 0\.017 \+ particle\.phase\) \* 0\.25/);
    assert.match(component, /drawSpringGround\(targetGrowth \* 0\.75, now, false, 0\)/);
    assert.match(component, /drawSweptPetals\(now, transitionGrowth\)/);
    assert.match(component, /drawTransitionLeaves\(now, transitionGrowth\)/);
    assert.match(component, /drawColdLeafSnowWind\(now, transitionProgress\)/);
    assert.match(component, /const windFront = -width \* 0\.16 \+ progress \* width \* 1\.32/);
    assert.match(component, /gustBand\.addColorStop/);
    assert.match(component, /drawNightFireflies\(now\)/);
    assert.match(component, /drawWinterFlurries\(now\)/);
    assert.match(component, /index < 54/);
    assert.match(component, /const drawFallenLeafShape = \(x: number, y: number, size: number, rotation: number, variant: number, alpha: number\) =>/);
    assert.match(component, /const drawLeafAccumulation[\s\S]*index < scaledCount\(58\)/);
    assert.match(component, /for \(let index = 0; index < scaledCount\(142\); index \+= 1\)/);
    assert.match(component, /const leafAlpha = growth \* \(1 - smoothStep\(sink\)\)/);
    assert.match(component, /sepia\(0\.72\) saturate\(1\.28\) hue-rotate\(-18deg\) brightness\(0\.84\)/);
    assert.match(component, /particle\.kind === 'leaf'[\s\S]*sepia\(0\.72\) saturate\(1\.24\) hue-rotate\(-18deg\) brightness\(0\.86\)/);
    assert.doesNotMatch(component, /const drawLeafAccumulation[\s\S]*index < 760/);
    assert.match(component, /let seasonalDensityScale = 1/);
    assert.match(component, /if \(!effects\.enabled \|\| intensity <= 0 \|\| reducedMotion \|\| prefersReducedMotion\(\)\)/);
    assert.match(component, /const viewportScale = width <= 480 \? 0\.56/);
    assert.match(component, /const intensityScale = intensity \/ 100/);
    assert.match(component, /const intensity = Math\.max\(0, Math\.min\(100, effects\.intensity \?\? 72\)\)/);
    assert.doesNotMatch(component, /effects\.intensity \|\| 72/);
    assert.match(component, /const scaledCount = \(base: number\) => Math\.round\(base \* seasonalDensityScale\)/);
    assert.match(component, /index < scaledCount\(820\)/);
    assert.match(component, /index < scaledCount\(320\)/);
    assert.match(component, /withAlpha\(fadeOut, \(\) => drawStableSeasonGround\('summer', 1 - transitionGrowth \* 0\.28, 0, transitionGrowth\)\)/);
    assert.match(component, /const groundLevels = seasonGroundLevelsRef\.current/);
    assert.match(component, /groundLevels\[next\] = Math\.max\(groundLevels\[next\], transitionGrowth\)/);
    assert.match(component, /const nextGrowth = Math\.max\(transitionGrowth, groundLevels\[next\]\)/);
    assert.match(component, /withAlpha\(fadeIn, \(\) => drawLeafAccumulation\(nextGrowth, now\)\)/);
    assert.match(component, /const fadeOut = transitioning \? 1 - smoothStep/);
    assert.match(component, /if \(settle\.active\) \{/);
    assert.doesNotMatch(component, /if \(settle\.from === 'autumn' && settle\.to === 'winter'\)/);
    assert.doesNotMatch(component, /const leafSettleSink/);
    assert.doesNotMatch(component, /drawLeafAccumulation\(1, leafSettleSink\)/);
    assert.doesNotMatch(component, /drawColdLeafSnowWind\(now, 0\.54 \+ settle\.progress \* 0\.28\)/);
    assert.match(component, /settle\.from === 'winter' && settle\.to === 'spring'/);
    assert.match(component, /drawStableSeasonGround\('spring', Math\.max\(baseGrowth, groundLevels\[settle\.to\]\)\)/);
    assert.doesNotMatch(component, /drawSpringGround\(settledGrowth \* 0\.8, now, false, 0\)/);
    assert.doesNotMatch(component, /drawPetalAccumulation\(settledGrowth \* 0\.72, now\)/);
    assert.doesNotMatch(component, /drawSnowAccumulation\(1, thawProgress, 0\.88 \* \(1 - thawProgress\), thawProgress\)/);
    assert.doesNotMatch(component, /withAlpha\(1 - settle\.progress, \(\) => drawSweptPetals\(now, 1\)\)/);
    assert.match(component, /withAlpha\(1, \(\) => drawStableSeasonGround\(settle\.to, Math\.max\(baseGrowth, groundLevels\[settle\.to\]\)\)\)/);
    assert.doesNotMatch(component, /drawStableSeasonGround\(settle\.from, growth\)/);
    assert.doesNotMatch(component, /const transitionGrowth = transitioning \? easeOut\(transitionProgress\) : growth/);
    assert.doesNotMatch(component, /Math\.random\(\) < settle\.progress \? settle\.to : settle\.from/);
    assert.doesNotMatch(component, /Math\.random\(\) < smoothStep\(getSeasonTransitionProgress\(\)\)/);
    assert.doesNotMatch(component, /shouldSeedNextSeason|shouldSeedSettleTarget/);
    assert.match(component, /retiring: boolean/);
    assert.match(component, /particle\.retiring = false/);
    assert.match(component, /particle\.retiring = true/);
    assert.match(component, /const particleShouldRetire = particle\.retiring && particleSeasonAlpha <= 0\.015/);
    assert.match(component, /settle\.active && settle\.from === 'summer' && settle\.to === 'autumn'/);
    assert.match(component, /withAlpha\(1 - settle\.progress, \(\) => \{\s*drawSummer\(now, 1\);[\s\S]*drawTransitionLeaves\(now, 1\);[\s\S]*\}\)/);
    assert.match(component, /const skipVisibleSettle = currentSeason === 'autumn' && target === 'winter'/);
    assert.match(component, /seasonSettleRef\.current = \{\s*active: !skipVisibleSettle/);
    assert.match(component, /const currentSeason = seasonRef\.current/);
    assert.doesNotMatch(component, /const currentSeason = season;/);
    assert.match(component, /seasonRef\.current = target/);
    assert.match(component, /const preservedCurrentGround = skipVisibleSettle \? 0 : 0\.72/);
    assert.match(component, /seasonGroundLevelsRef\.current\[currentSeason\] = skipVisibleSettle\s*\?\s*0\s*:\s*Math\.max\(seasonGroundLevelsRef\.current\[currentSeason\], preservedCurrentGround\)/);
    assert.doesNotMatch(component, /currentSeason === 'autumn' && target === 'winter' \? 1 : 0/);
    assert.match(component, /seasonGroundLevelsRef\.current\[target\] = 1/);
    assert.match(component, /setSeason\(target\)/);
    assert.match(component, /setSeasonAttributes\(target, target, 'idle', skipVisibleSettle \? target : currentSeason, skipVisibleSettle \? 'idle' : 'active'\)/);
    assert.match(component, /if \(skipVisibleSettle\) \{\s*window\.localStorage\.setItem\('xh-season-mode', target\);\s*return;\s*\}/);
    assert.match(component, /seasonSettleTimerRef\.current = window\.setTimeout/);
    assert.match(component, /seasonGroundLevelsRef\.current\[currentSeason\] = 0/);
    assert.match(component, /setSeasonAttributes\(target, target, 'idle', target, 'idle'\)/);
    assert.match(component, /const summerWeight = seasonState\.transitioning/);
    assert.match(component, /particle\.kind = 'petal'[\s\S]*randomBetween\(18, 34\)/);
    assert.match(component, /particle\.kind = 'snow'[\s\S]*randomBetween\(7, 18\)/);
    assert.match(component, /xh-heat-distortion/);
    assert.match(component, /drawStableSeasonGround\('summer', growth, 0, dry\)/);
    assert.match(component, /const seasonalGroundMotionBoost = 1\.65/);
    assert.match(component, /const pileHeight = Math\.min\(92, Math\.max\(42, height \* 0\.072\)\) \* level/);
    assert.match(component, /const ambientBreeze = Math\.sin\(now \* 0\.0012/);
    assert.match(component, /const visiblePetalGust = 0\.5 \+ 0\.5 \* Math\.sin\(now \* 0\.0021/);
    assert.match(component, /const leafGust = 0\.5 \+ 0\.5 \* Math\.sin\(now \* 0\.0022/);
    assert.match(component, /const snowSurfaceGust = 0\.5 \+ 0\.5 \* Math\.sin\(now \* 0\.0017\)/);
    assert.match(component, /for \(let powder = 0; powder < scaledCount\(54\); powder \+= 1\)/);
    assert.match(component, /const powderDrift = \(now \* \(0\.05 \+ frac \* 0\.075\)\)/);
    assert.match(component, /for \(let loosePetal = 0; loosePetal < scaledCount\(72\); loosePetal \+= 1\)/);
    assert.match(component, /now \* \(0\.04 \+ frac \* 0\.065\)/);
    assert.match(component, /for \(let rollingLeaf = 0; rollingLeaf < scaledCount\(26\); rollingLeaf \+= 1\)/);
    assert.match(component, /now \* \(0\.026 \+ frac \* 0\.052\)/);
    assert.match(component, /const drawLeafAccumulation = \(growth: number, now: number, sink = 0\) =>/);
    assert.match(component, /const leafRustle = Math\.sin\(now \* 0\.0021/);
    assert.match(component, /const drawSnowAccumulation = \(growth: number, now: number, melt = 0, cover = 0, thaw = 0\) =>/);
    assert.match(component, /const snowWindPhase = now \* 0\.00058/);
    assert.match(component, /drawLeafAccumulation\(targetGrowth, now\)/);
    assert.match(component, /drawSnowAccumulation\(targetGrowth, now, melt/);
    assert.match(component, /const snowHeight = Math\.min\(92, Math\.max\(42, height \* 0\.078\)\) \* level/);
    assert.match(component, /const pileHeight = Math\.min\(104, Math\.max\(50, height \* 0\.088\)\) \* growth/);
    assert.match(component, /context\.globalCompositeOperation = 'multiply'/);
    assert.match(component, /index < scaledCount\(92\)/);
    assert.match(component, /const coverStrength = smoothStep\(cover\)/);
    assert.match(component, /const thawStrength = smoothStep\(thaw\)/);
    assert.match(component, /meltGlow\.addColorStop/);
    assert.match(component, /coverGradient\.addColorStop/);
    assert.doesNotMatch(component, /fillRect\(0, top - 10, width, snowHeight \+ 12\)/);
    assert.doesNotMatch(component, /rgba\(244, 252, 255, \$\{0\.48/);
    assert.match(component, /const baseGrowth = easeOut\(\(now - effectStartedAt\) \/ 16000\)/);
    assert.doesNotMatch(component, /withAlpha\(next === 'winter' \? Math\.max\(0\.38, fadeOut\) : 1, \(\) => drawLeafAccumulation\(growth\)\)/);
    assert.match(component, /if \(next !== 'winter'\) \{\s*withAlpha\(1, \(\) => drawLeafAccumulation\(growth, now\)\)/);
    assert.match(component, /const snowCoverProgress = smoothStep\(Math\.min\(1, Math\.max\(0, transitionProgress \/ 0\.58\)\)\)/);
    assert.match(component, /const leafVanishProgress = smoothStep\(Math\.min\(1, Math\.max\(0, \(transitionProgress - 0\.68\) \/ 0\.32\)\)\)/);
    assert.match(component, /const coveredSnowGrowth = Math\.max\(nextGrowth, snowCoverProgress \* 0\.96\)/);
    assert.match(component, /drawLeafAccumulation\(growth, now, leafVanishProgress\)/);
    assert.match(component, /withAlpha\(1, \(\) => drawSnowAccumulation\(coveredSnowGrowth, now, 0, snowCoverProgress\)\)/);
    assert.match(component, /for \(let index = 0; index < 54; index \+= 1\)/);
    assert.match(component, /const snowImage = sprites\.snow/);
    assert.match(component, /for \(let index = 0; index < 22; index \+= 1\)/);
    assert.match(component, /for \(let index = 0; index < 36; index \+= 1\)/);
    assert.doesNotMatch(component, /const leafCoverFade = 1 - smoothStep\(Math\.max\(0, \(transitionProgress - 0\.22\) \/ 0\.78\)\)/);
    assert.doesNotMatch(component, /1 - smoothStep\(Math\.max\(0, \(transitionProgress - 0\.64\) \/ 0\.36\)\)/);
    assert.match(component, /resetParticle\(particle, false, particleAlpha > 0\.02 && particle\.season === activeSeason \? particle\.season : activeSeason\)/);
    assert.match(component, /const lane = index \/ 12/);
    assert.match(homeCss, /@keyframes xh-heat-refraction/);
    assert.match(homeCss, /html body \.xh-heat-distortion[\s\S]*display: none !important/);
    assert.match(homeCss, /html body \.xh-seasonal-aura[\s\S]*display: none !important/);
    assert.match(homeCss, /body \.xh-season-transition\[data-season-from\]\[data-season-to\]\.is-active::after[\s\S]*display: none !important/);
    assert.match(homeCss, /html\[data-xh-season\] body \.xh-season-ground[\s\S]*display: none !important/);
    assert.match(homeCss, /body:has\(\.xh-pixel-kurisu-pet\[data-open="true"\]\) \.xh-season-switch[\s\S]*pointer-events: none !important/);
    assert.match(homeCss, /body:has\(\.xh-pixel-kurisu-pet\[data-open="true"\]\) \.xh-kurisu-panel[\s\S]*z-index: 174 !important/);
    assert.match(homeCss, /backdrop-filter: none !important/);
    assert.match(homeCss, /\.xh-season-transition,\s*[\s\S]*\.xh-season-transition\.is-active\s*\{[\s\S]*display: none !important/);
    assert.match(homeCss, /Clear floating season\/day-night controls/);
    assert.match(homeCss, /body \.xh-theme-switch,\s*[\s\S]*body \.xh-season-switch[\s\S]*grid-template-columns: 42px minmax\(64px, 1fr\)/);
    assert.match(homeCss, /body:has\(\.xh-clean-home\) \.xh-season-switch[\s\S]*bottom: clamp\(184px, 21vh, 238px\)/);
    assert.match(homeCss, /body \.xh-season-switch\.is-transitioning::before[\s\S]*xh-switch-current-bg-fade 1800ms/);
    assert.match(homeCss, /body \.xh-season-switch\.is-transitioning \.xh-season-switch-icon\.is-current[\s\S]*xh-switch-current-icon-fade 1800ms/);
    assert.match(component, /xh-switch-info-card/);
    assert.match(homeCss, /html body \.xh-theme-switch,[\s\S]*html body \.xh-season-switch[\s\S]*grid-template-rows: 11px 18px 12px/);
    assert.match(homeCss, /html body \.xh-theme-switch,[\s\S]*html body \.xh-season-switch[\s\S]*width: 154px !important/);
    assert.match(homeCss, /html body \.xh-season-switch\[data-season="autumn"\][\s\S]*--xh-badge-a: rgba\(146, 75, 46, 0\.82\)/);
    assert.match(homeCss, /html body \.xh-theme-switch\.is-transitioning\[data-next-mode="night"\]::after,[\s\S]*html body \.xh-theme-switch\.is-transitioning\[data-next-mode="day"\]::after,[\s\S]*html body \.xh-season-switch\.is-transitioning::after[\s\S]*xh-switch-next-bg-fade 1800ms/);
    assert.match(homeCss, /html body \.xh-theme-switch,[\s\S]*html\[data-xh-theme\]\[data-xh-theme-phase\]\[data-xh-theme-transition\] body \.xh-theme-switch[\s\S]*bottom: 222px !important/);
    assert.match(homeCss, /html body \.xh-theme-switch\.is-transitioning\[data-next-mode="night"\]::before,[\s\S]*xh-switch-current-bg-fade 1800ms/);
    assert.match(homeCss, /html body:has\(\.xh-floating-player\)[\s\S]*--xh-assistant-rail-base: max\(132px/);
    assert.match(homeCss, /html body \.xh-theme-switch > \.xh-switch-info-card,[\s\S]*html body \.xh-season-switch > \.xh-switch-info-card[\s\S]*width: 132px !important/);
    assert.match(homeCss, /html body \.xh-season-switch\.is-autumn > \.xh-switch-info-card[\s\S]*rgba\(133, 72, 45, 0\.8\)[\s\S]*rgba\(116, 75, 48, 0\.82\)/);
    assert.match(homeCss, /html body \.xh-theme-switch > \.xh-theme-switch-kicker,[\s\S]*html body \.xh-season-switch > strong[\s\S]*display: none !important/);
    assert.match(homeCss, /html body \.xh-season-switch-orbit > \.xh-season-switch-icon[\s\S]*transform: translate3d\(-50%, -50%, 0\) scale\(0\.98\) rotate\(0deg\) !important/);
    assert.match(homeCss, /@keyframes xh-switch-next-icon-fade[\s\S]*0%[\s\S]*opacity: 0;[\s\S]*100%[\s\S]*opacity: 1;[\s\S]*translate3d\(-50%, -50%, 0\)/);
    assert.match(homeCss, /:is\(\.xh-theme-switch, \.xh-season-switch\)[\s\S]*--xh-relic-size: 76px/);
    assert.match(homeCss, /:is\(\.xh-theme-switch-orbit, \.xh-season-switch-orbit\)[\s\S]*width: var\(--xh-relic-orbit\) !important/);
    assert.match(homeCss, /\.xh-theme-switch\.is-transitioning\[data-next-mode="night"\] \.xh-theme-switch-body\.is-moon[\s\S]*opacity: 1 !important/);
    assert.match(homeCss, /html\.xh-splash-seen[\s\S]*\.xh-theme-switch\.is-transitioning[\s\S]*opacity: 1 !important/);
    assert.match(component, /function SeasonGlyph\(\{ season \}: \{ season: Season \}\)/);
    assert.match(component, /function ThemeGlyph\(\{ mode \}: \{ mode: ThemeMode \}\)/);
    assert.match(component, /<SeasonGlyph season=\{season\} \/>/);
    assert.match(homeCss, /\.xh-theme-switch\.is-transitioning \.xh-theme-switch-body[\s\S]*transform: translate\(-50%, -50%\) !important/);
    assert.match(homeCss, /Seamless theme commit: centered sun\/moon crossfade/);
    assert.match(homeCss, /Current-mode-qualified selectors override legacy hold rules/);
    assert.match(homeCss, /\.xh-theme-switch\.is-day\.is-transitioning\[data-next-mode="night"\] \.xh-theme-switch-body\.is-sun[\s\S]*opacity: 0 !important/);
    assert.match(homeCss, /\.xh-theme-switch\.is-transitioning\[data-next-mode="night"\] \.xh-theme-switch-body\.is-sun[\s\S]*opacity: 0 !important/);
    assert.match(homeCss, /\.xh-theme-switch:not\(\.is-transitioning\) \.xh-relic-aura-layer[\s\S]*transition: none !important/);
    assert.doesNotMatch(component, /<em>[\s\S]*<ThemeGlyph mode=\{nextMode\}/);
    assert.match(component, /function SeasonAura\(\{ season \}: \{ season: Season \}\)/);
    assert.match(component, /function ThemeAura\(\{ mode \}: \{ mode: ThemeMode \}\)/);
    assert.match(component, /<SeasonAura season=\{nextSeason\} \/>/);
    assert.match(component, /<ThemeAura mode=\{nextMode\} \/>/);
    assert.match(homeCss, /\.xh-season-switch \.xh-relic-aura-layer[\s\S]*opacity 4200ms linear/);
    assert.match(homeCss, /\.xh-theme-switch \.xh-relic-aura-layer[\s\S]*opacity 3400ms linear/);
    assert.match(homeCss, /Japanese fantasy crest polish: no top-left square glare/);
    assert.match(homeCss, /Summer is a cool wind-chime\/water crest/);
    assert.match(component, /xh-glyph-secondary[\s\S]*M7 36c5-5 10-5 15 0/);
    assert.match(homeCss, /\.xh-theme-switch-body\.is-sun[\s\S]*#fffbd7[\s\S]*#db855c/);
    assert.match(homeCss, /season-switch\[data-season="summer"\][\s\S]*#e7fcff[\s\S]*#3c8db2/);
    assert.match(homeCss, /contain: layout style !important/);
    assert.match(component, /xh-click-canvas/);
    assert.doesNotMatch(component, /pointermove|xh-cursor-canvas/);
    assert.match(motion, /gsap/);
    assert.match(motion, /ScrollTrigger/);
    assert.match(toolbox, /xh-global-toolbox/);
    assert.match(toolbox, /pathname === '\/'/);
    assert.match(toolbox, /return null/);
    assert.match(blog, /VisualEffectsConfig/);
    assert.match(blog, /EntryTextConfig/);
    assert.match(blog, /consoleTitle: string/);
    assert.match(blog, /entry: normalizeEntry\(siteInput\.entry\)/);
    assert.match(blog, /danmaku: string\[\]/);
    assert.match(blog, /cursorTrail: false/);
    assert.match(css, /\.ib-scene-day/);
    assert.match(css, /html\[data-xh-theme="night"\] \.ib-scene-night/);
    assert.doesNotMatch(css, /\.ib-desk-line/);
    assert.match(css, /\.ib-light-beams/);
    assert.match(css, /\.ib-rain-layer/);
    assert.match(css, /\.ib-dust-field/);
    assert.match(css, /\.ib-transition-wipe/);
    assert.match(css, /\.ib-horizon-glow/);
    assert.doesNotMatch(css, /\.ib-window-grid|\.ib-glass-refraction|\.ib-moon-halo|\.ib-crystal-glow|\.ib-candle-row/);
    assert.match(entryCss, /\.ib-game-start/);
    assert.match(entryCss, /\.ib-game-bg-internal/);
    assert.match(entryCss, /\.ib-game-rain-canvas/);
    assert.doesNotMatch(entryCss, /\.ib-game-bg-infernal|\.ib-game-room-day|\.ib-game-room-night/);
    assert.match(css, /\.xh-theme-transition/);
    assert.match(css, /@keyframes ib-beam-sway/);
    assert.match(css, /@keyframes ib-rain-glide/);
    assert.match(css, /@keyframes ib-mote-drift/);
    assert.match(css, /@keyframes xh-theme-wave/);
    assert.match(css, /@keyframes xh-firefly-glow/);
    assert.match(css, /@keyframes xh-firefly-core-glint/);
    assert.match(css, /@keyframes xh-firefly-halo/);
    assert.match(css, /@keyframes xh-firefly-float/);
    assert.match(css, /@keyframes xh-petal-fall/);
    assert.match(css, /\.xh-firefly-layer i\s*\{[\s\S]*width: 8px;[\s\S]*height: 8px/);
    assert.match(css, /\.xh-firefly-layer i\s*\{[\s\S]*0 0 32px rgba\(168, 215, 137, 0\.18\)/);
    assert.match(css, /\.xh-firefly-layer i::after\s*\{[\s\S]*inset: -7px/);
    assert.match(css, /\.xh-firefly-layer i::after\s*\{[\s\S]*animation: xh-firefly-halo/);
    assert.doesNotMatch(css, /0 0 74px rgba\(168, 215, 137, 0\.26\)/);
    assert.match(css, /html\[data-xh-theme="night"\][\s\S]*\.xh-firefly-layer/);
    assert.match(css, /html\[data-xh-theme="night"\]:not\(\[data-xh-theme-phase="dawn"\]\)[\s\S]*\.xh-petal-layer/);
    assert.match(css, /html:not\(\[data-xh-theme="night"\]\):not\(\[data-xh-theme-phase="dusk"\]\)[\s\S]*\.xh-firefly-layer/);
    assert.match(css, /html\[data-xh-theme="night"\] body:has\(\.xh-clean-home\) \.xh-space-rain[\s\S]*opacity: 0 !important/);
    assert.match(css, /html\[data-xh-theme="night"\]/);
    assert.match(css, /--xh-sakura: #ff8fc7/);
    assert.match(css, /--xh-cyan: #7cd9ff/);
    assert.doesNotMatch(background, /InternalBeyond|bg-internal\.jpg|bg-infernal\.jpg|game_module|room_day\.png|room_night\.png/);
    assert.doesNotMatch(component, /InternalBeyond|bg-internal\.jpg|bg-infernal\.jpg|game_module|room_day\.png|room_night\.png/);
    assert.doesNotMatch(entryCss, /InternalBeyond|bg-internal\.jpg|bg-infernal\.jpg|game_module|room_day\.png|room_night\.png/);
  });
});
