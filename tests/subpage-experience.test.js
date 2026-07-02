import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

describe('subpage experience surfaces', () => {
  it('keeps index pages connected to clean channel headers and page-specific surfaces', async () => {
    const pageExpectations = [
      ['app/archive/page.tsx', /ChannelHeader/, /ArchiveSwitchboard/],
      ['app/projects/page.tsx', /ChannelHeader/, /ProjectShowcase/],
      ['app/gallery/page.tsx', /ChannelHeader/, /GalleryWall|EmptyState/],
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
      aboutRoom,
      photoWallClient
    ] = await Promise.all([
      readFile('components/ChannelWorlds.tsx', 'utf8'),
      readFile('components/ArchiveSwitchboard.tsx', 'utf8'),
      readFile('components/ChannelHeader.tsx', 'utf8'),
      readFile('components/channels/ProjectShowcase.tsx', 'utf8'),
      readFile('components/channels/ChatterMasonry.tsx', 'utf8'),
      readFile('components/channels/TagSurfaces.tsx', 'utf8'),
      readFile('components/channels/AboutRoom.tsx', 'utf8'),
      readFile('components/PhotoWallClient.tsx', 'utf8')
    ]);

    assert.match(channelHeader, /channel-hero/);
    assert.match(channelHeader, /xh-reference-hero/);
    assert.match(archiveSwitchboard, /archive-view-toggle/);
    assert.match(archiveSwitchboard, /archive-tag-rail/);
    assert.match(archiveSwitchboard, /xh-reference-surface/);
    assert.match(archiveSwitchboard, /中枢链路/);
    assert.match(archiveSwitchboard, /矩阵网格/);
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
    assert.match(projectShowcase, /project-workshop-header/);
    assert.match(projectShowcase, /project-starport/);
    assert.match(projectShowcase, /project-orbit-layout/);
    assert.match(projectShowcase, /project-featured-console/);
    assert.match(projectShowcase, /project-exhibit-grid/);
    assert.match(projectShowcase, /project-status-rack/);
    assert.match(chatterMasonry, /chatter-masonry/);
    assert.match(chatterMasonry, /chatter-cover/);
    assert.match(chatterMasonry, /xh-reference-surface/);
    assert.match(tagSurfaces, /--tag-tilt/);
    assert.match(tagSurfaces, /--tag-inverse/);
    assert.match(tagSurfaces, /tag-nebula-core/);
    assert.match(tagSurfaces, /tag-constellation-grid/);
    assert.match(tagSurfaces, /TagReadingDock/);
    assert.match(aboutRoom, /about-room-toolbar/);
    assert.match(aboutRoom, /about-room-activity/);
    assert.match(photoWallClient, /photowall-album-grid/);
    assert.match(photoWallClient, /\[0, 1, 2\]\.map/);
    assert.match(photoWallClient, /xh-reference-toolbar/);
    assert.match(photoWallClient, /photowall-masonry/);
    assert.match(photoWallClient, /photowall-lightbox/);
    assert.doesNotMatch(photoWallClient, /gallery\/page/);
  });

  it('keeps tag detail and article pages connected to richer reading surfaces', async () => {
    const [tagPage, postPage] = await Promise.all([
      readFile('app/tags/[tag]/page.tsx', 'utf8'),
      readFile('app/posts/[slug]/page.tsx', 'utf8')
    ]);

    assert.match(tagPage, /ChannelHeader/);
    assert.match(tagPage, /全部标签/);
    assert.match(tagPage, /TagReadingDock/);
    assert.match(postPage, /article-capsule/);
    assert.match(postPage, /article-dock/);
    assert.match(postPage, /SidebarLyric/);
    assert.match(postPage, /ArticleTOC/);
    assert.match(postPage, /extractTableOfContents/);
    assert.match(postPage, /id="article-content"/);
    assert.match(postPage, /最近文章/);

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
    assert.match(css, /\.page-insight-bar/);
    assert.match(css, /\.page-insight-items/);
    assert.match(css, /\.rich-empty/);
    assert.match(css, /\.gallery-masonry/);
    assert.match(css, /\.moment-waterfall/);
    assert.match(css, /\.radio-hero-card/);
    assert.match(css, /\.article-sidebar/);
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
    assert.match(css, /\.music-status-row/);
    assert.match(css, /\.music-volume-cluster/);
    assert.match(css, /\.music-lyrics/);
    assert.match(css, /\.article-radio-card/);
    assert.match(css, /\.archive-switchboard/);
    assert.match(css, /\.archive-card-view/);
    assert.match(css, /\.xh-reference-hero/);
    assert.match(css, /\.xh-reference-toolbar/);
    assert.match(css, /\.xh-reference-surface/);
    assert.match(css, /\.photowall-album-stack img:nth-child\(2\)/);
    assert.match(css, /\.moments-stream[\s\S]*grid-template-columns: repeat\(2/);
    assert.match(css, /\.chatter-masonry[\s\S]*grid-template-columns: repeat\(3/);
    assert.match(css, /\.top-nav \.brand span::after/);
    assert.match(css, /grid-template-areas:[\s\S]*"copy"[\s\S]*"media"[\s\S]*"stats"[\s\S]*"signal"/);
    assert.match(css, /\.moments-board/);
    assert.match(css, /\.moments-starchart/);
    assert.match(css, /\.moment-constellation/);
    assert.match(css, /\.moment-star/);
    assert.match(css, /\.moments-stream/);
    assert.match(css, /\.archive-world/);
    assert.match(css, /\.project-world/);
    assert.match(css, /\.project-starport/);
    assert.match(css, /\.project-workshop-header/);
    assert.match(css, /\.project-orbit-layout/);
    assert.match(css, /\.project-featured-console/);
    assert.match(css, /\.project-exhibit-grid/);
    assert.match(css, /\.project-status-rack/);
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
    assert.match(css, /body:has\(\.subpage:not\(\.archive-page\)\) \.project-starport/);
    assert.match(css, /body:has\(\.archive-page\) \.xh-background-image\.is-active\s*\{[\s\S]*opacity: 0\.68 !important/);
    assert.match(css, /body:has\(\.archive-page\) \.xh-background-image\.is-active\s*\{[\s\S]*brightness\(0\.68\)/);
    assert.match(css, /body:has\(\.archive-page\) \.xh-background-slider \.ib-scene-vignette/);
    assert.match(css, /body:has\(\.archive-page\) \.xh-background-slider \.ib-scene-vignette[\s\S]*mix-blend-mode: multiply !important/);
    assert.doesNotMatch(css, /body:has\(\.archive-page\) \.xh-background-image\.is-active\s*\{[\s\S]*blur\(12px\)/);
    assert.doesNotMatch(css, /body:has\(\.archive-page\) \.archive-xh-timeline \.archive-timeline-view\s*\{[\s\S]*margin-top: clamp\(260px, 34vh, 390px\) !important/);
    assert.match(css, /body:has\(\.archive-page\) \.archive-card-view\s*\{[\s\S]*margin: 0 auto 96px !important/);
    assert.match(css, /Final archive toolbar sync/);
    assert.match(css, /body:has\(\.archive-page\) \.archive-filter-console\.xh-reference-toolbar,[\s\S]*width: min\(760px, 100%\) !important/);
    assert.match(css, /body:has\(\.archive-page\) \.archive-filter-console\.xh-reference-toolbar,[\s\S]*background: transparent !important/);
    assert.match(css, /body:has\(\.archive-page\) \.archive-filter-console\.xh-reference-toolbar,[\s\S]*box-shadow: none !important/);
    assert.match(css, /body:has\(\.archive-page\) \.archive-filter-console \.archive-view-toggle[\s\S]*justify-self: center !important/);
  });

  it('uses client islands for target-like gallery, music, and moments channels', async () => {
    const [galleryPage, photowallPage, musicPage, momentsPage, galleryWall, photoWallClient, musicStudio, momentsBoard] = await Promise.all([
      readFile('app/gallery/page.tsx', 'utf8'),
      readFile('app/photowall/page.tsx', 'utf8'),
      readFile('app/music/page.tsx', 'utf8'),
      readFile('app/moments/page.tsx', 'utf8'),
      readFile('components/GalleryWall.tsx', 'utf8'),
      readFile('components/PhotoWallClient.tsx', 'utf8'),
      readFile('components/MusicStudio.tsx', 'utf8'),
      readFile('components/MomentsBoard.tsx', 'utf8')
    ]);

    assert.match(galleryPage, /GalleryWall/);
    assert.match(photowallPage, /PhotoWallClient/);
    assert.match(musicPage, /MusicStudio/);
    assert.match(momentsPage, /MomentsBoard/);
    assert.match(galleryWall, /gallery-lightbox/);
    assert.match(galleryWall, /gallery-album-rail/);
    assert.match(photoWallClient, /photowall-album-grid/);
    assert.match(photoWallClient, /photowall-lightbox/);
    assert.match(musicStudio, /music-tabs/);
    assert.match(musicStudio, /music-playlist/);
    assert.match(momentsBoard, /moments-mood-filter/);
    assert.match(momentsBoard, /moments-sort-toggle/);
    assert.match(momentsBoard, /moment-constellation/);
    assert.match(momentsBoard, /moment-star/);
    assert.match(momentsBoard, /--moment-inverse/);
    assert.match(momentsBoard, /moment-image-grid/);
    assert.match(momentsBoard, /MomentComments/);
    assert.match(momentsBoard, /moments-stream/);
  });
});
