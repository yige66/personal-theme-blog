import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

describe('subpage experience surfaces', () => {
  it('keeps index pages connected to page scenes and channel worlds', async () => {
    const pageExpectations = [
      ['app/archive/page.tsx', /PageScene/, /ArchiveSwitchboard/],
      ['app/projects/page.tsx', /PageScene/, /ProjectShowcase/],
      ['app/gallery/page.tsx', /PageScene/, /GalleryWall|EmptyState/],
      ['app/photowall/page.tsx', /metadata/, /gallery\/page/],
      ['app/moments/page.tsx', /PageScene/, /MomentsBoard|EmptyState/],
      ['app/chatter/page.tsx', /PageScene/, /ChatterMasonry/],
      ['app/music/page.tsx', /PageScene/, /MusicStudio|EmptyState/],
      ['app/links/page.tsx', /PageScene/, /LinkStarMap/],
      ['app/friends/page.tsx', /PageScene/, /FriendsBoard/],
      ['app/timeline/page.tsx', /PageScene/, /TimelineArchive/],
      ['app/tags/page.tsx', /PageScene/, /TagNebula/]
    ];

    for (const [file, insight, world] of pageExpectations) {
      const source = await readFile(file, 'utf8');
      assert.match(source, insight, file);
      assert.match(source, world, file);
    }

    const worlds = await readFile('components/ChannelWorlds.tsx', 'utf8');
    const archiveSwitchboard = await readFile('components/ArchiveSwitchboard.tsx', 'utf8');
    assert.match(worlds, /EmptyState/);
    assert.match(archiveSwitchboard, /archive-view-toggle/);
    assert.match(archiveSwitchboard, /archive-tag-rail/);
    assert.match(archiveSwitchboard, /selectedTag/);
    assert.match(archiveSwitchboard, /post\.tags\.includes\(selectedTag\)/);
    assert.match(archiveSwitchboard, /role="tab"/);
    assert.match(archiveSwitchboard, /aria-selected/);
    assert.match(archiveSwitchboard, /aria-controls/);
    assert.match(archiveSwitchboard, /role="tabpanel"/);
    assert.match(archiveSwitchboard, /archive-card-view/);
    assert.match(archiveSwitchboard, /archive-timeline-view/);
    assert.match(worlds, /ProjectShowcase/);
    assert.match(worlds, /project-workshop-header/);
    assert.match(worlds, /project-featured-console/);
    assert.match(worlds, /project-exhibit-grid/);
    assert.match(worlds, /project-status-rack/);
    assert.match(worlds, /project-world-rail/);
    assert.match(worlds, /LinkStarMap/);
    assert.match(worlds, /FriendsBoard/);
    assert.match(worlds, /friend-node-card/);
    assert.match(worlds, /ChatterMasonry/);
    assert.match(worlds, /chatter-masonry/);
    assert.match(worlds, /TimelineArchive/);
    assert.match(worlds, /timeline-spine/);
    assert.match(worlds, /link-map-stage/);
    assert.match(worlds, /link-constellation-lines/);
    assert.match(worlds, /TagNebula/);
    assert.match(worlds, /--tag-tilt/);
    assert.match(worlds, /tag-nebula-orbit/);
    assert.match(worlds, /TagReadingDock/);
    assert.match(worlds, /AboutRoom/);
    assert.match(worlds, /about-room-toolbar/);
    assert.match(worlds, /about-room-activity/);
  });

  it('keeps tag detail and article pages connected to richer reading surfaces', async () => {
    const [tagPage, postPage] = await Promise.all([
      readFile('app/tags/[tag]/page.tsx', 'utf8'),
      readFile('app/posts/[slug]/page.tsx', 'utf8')
    ]);

    assert.match(tagPage, /PageScene/);
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
    const css = await readFile('app/globals.css', 'utf8');
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
    assert.match(css, /\.chatter-board/);
    assert.match(css, /\.chatter-masonry/);
    assert.match(css, /\.timeline-world/);
    assert.match(css, /\.timeline-spine/);
    assert.match(css, /\.archive-xh-timeline/);
    assert.match(css, /\.archive-tag-rail/);
    assert.match(css, /\.archive-row-xh/);
    assert.match(css, /\.gallery-studio/);
    assert.match(css, /\.gallery-album-overview/);
    assert.match(css, /\.gallery-light-table/);
    assert.match(css, /\.gallery-search-results/);
    assert.match(css, /\.gallery-search-strip/);
    assert.match(css, /\.gallery-polaroid-wall/);
    assert.match(css, /\.music-studio/);
    assert.match(css, /\.music-status-row/);
    assert.match(css, /\.music-volume-cluster/);
    assert.match(css, /\.music-lyrics/);
    assert.match(css, /\.article-radio-card/);
    assert.match(css, /\.archive-switchboard/);
    assert.match(css, /\.archive-card-view/);
    assert.match(css, /grid-template-areas:[\s\S]*"copy"[\s\S]*"media"[\s\S]*"stats"[\s\S]*"signal"/);
    assert.match(css, /\.moments-board/);
    assert.match(css, /\.moments-stream/);
    assert.match(css, /\.archive-world/);
    assert.match(css, /\.project-world/);
    assert.match(css, /\.project-workshop-header/);
    assert.match(css, /\.project-featured-console/);
    assert.match(css, /\.project-exhibit-grid/);
    assert.match(css, /\.project-status-rack/);
    assert.match(css, /\.project-world-rail/);
    assert.match(css, /\.link-world/);
    assert.match(css, /\.link-map-stage/);
    assert.match(css, /\.link-constellation-lines/);
    assert.match(css, /\.tag-world/);
    assert.match(css, /\.tag-nebula-orbit/);
    assert.match(css, /\.tag-reading-dock/);
    assert.match(css, /\.about-room/);
    assert.match(css, /\.about-room-lightmap/);
    assert.match(css, /\.about-room-toolbar/);
    assert.match(css, /\.about-room-activity/);
    assert.match(css, /\.article-kicker/);
  });

  it('uses client islands for target-like gallery, music, and moments channels', async () => {
    const [galleryPage, musicPage, momentsPage, galleryWall, musicStudio, momentsBoard] = await Promise.all([
      readFile('app/gallery/page.tsx', 'utf8'),
      readFile('app/music/page.tsx', 'utf8'),
      readFile('app/moments/page.tsx', 'utf8'),
      readFile('components/GalleryWall.tsx', 'utf8'),
      readFile('components/MusicStudio.tsx', 'utf8'),
      readFile('components/MomentsBoard.tsx', 'utf8')
    ]);

    assert.match(galleryPage, /GalleryWall/);
    assert.match(musicPage, /MusicStudio/);
    assert.match(momentsPage, /MomentsBoard/);
    assert.match(galleryWall, /gallery-lightbox/);
    assert.match(galleryWall, /gallery-album-rail/);
    assert.match(musicStudio, /music-tabs/);
    assert.match(musicStudio, /music-playlist/);
    assert.match(momentsBoard, /moments-mood-filter/);
    assert.match(momentsBoard, /moments-stream/);
  });
});
