import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

function extractCssRule(css, selector) {
  const selectorIndex = css.indexOf(selector);
  assert.notEqual(selectorIndex, -1, `Missing CSS selector: ${selector}`);

  const blockStart = css.indexOf('{', selectorIndex);
  assert.notEqual(blockStart, -1, `Missing CSS block for: ${selector}`);

  const blockEnd = css.indexOf('}', blockStart);
  assert.notEqual(blockEnd, -1, `Unclosed CSS block for: ${selector}`);
  return css.slice(selectorIndex, blockEnd + 1);
}

function extractCssRules(css, selectorFragment) {
  const rules = [];
  let cursor = 0;

  while (cursor < css.length) {
    const selectorIndex = css.indexOf(selectorFragment, cursor);
    if (selectorIndex === -1) {
      break;
    }

    const blockStart = css.indexOf('{', selectorIndex);
    const blockEnd = blockStart === -1 ? -1 : css.indexOf('}', blockStart);
    if (blockStart === -1 || blockEnd === -1) {
      break;
    }

    rules.push(css.slice(selectorIndex, blockEnd + 1));
    cursor = blockEnd + 1;
  }

  assert.ok(rules.length > 0, `Missing CSS rules for: ${selectorFragment}`);
  return rules.join('\n');
}

describe('subpage experience surfaces', () => {
  it('keeps index pages connected to clean channel headers and page-specific surfaces', async () => {
    const pageExpectations = [
      ['app/archive/page.tsx', /ChannelHeader/, /ArchiveSwitchboard/],
      ['app/projects/page.tsx', /SiteNav/, /ProjectShowcase/],
      ['app/photowall/page.tsx', /ChannelHeader/, /PhotoWallClient/],
      ['app/moments/page.tsx', /ChannelHeader/, /MomentsBoard|EmptyState/],
      ['app/chatter/page.tsx', /ChannelHeader/, /ChatterMasonry/],
      ['app/music/page.tsx', /ChannelHeader/, /MusicStudio|EmptyState/],
      ['app/friends/page.tsx', /ChannelHeader/, /FriendsBoardClient/],
      ['app/tags/page.tsx', /ChannelHeader/, /TagNebula/]
    ];

    for (const [file, insight, world] of pageExpectations) {
      const source = await readFile(file, 'utf8');
      assert.match(source, insight, file);
      assert.match(source, world, file);
    }

    const [
      worlds,
      archiveSwitchboard,
      channelHeader,
      projectShowcase,
      chatterMasonry,
      tagSurfaces,
      momentsBoard,
      planetaryOrbitMap,
      aboutRoom,
      photoWallClient,
      spaceAttribution
    ] = await Promise.all([
      readFile('components/ChannelWorlds.tsx', 'utf8'),
      readFile('components/ArchiveSwitchboard.tsx', 'utf8'),
      readFile('components/ChannelHeader.tsx', 'utf8'),
      readFile('components/channels/ProjectShowcase.tsx', 'utf8'),
      readFile('components/channels/ChatterMasonry.tsx', 'utf8'),
      readFile('components/channels/TagSurfaces.tsx', 'utf8'),
      readFile('components/MomentsBoard.tsx', 'utf8'),
      readFile('components/channels/PlanetaryOrbitMap.tsx', 'utf8'),
      readFile('components/channels/AboutRoom.tsx', 'utf8'),
      readFile('components/PhotoWallClient.tsx', 'utf8'),
      readFile('public/assets/space/ATTRIBUTION.md', 'utf8')
    ]);

    assert.match(channelHeader, /channel-hero/);
    assert.match(channelHeader, /xh-reference-hero/);
    assert.match(archiveSwitchboard, /archive-view-toggle/);
    assert.match(archiveSwitchboard, /archive-tag-rail/);
    assert.match(archiveSwitchboard, /xh-reference-surface/);
    assert.match(archiveSwitchboard, /archive-tab-timeline/);
    assert.match(archiveSwitchboard, /archive-tab-cards/);
    assert.match(archiveSwitchboard, /selectedTag/);
    assert.match(archiveSwitchboard, /post\.tags\.includes\(selectedTag\)/);
    assert.match(archiveSwitchboard, /role="tab"/);
    assert.match(archiveSwitchboard, /aria-selected/);
    assert.match(archiveSwitchboard, /aria-controls/);
    assert.match(archiveSwitchboard, /role="tabpanel"/);
    assert.match(archiveSwitchboard, /archive-card-view/);
    assert.match(archiveSwitchboard, /archive-timeline-view/);
    assert.match(worlds, /ProjectShowcase/);
    assert.doesNotMatch(worlds, /LinkStarMap/);
    assert.match(worlds, /ChatterMasonry/);
    assert.doesNotMatch(worlds, /TimelineArchive/);
    assert.match(worlds, /TagNebula/);
    assert.match(worlds, /TagReadingDock/);
    assert.match(worlds, /AboutRoom/);
    assert.match(projectShowcase, /'use client'/);
    assert.match(projectShowcase, /PageContent/);
    assert.match(projectShowcase, /page\.title/);
    assert.match(projectShowcase, /page\.searchPlaceholder/);
    assert.match(projectShowcase, /project-matrix-hero/);
    assert.match(projectShowcase, /project-matrix-search/);
    assert.match(projectShowcase, /filteredProjects/);
    assert.match(projectShowcase, /setQuery/);
    assert.match(projectShowcase, /project-matrix-grid/);
    assert.match(projectShowcase, /project-matrix-card/);
    assert.doesNotMatch(projectShowcase, /PROJECTS MATRIX|project-back-link|Project Starport|project-starport|project-orbit-layout|project-featured-console|project-status-rack/);
    assert.match(chatterMasonry, /chatter-masonry/);
    assert.match(chatterMasonry, /chatter-cover/);
    assert.match(chatterMasonry, /xh-reference-surface/);
    assert.match(chatterMasonry, /createContentExcerpt\(chatter\.content\)/);
    assert.doesNotMatch(chatterMasonry, /chatter\.summary/);
    assert.match(tagSurfaces, /PlanetaryOrbitMap/);
    assert.match(tagSurfaces, /PlanetaryOrbitItem/);
    assert.match(tagSurfaces, /subtitle="Tag Planet"/);
    assert.match(tagSurfaces, /const ORBIT_MODE_LIMIT = 8/);
    assert.match(momentsBoard, /PlanetaryOrbitMap/);
    assert.match(momentsBoard, /orbitItems/);
    assert.match(momentsBoard, /heat: note\.mood \? 2 : 1/);
    assert.match(momentsBoard, /moment-image-grid/);
    assert.doesNotMatch(momentsBoard, /note\.tags/);
    assert.doesNotMatch(momentsBoard, /moment-tags/);
    assert.doesNotMatch(momentsBoard, /detail: `\$\{note\.content\}/);
    assert.doesNotMatch(momentsBoard, /filteredNotes\.slice\(0, 12\)/);
    assert.match(planetaryOrbitMap, /'use client'/);
    assert.match(planetaryOrbitMap, /planetary-modebar/);
    assert.match(planetaryOrbitMap, /useState<'minimal' \| 'detail'>\('minimal'\)/);
    assert.match(planetaryOrbitMap, /setMode\('minimal'\)/);
    assert.match(planetaryOrbitMap, /setMode\('detail'\)/);
    assert.match(planetaryOrbitMap, /planetary-mini-planet/);
    assert.match(planetaryOrbitMap, /planetary-node-info/);
    assert.match(planetaryOrbitMap, /tags\?: string\[\]/);
    assert.match(planetaryOrbitMap, /planetary-node-tags/);
    assert.match(planetaryOrbitMap, /planetary-node-tag/);
    assert.match(planetaryOrbitMap, /getCameraProfile/);
    assert.match(planetaryOrbitMap, /getOrbitProfiles/);
    assert.match(planetaryOrbitMap, /PLANETARY_ATLAS_THRESHOLD/);
    assert.match(planetaryOrbitMap, /while \(start < total\)/);
    assert.match(planetaryOrbitMap, /orbitCapacities/);
    assert.match(planetaryOrbitMap, /orbitProfiles\.map/);
    assert.match(planetaryOrbitMap, /planetSprites/);
    assert.match(planetaryOrbitMap, /corePlanetSprites/);
    assert.match(planetaryOrbitMap, /kenney-planets\/planet00\.png/);
    assert.match(planetaryOrbitMap, /kenney-planets\/planet09\.png/);
    assert.match(planetaryOrbitMap, /--planet-sprite/);
    assert.match(planetaryOrbitMap, /--planet-core-sprite/);
    assert.match(planetaryOrbitMap, /activeId/);
    assert.match(planetaryOrbitMap, /data-active/);
    assert.doesNotMatch(planetaryOrbitMap, /shouldUseReadableAtlas/);
    assert.match(planetaryOrbitMap, /const layoutMode = getLayoutMode\(items\.length\);/);
    assert.match(planetaryOrbitMap, /const usesDetailOrbit = mode === 'detail' && layoutMode === 'orbit';/);
    assert.match(planetaryOrbitMap, /data-layout=\{layoutMode\}/);
    assert.match(planetaryOrbitMap, /data-ring-count=\{orbitProfiles\.length\}/);
    assert.match(planetaryOrbitMap, /data-zoom/);
    assert.match(planetaryOrbitMap, /--planet-camera-scale/);
    assert.match(planetaryOrbitMap, /--planet-core-scale/);
    assert.match(planetaryOrbitMap, /--planet-info-scale/);
    assert.match(planetaryOrbitMap, /--planet-map-height/);
    assert.match(planetaryOrbitMap, /--planet-ring-width/);
    assert.match(planetaryOrbitMap, /--planet-ring-height/);
    assert.match(planetaryOrbitMap, /--planet-cloud/);
    assert.match(planetaryOrbitMap, /--planet-land/);
    assert.match(planetaryOrbitMap, /--planet-ring-tilt/);
    assert.match(planetaryOrbitMap, /--planet-spin/);
    assert.match(planetaryOrbitMap, /planetary-mini-atmosphere/);
    assert.match(planetaryOrbitMap, /planetary-mini-terrain/);
    assert.match(planetaryOrbitMap, /planetary-mini-clouds/);
    assert.match(planetaryOrbitMap, /planetary-mini-shine/);
    assert.match(planetaryOrbitMap, /\{item\.detail\}/);
    assert.doesNotMatch(planetaryOrbitMap, /getPreviewText/);
    assert.match(spaceAttribution, /Kenney Planets/);
    assert.match(spaceAttribution, /Creative Commons CC0/);
    assert.match(tagSurfaces, /TagReadingDock/);
    assert.match(aboutRoom, /about-room-toolbar/);
    assert.match(aboutRoom, /about-room-activity/);
    assert.match(photoWallClient, /photowall-album-grid/);
    assert.match(photoWallClient, /\[0, 1, 2\]\.map/);
    assert.match(photoWallClient, /xh-reference-toolbar/);
    assert.match(photoWallClient, /photowall-masonry/);
    assert.match(photoWallClient, /photowall-lightbox/);
  });

  it('keeps tag detail and article pages connected to richer reading surfaces', async () => {
    const [tagPage, postPage, chatterDetailPage] = await Promise.all([
      readFile('app/tags/[tag]/page.tsx', 'utf8'),
      readFile('app/posts/[slug]/page.tsx', 'utf8'),
      readFile('app/chatter/[slug]/page.tsx', 'utf8')
    ]);

    assert.match(tagPage, /ChannelHeader/);
    assert.match(tagPage, /getPageContent\(data\.site, 'tag-detail'\)/);
    assert.match(tagPage, /getPageActions\(page\)/);
    assert.match(tagPage, /formatPageText\(page\.title/);
    assert.match(tagPage, /TagReadingDock/);
    assert.match(postPage, /article-capsule/);
    assert.match(postPage, /post-detail-page/);
    assert.match(postPage, /article-profile-sidebar/);
    assert.doesNotMatch(postPage, /SidebarLyric/);
    assert.match(postPage, /ProfileCard/);
    assert.doesNotMatch(postPage, /extractTableOfContents/);
    assert.match(postPage, /id="article-content"/);
    assert.doesNotMatch(postPage, /recentPosts/);
    assert.match(chatterDetailPage, /subpage article-page chatter-detail-page/);
    assert.match(chatterDetailPage, /chatter-detail-cover/);
    assert.match(chatterDetailPage, /coverImage/);
    assert.match(chatterDetailPage, /article-profile-sidebar/);
    assert.match(chatterDetailPage, /ProfileCard/);
    assert.doesNotMatch(chatterDetailPage, /SidebarLyric/);
    assert.doesNotMatch(chatterDetailPage, /ArticleTOC/);
    assert.doesNotMatch(chatterDetailPage, /extractTableOfContents/);
    assert.doesNotMatch(chatterDetailPage, /article-summary/);
    assert.doesNotMatch(chatterDetailPage, /chatter\.summary/);

    const [articleToc, blogLib] = await Promise.all([
      readFile('components/article/ArticleTOC.tsx', 'utf8'),
      readFile('lib/blog.ts', 'utf8')
    ]);

    assert.match(articleToc, /article-toc-panel/);
    assert.match(articleToc, /IntersectionObserver/);
    assert.match(articleToc, /scrollIntoView/);
    assert.match(articleToc, /aria-current/);
    assert.match(blogLib, /export function extractTableOfContents/);
    assert.match(blogLib, /createHeadingId/);
    assert.match(blogLib, /escapeAttribute\(createHeadingId/);
  });

  it('defines responsive target-site inspired subpage styles', async () => {
    const css = `${await readFile('app/globals.css', 'utf8')}\n${await readFile('app/home-overrides.css', 'utf8')}`;
    const outerFrameRemovalRule = css.match(/\/\* Final outer frame removal[\s\S]*?content: none !important;[\s\S]*?display: none !important;[\s\S]*?\}/)?.[0] ?? '';
    const xinghuisamaImageRules = css.slice(css.indexOf('/* Final XinghuisamaBlogs-style image handling'));
    const orbitMapBeforeRule = extractCssRule(css, '.planetary-orbit-map::before');
    const orbitMapAfterRule = extractCssRule(css, '.planetary-orbit-map::after');
    const orbitMapRules = extractCssRules(css, '.planetary-orbit-map');

    assert.match(css, /\.page-insight-bar/);
    assert.match(css, /\.page-insight-items/);
    assert.match(css, /\.rich-empty/);
    assert.match(css, /\.gallery-masonry/);
    assert.match(css, /\.moment-waterfall/);
    assert.match(css, /\.radio-hero-card/);
    assert.match(css, /\.article-sidebar/);
    assert.match(css, /\.article-profile-sidebar/);
    assert.match(css, /body:has\(:is\(\.post-detail-page, \.chatter-detail-page\)\) \.xh-global-toolbox/);
    assert.match(css, /\.article-toc-panel/);
    assert.match(css, /\.article-toc-list/);
    assert.match(css, /\.friends-board/);
    assert.match(css, /\.friend-node-card/);
    assert.match(css, /\.friend-apply-card/);
    assert.doesNotMatch(css, /\.friend-constellation-stage/);
    assert.doesNotMatch(css, /\.friend-star-node/);
    assert.match(css, /\.chatter-board/);
    assert.match(css, /\.chatter-masonry/);
    assert.match(css, /\.archive-xh-timeline/);
    assert.match(css, /\.archive-tag-rail/);
    assert.match(css, /\.archive-row-xh/);
    assert.match(css, /\.gallery-studio/);
    assert.match(css, /\.gallery-album-overview/);
    assert.match(css, /\.gallery-light-table/);
    assert.match(css, /\.gallery-search-results/);
    assert.match(css, /\.gallery-search-strip/);
    assert.match(css, /\.gallery-polaroid-wall/);
    assert.match(css, /\.channel-hero/);
    assert.match(css, /\.channel-hero-stats/);
    assert.match(css, /\.photowall-world/);
    assert.match(css, /\.photowall-album-grid/);
    assert.match(css, /\.photowall-masonry/);
    assert.match(css, /\.photowall-lightbox/);
    assert.match(css, /\.music-studio/);
    assert.match(css, /\.music-player-dock/);
    assert.match(css, /\.music-dock-volume/);
    assert.match(css, /\.music-volume-cluster/);
    assert.match(css, /\.music-lyrics/);
    assert.match(css, /\.article-radio-card/);
    assert.match(css, /\.archive-switchboard/);
    assert.match(css, /\.archive-card-view/);
    assert.match(css, /\.xh-reference-hero/);
    assert.match(css, /\.xh-reference-toolbar/);
    assert.match(css, /\.xh-reference-surface/);
    assert.match(outerFrameRemovalRule, /\.channel-hero\.xh-reference-hero/);
    assert.match(outerFrameRemovalRule, /\.xh-reference-surface/);
    assert.match(outerFrameRemovalRule, /background: transparent !important/);
    assert.doesNotMatch(outerFrameRemovalRule, /\.xh-site-dashboard|\.project-status-rack|\.project-featured-console|\.project-card/);
    assert.match(css, /\.photowall-album-stack img:nth-child\(2\)/);
    assert.match(xinghuisamaImageRules, /Final XinghuisamaBlogs-style image handling/);
    assert.match(xinghuisamaImageRules, /\.article-cover,[\s\S]*\.post-cover,[\s\S]*aspect-ratio: var\(--xh-reference-cover-ratio\) !important[\s\S]*height: auto !important/);
    assert.match(xinghuisamaImageRules, /\.markdown-body img[\s\S]*height: auto !important[\s\S]*max-height: none !important[\s\S]*object-fit: initial !important/);
    assert.match(xinghuisamaImageRules, /body:has\(\.archive-page\) \.archive-row-cover img,[\s\S]*object-fit: cover !important/);
    assert.match(xinghuisamaImageRules, /\.chatter-cover img \{[\s\S]*object-fit: cover !important/);
    assert.match(xinghuisamaImageRules, /\.photowall-album-stack \{[\s\S]*aspect-ratio: var\(--xh-reference-album-ratio\) !important/);
    assert.match(xinghuisamaImageRules, /\.gallery-polaroid img,[\s\S]*object-fit: cover !important/);
    assert.match(xinghuisamaImageRules, /\.photowall-masonry img[\s\S]*height: auto !important[\s\S]*object-fit: initial !important/);
    assert.match(xinghuisamaImageRules, /\.gallery-lightbox img,[\s\S]*\.photowall-lightbox img[\s\S]*object-fit: contain !important/);
    assert.match(xinghuisamaImageRules, /\.moment-image-grid:not\(\.count-1\) img,[\s\S]*object-fit: cover !important/);
    assert.match(xinghuisamaImageRules, /\.moment-image-grid\.count-1 img[\s\S]*height: auto !important[\s\S]*max-height: 400px !important[\s\S]*object-fit: contain !important/);
    assert.match(css, /Final detail page cover full-image fix/);
    assert.match(css, /:is\(\.post-detail-page, \.chatter-detail-page\) \.article-cover,[\s\S]*aspect-ratio: auto !important;[\s\S]*height: auto !important;[\s\S]*max-height: none !important/);
    assert.match(css, /:is\(\.post-detail-page, \.chatter-detail-page\) \.article-cover img,[\s\S]*position: relative !important;[\s\S]*height: auto !important;[\s\S]*object-fit: initial !important/);
    assert.match(css, /\.moments-stream[\s\S]*grid-template-columns: repeat\(2/);
    assert.match(css, /\.chatter-masonry[\s\S]*grid-template-columns: repeat\(3/);
    assert.match(css, /\.top-nav \.brand span::after/);
    assert.match(css, /grid-template-areas:[\s\S]*"copy"[\s\S]*"media"[\s\S]*"stats"[\s\S]*"signal"/);
    assert.match(css, /\.moments-board/);
    assert.match(css, /\.moments-starchart/);
    assert.match(css, /\.moment-constellation/);
    assert.match(css, /\.moment-star/);
    assert.match(css, /\.planetary-orbit-map/);
    assert.match(orbitMapBeforeRule, /border: 0 !important/);
    assert.match(orbitMapAfterRule, /border: 0 !important/);
    assert.doesNotMatch(orbitMapAfterRule, /radial-gradient\(circle at 50% 50%/);
    assert.match(css, /\.planetary-modebar/);
    assert.match(css, /\.planetary-mini-planet/);
    assert.match(css, /\.planetary-node-info \.planetary-node-tags/);
    assert.match(css, /\.planetary-node-info \.planetary-node-tag/);
    assert.match(css, /\.planetary-node-info[\s\S]*scale\(var\(--planet-info-scale, 1\)\) !important/);
    assert.match(css, /\.planetary-orbit-map\[data-mode="minimal"\] \.planetary-node:is\(:hover, :focus-visible\) \.planetary-node-info,[\s\S]*opacity: 1 !important/);
    assert.doesNotMatch(css, /\.planetary-orbit-map\[data-layout="atlas"\]\[data-mode="minimal"\] \.planetary-node-info \{[\s\S]*?opacity: 1 !important/);
    assert.match(css, /--planet-info-width: var\(--planet-node-info-width, clamp\(188px, 16vw, 252px\)\) !important/);
    assert.match(css, /\.planetary-orbit-map\[data-mode="minimal"\] \.planetary-node \{[\s\S]*pointer-events: none !important/);
    assert.match(css, /\.planetary-orbit-map\[data-mode="minimal"\] \.planetary-mini-planet \{[\s\S]*pointer-events: auto !important/);
    assert.match(css, /\.planetary-node-info[\s\S]*width: var\(--planet-info-width, clamp\(188px, 16vw, 252px\)\) !important/);
    assert.match(css, /\.planetary-node-info[\s\S]*max-width: none !important/);
    assert.match(css, /\.planetary-node\[data-side="left"\] \.planetary-node-info[\s\S]*transform-origin: right center !important/);
    assert.match(css, /\.planetary-modebar button[\s\S]*font-size: 15px !important/);
    assert.match(css, /\.planetary-node-info strong[\s\S]*font-size: 17px !important/);
    assert.match(css, /\.planetary-node-info small,[\s\S]*font-size: 13px !important/);
    assert.match(css, /\.planetary-orbit-map\[data-zoom="deep"\] \.planetary-node-info strong[\s\S]*font-size: 16px !important/);
    assert.match(css, /\.planetary-orbit-map\[data-layout="atlas"\] \.planetary-node-info small[\s\S]*font-size: 14px !important/);
    assert.match(css, /\.planetary-orbit-map\[data-layout="atlas"\] \.planetary-node-info strong[\s\S]*font-size: 18px !important/);
    assert.match(css, /\.planetary-orbit-map\[data-layout="atlas"\] \.planetary-node-info span:not\(\.planetary-node-tags\):not\(\.planetary-node-tag\)[\s\S]*font-size: 14px !important/);
    assert.match(css, /\.planetary-orbit-map\[data-layout="atlas"\] \.planetary-node-info \.planetary-node-tag[\s\S]*font-size: 14px !important/);
    assert.match(css, /\.planetary-orbit-map\[data-layout="atlas"\]\[data-mode="detail"\] \.planetary-node-info strong,[\s\S]*-webkit-line-clamp: unset !important/);
    assert.doesNotMatch(orbitMapRules, /font-size: (?:9|10)px !important/);
    assert.match(css, /\.planetary-node\[data-side="left"\],[\s\S]*grid-template-columns: 58px minmax\(0, 1fr\) !important/);
    assert.match(css, /\.planetary-orbit-map\[data-density="dense"\] \.planetary-node-info,[\s\S]*width: auto !important/);
    assert.match(css, /--planet-camera-scale/);
    assert.match(css, /--planet-core-scale/);
    assert.match(css, /--planet-map-height/);
    assert.match(css, /--planet-sprite/);
    assert.match(css, /var\(--planet-sprite\)/);
    assert.match(css, /--planet-core-sprite/);
    assert.match(css, /var\(--planet-core-sprite\)/);
    assert.match(css, /--planet-ring-width/);
    assert.match(css, /--planet-ring-height/);
    assert.match(css, /\.planetary-orbit-map \.planetary-ring-set span[\s\S]*opacity: 0 !important/);
    assert.match(css, /\.planetary-orbit-map\[data-layout="atlas"\]/);
    assert.match(css, /body:has\(\.tags-page\) \.planetary-orbit-map\.tag-nebula-world\[data-layout="atlas"\],[\s\S]*height: auto !important/);
    assert.match(css, /body:has\(\.tags-page\) \.planetary-orbit-map\.tag-nebula-world\[data-layout="atlas"\],[\s\S]*overflow: visible !important/);
    assert.match(css, /\.planetary-orbit-map\[data-layout="atlas"\] \.planetary-spacefield[\s\S]*min-height: var\(--planet-map-height, 720px\) !important/);
    assert.match(css, /\.planetary-orbit-map\[data-layout="atlas"\] \.planetary-node-layer[\s\S]*padding-bottom: clamp\(18px, 2vw, 32px\) !important/);
    assert.match(css, /grid-template-columns: repeat\(auto-fit, minmax\(min\(230px, 100%\), 1fr\)\) !important/);
    assert.match(css, /\.planetary-node-info :is\(small, strong, em, span\)[\s\S]*min-width: 0 !important/);
    assert.match(css, /\.planetary-node-info :is\(small, strong, em, span\)[\s\S]*word-break: normal !important/);
    assert.match(css, /Atlas side reset: keep readable cards from inheriting orbit-only side placement/);
    assert.match(css, /\.planetary-orbit-map\[data-layout="atlas"\] \.planetary-node:is\(\[data-side="left"\], \[data-side="right"\], \[data-side="below"\], \[data-side="above"\]\)[\s\S]*grid-template-columns: 58px minmax\(0, 1fr\) !important/);
    assert.match(css, /\.planetary-orbit-map\[data-layout="atlas"\] \.planetary-node:is\(\[data-side="left"\], \[data-side="right"\], \[data-side="below"\], \[data-side="above"\]\) \.planetary-mini-planet[\s\S]*grid-row: 1 !important/);
    assert.match(css, /\.planetary-orbit-map\[data-layout="atlas"\] \.planetary-node:is\(\[data-side="left"\], \[data-side="right"\], \[data-side="below"\], \[data-side="above"\]\) \.planetary-node-info[\s\S]*grid-column: 2 !important/);
    assert.match(css, /\.planetary-orbit-map\[data-layout="atlas"\] \.planetary-node-info span:not\(\.planetary-node-tags\):not\(\.planetary-node-tag\)[\s\S]*-webkit-line-clamp: 3 !important/);
    assert.doesNotMatch(css, /--planet-ring-step/);
    assert.match(css, /\.planetary-core-texture::before/);
    assert.match(css, /\.planetary-core-texture::after/);
    assert.match(css, /\.planetary-orbit-map \.planetary-core[\s\S]*z-index: 12 !important/);
    assert.match(css, /\.planetary-orbit-map \.planetary-node-layer[\s\S]*z-index: 18 !important/);
    assert.match(css, /\.planetary-node\[data-active="true"\]/);
    assert.match(css, /planetaryCoreSurfaceSpin/);
    assert.match(css, /planetaryMiniSurfaceSpin/);
    assert.match(css, /planetaryMiniTerrainDrift/);
    assert.match(css, /planetaryMiniCloudDrift/);
    assert.match(css, /planetaryMiniRingSpin/);
    assert.match(css, /planetaryRingTurn/);
    assert.match(css, /\.planetary-mini-atmosphere/);
    assert.match(css, /\.planetary-mini-terrain/);
    assert.match(css, /\.planetary-mini-clouds/);
    assert.match(css, /\.planetary-mini-shine/);
    assert.match(css, /prefers-reduced-motion: reduce/);
    assert.match(css, /\.planetary-node-info span[\s\S]*display: block !important/);
    assert.doesNotMatch(css, /\.planetary-node-info span\s*\{[\s\S]*-webkit-line-clamp: 2/);
    assert.match(css, /carina-nebula-webb\.png/);
    assert.doesNotMatch(css, /jupiter-texture-nasa\.jpg/);
    assert.match(css, /\.moments-stream/);
    assert.match(css, /\.archive-world/);
    assert.match(css, /\.project-world/);
    assert.match(css, /\.project-matrix/);
    assert.match(css, /\.project-matrix-hero/);
    assert.match(css, /\.project-matrix-search/);
    assert.match(css, /\.project-matrix-grid/);
    assert.match(css, /\.project-matrix-card/);
    assert.match(css, /Final projects hero wording sync/);
    assert.match(css, /body:has\(\.projects-page\) \.project-matrix-hero h1,[\s\S]*font-size: clamp\(42px, 6\.6vw, 74px\) !important/);
    assert.match(css, /body:has\(\.projects-page\) \.project-matrix-hero p,[\s\S]*font-size: clamp\(15px, 1vw, 16px\) !important/);
    assert.doesNotMatch(css, /\.link-world/);
    assert.doesNotMatch(css, /\.link-map-stage/);
    assert.match(css, /\.tag-world/);
    assert.match(css, /\.tag-nebula-core/);
    assert.match(css, /\.tag-constellation-grid/);
    assert.match(css, /\.tag-reading-dock/);
    assert.match(css, /\.about-room/);
    assert.match(css, /\.about-room-toolbar/);
    assert.match(css, /\.about-room-activity/);
    assert.match(css, /\.article-kicker/);
    assert.match(css, /body:has\(main\.article-page:not\(\.admin-os\):not\(\.console-page\)\) \.xh-background-image\.is-active/);
    assert.match(css, /body:has\(\.subpage:not\(\.archive-page\)\) \.xh-background-slider \.xh-background-image\.is-active[\s\S]*opacity: 0\.68 !important/);
    assert.match(css, /body:has\(\.subpage:not\(\.archive-page\)\) \.xh-background-slider \.xh-background-image\.is-active[\s\S]*brightness\(0\.68\)/);
    assert.match(css, /body:has\(\.subpage:not\(\.archive-page\)\) \.xh-background-slider \.ib-scene-vignette[\s\S]*mix-blend-mode: multiply !important/);
    assert.match(css, /body:has\(\.projects-page\) \.project-matrix/);
    assert.match(css, /body:has\(\.archive-page\) \.xh-background-image\.is-active\s*\{[\s\S]*opacity: 0\.68 !important/);
    assert.match(css, /body:has\(\.archive-page\) \.xh-background-image\.is-active\s*\{[\s\S]*brightness\(0\.68\)/);
    assert.match(css, /body:has\(\.archive-page\) \.xh-background-slider \.ib-scene-vignette/);
    assert.match(css, /body:has\(\.archive-page\) \.xh-background-slider \.ib-scene-vignette[\s\S]*mix-blend-mode: multiply !important/);
    assert.doesNotMatch(extractCssRule(css, 'body:has(.archive-page) .xh-background-image.is-active'), /blur\(12px\)/);
    assert.doesNotMatch(css, /body:has\(\.archive-page\) \.archive-xh-timeline \.archive-timeline-view\s*\{[\s\S]*margin-top: clamp\(260px, 34vh, 390px\) !important/);
    assert.match(css, /body:has\(\.archive-page\) \.archive-card-view\s*\{[\s\S]*margin: 0 auto 96px !important/);
    assert.match(css, /Final archive toolbar sync/);
    assert.match(css, /body:has\(\.archive-page\) \.archive-filter-console\.xh-reference-toolbar,[\s\S]*width: min\(760px, 100%\) !important/);
    assert.match(css, /body:has\(\.archive-page\) \.archive-filter-console\.xh-reference-toolbar,[\s\S]*background: transparent !important/);
    assert.match(css, /body:has\(\.archive-page\) \.archive-filter-console\.xh-reference-toolbar,[\s\S]*box-shadow: none !important/);
    assert.match(css, /body:has\(\.archive-page\) \.archive-filter-console \.archive-view-toggle[\s\S]*justify-self: center !important/);
    assert.match(css, /Archive active chips: keep the selected label bright and readable in every theme/);
    assert.match(css, /#xh-app-root:has\(\.archive-page\) \.archive-filter-console \.archive-tag-rail button\.is-active[\s\S]*color: #fffaff !important/);
    assert.match(css, /#xh-app-root:has\(\.archive-page\) \.archive-filter-console \.archive-tag-rail button\.is-active span[\s\S]*rgba\(255, 250, 255, 0\.86\) !important/);
    assert.match(css, /Final archive frame sync/);
    assert.match(css, /body:has\(\.archive-page\) \.archive-world\.archive-switchboard\.archive-xh-timeline,[\s\S]*background: transparent !important/);
    assert.match(css, /body:has\(\.archive-page\) \.archive-world\.archive-switchboard\.archive-xh-timeline,[\s\S]*box-shadow: none !important/);
    assert.match(css, /body:has\(\.archive-page\) \.archive-xh-timeline \.archive-timeline-view,[\s\S]*background: transparent !important/);
  });

  it('uses client islands for the photo wall, music, and moments channels', async () => {
    const [photowallPage, musicPage, momentsPage, photoWallClient, musicStudio, momentsBoard] = await Promise.all([
      readFile('app/photowall/page.tsx', 'utf8'),
      readFile('app/music/page.tsx', 'utf8'),
      readFile('app/moments/page.tsx', 'utf8'),
      readFile('components/PhotoWallClient.tsx', 'utf8'),
      readFile('components/MusicStudio.tsx', 'utf8'),
      readFile('components/MomentsBoard.tsx', 'utf8')
    ]);

    assert.match(photowallPage, /PhotoWallClient/);
    assert.match(musicPage, /MusicStudio/);
    assert.match(momentsPage, /MomentsBoard/);
    assert.match(photoWallClient, /photowall-album-grid/);
    assert.match(photoWallClient, /photowall-lightbox/);
    assert.match(musicStudio, /music-tabs/);
    assert.match(musicStudio, /music-playlist/);
    assert.match(momentsBoard, /moments-mood-filter/);
    assert.match(momentsBoard, /moments-sort-toggle/);
    assert.match(momentsBoard, /moment-constellation/);
    assert.match(momentsBoard, /PlanetaryOrbitMap/);
    assert.match(momentsBoard, /orbitItems/);
    assert.match(momentsBoard, /moment-image-grid/);
    assert.match(momentsBoard, /MomentComments/);
    assert.match(momentsBoard, /moments-stream/);
    assert.match(momentsPage, /authorName=\{data\.site\.owner \|\| data\.site\.title\}/);
    assert.match(momentsPage, /avatar=\{data\.site\.avatar\}/);
    assert.match(momentsBoard, /displayName/);
    assert.match(momentsBoard, /displayAvatar/);
    assert.doesNotMatch(momentsBoard, /鏄熷笨鎵嬭/);
    assert.doesNotMatch(momentsBoard, /闀挎矙 \/ Changsha|moment-location/);
  });
  it('shares the home relic controls with subpages while keeping page-specific positioning separate', async () => {
    const css = await readFile('app/home-overrides.css', 'utf8');
    const sharedScope = 'body:has(:is(.xh-clean-home, .subpage))';
    const sharedRelicStart = css.indexOf('/* Unified RPG relic controls: one frame system for season and day/night artifacts. */');

    assert.notEqual(sharedRelicStart, -1, 'Missing shared relic controls section');
    const sharedRelicCss = css.slice(sharedRelicStart);

    assert.match(sharedRelicCss, new RegExp(sharedScope.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.match(sharedRelicCss, /--xh-relic-size: 76px/);
    assert.match(sharedRelicCss, /--xh-relic-orbit: 60px/);
    assert.match(sharedRelicCss, /body:has\(:is\(\.xh-clean-home, \.subpage\)\) :is\(\.xh-theme-switch, \.xh-season-switch\) > \.xh-switch-info-card/);
    assert.match(sharedRelicCss, /body:has\(:is\(\.xh-clean-home, \.subpage\)\) \.xh-relic-glyph/);
    assert.match(sharedRelicCss, /body:has\(:is\(\.xh-clean-home, \.subpage\)\) \.xh-relic-aura-layer/);
    assert.match(sharedRelicCss, /body:has\(:is\(\.xh-clean-home, \.subpage\)\) \.xh-theme-switch-body/);
    assert.match(sharedRelicCss, /body:has\(:is\(\.xh-clean-home, \.subpage\)\) \.xh-season-switch-icon/);
    assert.match(sharedRelicCss, /body:has\(:is\(\.xh-clean-home, \.subpage\)\) \.xh-theme-switch\.is-transitioning\[data-next-mode="night"\]/);
    assert.match(sharedRelicCss, /body:has\(:is\(\.xh-clean-home, \.subpage\)\) \.xh-theme-switch \.xh-theme-switch-orbit/);
    assert.match(sharedRelicCss, /Final relic core alignment: explicitly center both cores and their SVG artwork/);
    assert.match(sharedRelicCss, /\.xh-season-switch \.xh-season-switch-icon\.is-current,[\s\S]*\.xh-season-switch \.xh-season-switch-icon\.is-next,[\s\S]*\.xh-theme-switch \.xh-theme-switch-body[\s\S]*inset: auto !important;[\s\S]*right: auto !important;[\s\S]*bottom: auto !important;[\s\S]*place-items: center !important;[\s\S]*transform: translate\(-50%, -50%\) !important/);
    assert.match(sharedRelicCss, /\.xh-season-switch \.xh-season-switch-icon > \.xh-relic-glyph,[\s\S]*\.xh-theme-switch \.xh-theme-switch-body > \.xh-relic-glyph[\s\S]*position: absolute !important;[\s\S]*right: auto !important;[\s\S]*bottom: auto !important;[\s\S]*transform: translate\(-50%, -50%\) !important/);
    assert.match(sharedRelicCss, /@media \(max-width: 520px\)[\s\S]*--xh-relic-size: 68px;[\s\S]*--xh-relic-orbit: 54px/);
    assert.match(sharedRelicCss, /@media \(max-width: 520px\)[\s\S]*\.xh-season-switch[\s\S]*top: max\(76px,[\s\S]*\.xh-theme-switch[\s\S]*top: max\(154px,/);
    assert.match(sharedRelicCss, /Subpage relic spacing: preserve the floating rail while preventing 76px controls from overlapping/);
    assert.match(sharedRelicCss, /@media \(min-width: 761px\)[\s\S]*body:has\(\.subpage\) \.xh-season-switch[\s\S]*translate: 0 -22px !important/);
    assert.match(css, /body:has\(\.admin-private-page\) \.xh-season-switch,[^}]*display: none !important/);
  });
});
