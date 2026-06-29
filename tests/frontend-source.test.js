import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

describe('target-inspired homepage portal', () => {
  it('keeps the homepage as an XHBlogs-style route ecosystem and removes the old room stage', async () => {
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
      experience,
      css
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
      readFile('lib/experience.ts', 'utf8'),
      readFile('app/globals.css', 'utf8')
    ]);

    assert.match(page, /HomeWorld/);
    assert.match(page, /createPortalSearchEntries/);
    assert.match(homeWorld, /PortalSearch/);
    assert.match(homeWorld, /SpaceDock/);
    assert.match(homeWorld, /CloudPlayerCard/);
    assert.match(homeWorld, /LyricStrip/);
    assert.match(homeWorld, /SiteDashboard/);
    assert.match(homeWorld, /LatestPostCarousel/);
    assert.match(homeWorld, /xh-home-main-deck/);
    assert.match(homeWorld, /xh-home-feature-stack/);
    assert.match(homeWorld, /xh-home-route-cluster/);
    assert.match(homeWorld, /xh-route-orb/);
    assert.match(homeWorld, /xh-home-feed-deck/);
    assert.match(homeWorld, /xh-home-bottom-grid/);
    assert.match(homeWorld, /photowall/);
    assert.match(homeWorld, /friends/);
    assert.match(homeWorld, /chatter/);
    assert.match(homeWorld, /timeline/);
    assert.match(homeWorld, /tree/);
    assert.match(homeWorld, /music/);
    assert.doesNotMatch(homeWorld, /RoomConsole/);
    assert.doesNotMatch(homeWorld, /xh-home-room-deck/);
    assert.doesNotMatch(page, /ExperienceShowcase|ArticleExplorer|post-teasers|projects-section|gallery-section|links-section/);

    assert.match(spaceDock, /xh-space-dock/);
    assert.match(spaceDock, /createSpaceModules/);
    assert.match(spaceDock, /createSpaceSignals/);
    assert.match(spaceDock, /experienceRoutes/);
    assert.match(spaceDock, /Personal Space/);
    assert.match(portalSearch, /searchPortal/);
    assert.match(portalSearch, /highlightMatchedText/);
    assert.match(portalSearch, /portal-channel-grid/);
    assert.match(portalIndex, /createPortalSearchEntries/);
    assert.match(portalIndex, /createPortalChannels/);
    assert.match(portalIndex, /scoreEntry/);
    assert.match(layout, /MusicProvider/);
    assert.match(layout, /BackgroundSlider/);
    assert.match(layout, /HomeEffects/);
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
    assert.match(latestCarousel, /xh-latest-card/);
    assert.match(latestCarousel, /xh-latest-carousel/);
    assert.match(latestCarousel, /xh-latest-main-link/);
    assert.match(latestCarousel, /setInterval/);
    assert.match(latestCarousel, /stopPropagation/);
    assert.match(latestCarousel, /aria-current/);
    assert.match(siteDashboard, /xh-site-dashboard/);
    assert.match(siteDashboard, /createDashboardBadges/);
    assert.match(siteDashboard, /formatUptime/);
    assert.match(siteDashboard, /setInterval/);
    assert.match(experience, /experienceRoutes/);
    assert.match(experience, /photowall/);
    assert.match(experience, /friends/);
    assert.match(experience, /timeline/);
    assert.match(experience, /tree/);
    assert.match(nav, /className=\{active \? 'active' : ''\}/);
    assert.match(nav, /mobile-orbit-toggle/);
    assert.match(nav, /mobile-orbit-panel/);
    assert.match(nav, /aria-expanded=\{menuOpen\}/);
    assert.match(nav, /orbitRotation/);
    assert.match(nav, /onPointerMove/);

    assert.match(css, /\.xh-home-main-deck/);
    assert.match(css, /\.xh-home-feature-stack/);
    assert.match(css, /\.xh-home-route-cluster/);
    assert.match(css, /\.xh-route-orb/);
    assert.match(css, /\.xh-home-feed-deck/);
    assert.match(css, /\.xh-home-bottom-grid/);
    assert.match(css, /"left main right"/);
    assert.match(css, /"left main"/);
    assert.match(css, /"main"/);
    assert.match(css, /\.portal-search/);
    assert.match(css, /\.xh-portal-grid/);
    assert.match(css, /\.xh-space-dock/);
    assert.match(css, /\.xh-cloud-player-card/);
    assert.match(css, /\.xh-latest-carousel/);
    assert.match(css, /\.xh-dashboard-clock/);
  });

  it('implements InternalBeyond-like background layers and day/night transition states', async () => {
    const [layout, background, component, toolbox, motion, blog, css] = await Promise.all([
      readFile('app/layout.tsx', 'utf8'),
      readFile('components/BackgroundSlider.tsx', 'utf8'),
      readFile('components/HomeEffects.tsx', 'utf8'),
      readFile('components/GlobalToolbox.tsx', 'utf8'),
      readFile('components/TasteMotion.tsx', 'utf8'),
      readFile('lib/blog.ts', 'utf8'),
      readFile('app/globals.css', 'utf8')
    ]);

    assert.match(layout, /<BackgroundSlider site=\{data\.site\} \/>/);
    assert.match(layout, /<HomeEffects site=\{data\.site\} posts=\{posts\} notes=\{data\.notes\} activeTrack=\{activeTrack\}/);
    assert.match(background, /xh-background-slider/);
    assert.match(background, /MutationObserver/);
    assert.match(background, /data-scene-theme/);
    assert.match(background, /ib-scene-shell/);
    assert.match(background, /ib-scene-day/);
    assert.match(background, /ib-scene-night/);
    assert.match(background, /ib-window-grid/);
    assert.match(background, /ib-light-beams/);
    assert.match(background, /ib-rain-layer/);
    assert.match(background, /ib-dust-field/);
    assert.match(background, /ib-crystal-glow/);
    assert.match(background, /ib-candle-row/);
    assert.match(background, /ib-transition-wipe/);
    assert.match(component, /pointerdown/);
    assert.match(component, /usePathname/);
    assert.match(component, /isTransitioning/);
    assert.match(component, /xhThemeTransition/);
    assert.match(component, /xh-theme-transition/);
    assert.match(component, /data-transitioning/);
    assert.match(component, /setTimeout/);
    assert.match(component, /preventDefault/);
    assert.match(component, /stopPropagation/);
    assert.match(component, /prefersReducedMotion/);
    assert.match(component, /xh-danmaku-layer/);
    assert.match(component, /xh-firefly-layer/);
    assert.match(component, /xh-petal-layer/);
    assert.match(component, /xh-click-canvas/);
    assert.doesNotMatch(component, /pointermove|xh-cursor-canvas/);
    assert.match(motion, /gsap/);
    assert.match(motion, /ScrollTrigger/);
    assert.match(toolbox, /xh-global-toolbox/);
    assert.match(blog, /VisualEffectsConfig/);
    assert.match(blog, /danmaku: string\[\]/);
    assert.match(blog, /cursorTrail: false/);
    assert.match(css, /\.ib-scene-day/);
    assert.match(css, /html\[data-xh-theme="night"\] \.ib-scene-night/);
    assert.match(css, /\.ib-light-beams/);
    assert.match(css, /\.ib-rain-layer/);
    assert.match(css, /\.ib-dust-field/);
    assert.match(css, /\.ib-crystal-glow/);
    assert.match(css, /\.ib-transition-wipe/);
    assert.match(css, /\.xh-theme-transition/);
    assert.match(css, /@keyframes ib-beam-sway/);
    assert.match(css, /@keyframes ib-rain-glide/);
    assert.match(css, /@keyframes ib-mote-drift/);
    assert.match(css, /@keyframes ib-crystal-pulse/);
    assert.match(css, /@keyframes ib-candle-flicker/);
    assert.match(css, /@keyframes xh-theme-wave/);
    assert.match(css, /html\[data-xh-theme="night"\]/);
    assert.match(css, /--xh-sakura: #ff8fc7/);
    assert.match(css, /--xh-cyan: #7cd9ff/);
    assert.doesNotMatch(background, /InternalBeyond|bg-internal|bg-infernal|game_module|room_day|room_night/);
    assert.doesNotMatch(component, /InternalBeyond|bg-internal|bg-infernal|game_module|room_day|room_night/);
    assert.doesNotMatch(css, /InternalBeyond|bg-internal|bg-infernal|game_module|room_day|room_night/);
  });
});
