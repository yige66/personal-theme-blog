import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

async function readBlogData() {
  return JSON.parse(await readFile('data/blog.json', 'utf8'));
}

describe('XHBlogs-inspired experience density', () => {
  it('curates gallery, moments, and music with richer operational metadata', async () => {
    const data = await readBlogData();

    assert.ok(data.site.gallery.length >= 3);
    assert.ok(data.site.gallery.some((item) => Array.isArray(item.items) && item.items.length >= 2));
    assert.ok(data.notes.length >= 2);
    assert.ok(data.notes.every((note) => !note.tags || note.tags.length === 0));
    assert.ok(data.notes.some((note) => note.mood || (Array.isArray(note.images) && note.images.length > 0)));
    assert.ok(data.site.music.length >= 5);
    assert.ok(data.site.music.every((track) => track.cover));
  });

  it('keeps the XHBlogs content ecology while removing the retired tree entrance', async () => {
    const data = await readBlogData();
    const [blogLib, portalIndex, seo, sitemap, nav, toolbox] = await Promise.all([
      readFile('lib/blog.ts', 'utf8'),
      readFile('lib/portal-index.ts', 'utf8'),
      readFile('lib/seo.ts', 'utf8'),
      readFile('app/sitemap.ts', 'utf8'),
      readFile('lib/experience.ts', 'utf8'),
      readFile('components/GlobalToolbox.tsx', 'utf8')
    ]);

    assert.ok(Array.isArray(data.chatters) && data.chatters.length >= 2);
    assert.ok(Array.isArray(data.links));
    assert.ok(data.links.every((link) => !('badge' in link) && !('since' in link)));
    assert.match(blogLib, /export type BlogChatter/);
    assert.doesNotMatch(blogLib, /getTimelineItems|TimelineItem/);
    assert.match(portalIndex, /type: '杂谈'/);
    assert.match(portalIndex, /type: '友链'/);
    assert.doesNotMatch(portalIndex, /type: '灵境'|\/tree|createChannel\('tree'/);
    for (const route of ['/photowall', '/friends', '/chatter']) {
      assert.ok(seo.includes(`path: '${route}'`), `missing SEO route ${route}`);
      assert.ok(nav.includes(`href: '${route}'`) || toolbox.includes(`href: '${route}'`), `missing navigation route ${route}`);
    }
    assert.doesNotMatch(seo, /path: '\/tree'|path: '\/timeline'/);
    assert.doesNotMatch(nav, /href: '\/tree'|id: 'tree'|灵境/);
    assert.doesNotMatch(toolbox, /href: '\/tree'|灵境/);
    assert.match(sitemap, /getChatters/);
    assert.match(sitemap, /\/chatter\/\$\{chatter\.slug\}/);
  });

  it('renders the upgraded photo wall, moment, and music surfaces', async () => {
    const [blocks, photoWall, moments, music, photoWallClient, momentsBoard, musicStudio, globalCss, homeCss] = await Promise.all([
      readFile('components/SectionBlocks.tsx', 'utf8'),
      readFile('app/photowall/page.tsx', 'utf8'),
      readFile('app/moments/page.tsx', 'utf8'),
      readFile('app/music/page.tsx', 'utf8'),
      readFile('components/PhotoWallClient.tsx', 'utf8'),
      readFile('components/MomentsBoard.tsx', 'utf8'),
      readFile('components/MusicStudio.tsx', 'utf8'),
      readFile('app/globals.css', 'utf8'),
      readFile('app/home-overrides.css', 'utf8')
    ]);
    const css = `${globalCss}\n${homeCss}`;

    assert.match(blocks, /GalleryCollectionCard/);
    assert.match(blocks, /MomentTimelineCard/);
    assert.match(blocks, /MusicTrackCard/);
    assert.match(photoWall, /PhotoWallClient/);
    assert.doesNotMatch(moments, /moment-mood-rail/);
    assert.match(moments, /MomentsBoard/);
    assert.match(music, /MusicStudio/);
    assert.match(momentsBoard, /moments-mood-filter/);
    assert.match(momentsBoard, /moments-sort-toggle/);
    assert.match(momentsBoard, /moment-avatar/);
    assert.match(momentsBoard, /\{note\.title \? <h3>\{note\.title\}<\/h3> : null\}/);
    assert.match(momentsBoard, /moment-image-grid/);
    assert.match(momentsBoard, /moment-lightbox/);
    assert.match(momentsBoard, /event\.key === 'Escape'/);
    assert.match(momentsBoard, /event\.key === 'ArrowLeft'/);
    assert.match(momentsBoard, /event\.key === 'ArrowRight'/);
    assert.match(momentsBoard, /zoomScale/);
    assert.match(momentsBoard, /zoomIn/);
    assert.match(momentsBoard, /zoomOut/);
    assert.match(momentsBoard, /resetZoom/);
    assert.match(momentsBoard, /event\.key === '\+'/);
    assert.match(momentsBoard, /event\.key === '-'/);
    assert.match(momentsBoard, /event\.key === '0'/);
    assert.match(momentsBoard, /aria-modal="true"/);
    assert.match(momentsBoard, /moment-comment-dock/);
    assert.doesNotMatch(momentsBoard, /moment-tags/);
    assert.doesNotMatch(momentsBoard, /note\.tags/);
    assert.match(musicStudio, /music-lyrics/);
    assert.match(musicStudio, /music-playlist/);
    assert.match(musicStudio, /music-command-bar/);
    assert.match(musicStudio, /music-player-dock/);
    assert.match(musicStudio, /music-route-chip/);
    assert.match(musicStudio, /seekToProgress/);
    assert.match(musicStudio, /music-volume-cluster/);
    assert.match(musicStudio, /music-dock-volume/);
    assert.match(musicStudio, /data-long-title/);
    assert.match(musicStudio, /setVolume\(Number\(event\.currentTarget\.value\)\)/);
    assert.doesNotMatch(musicStudio, /music-status-row|music-sync-note|Sync Cloud/);
    assert.match(musicStudio, /activeLyricRef/);
    assert.match(musicStudio, /scrollTo/);
    assert.match(css, /\.gallery-collection/);
    assert.match(css, /\.gallery-studio/);
    assert.match(css, /\.gallery-album-stack/);
    assert.match(css, /\.gallery-light-table/);
    assert.match(css, /\.gallery-search-strip/);
    assert.match(css, /\.moments-board/);
    assert.match(css, /\.moments-stream/);
    assert.match(css, /\.moment-image-grid/);
    assert.match(css, /\.moment-lightbox/);
    assert.match(css, /\.moment-lightbox__zoom/);
    assert.match(css, /\.radio-hero-card/);
    assert.match(css, /\.music-studio/);
    assert.match(css, /\.music-command-bar/);
    assert.match(css, /\.music-player-dock/);
    assert.match(css, /\.music-dock-volume/);
    assert.match(css, /\.music-volume-cluster/);
    assert.match(css, /grid-template-columns: minmax\(340px, 460px\) minmax\(0, 790px\)/);
    assert.match(css, /body:has\(\.music-page\) \.music-current h2:not\(#xh-music-title-lock\)[\s\S]*-webkit-line-clamp: 2/);
    assert.match(css, /Music page control buttons: keep each control as one clean, centered circle\./);
    assert.match(css, /body:has\(\.music-page\) \.music-player-dock :is\(\.music-skip-button, \.music-play-toggle, \.music-mode-button, \.music-dock-volume\)::before/);
    assert.match(css, /body:has\(\.music-page\) \.music-player-dock \.music-skip-button:not\(#xh-music-control-fix\)/);
    assert.match(css, /\.music-dock-volume label:not\(#xh-music-control-fix\)::after[\s\S]*bottom: -12px !important/);
    assert.match(css, /\.music-dock-volume input:not\(#xh-music-control-fix\)\s*\{[^}]*position: absolute !important/);
    assert.match(css, /\.music-dock-volume input:not\(#xh-music-control-fix\)\s*\{[^}]*transform: translate\(-50%, -50%\) rotate\(-90deg\) !important/);
    assert.match(css, /\.music-progress input\s*\{[^}]*min-height: 24px/);
    assert.match(css, /\.music-volume-cluster input\s*\{[^}]*min-height: 24px/);
    assert.match(css, /\.music-dock-volume input:not\(#xh-music-control-fix\)\s*\{[^}]*min-height: 24px !important/);
    assert.match(css, /\.xh-floating-player-volume input\s*\{[^}]*min-height: 24px !important/);
    assert.doesNotMatch(css, /\.music-command-bar input\s*\{/);
    assert.doesNotMatch(css, /\.music-command-bar input:not/);
    assert.doesNotMatch(css, /\.music-progress i\s*\{/);
    assert.doesNotMatch(css, /\.music-progress b\s*\{/);
    assert.doesNotMatch(css, /\.music-stage-volume\b/);
    assert.match(css, /\.music-search-field input:not/);
    assert.match(css, /\.music-volume-cluster input[^}]*\{[^}]*var\(--volume/);
    assert.match(musicStudio, /className="music-volume-cluster"[\s\S]*style=\{\{ '--volume': `\$\{volumePercent\}%` \} as React\.CSSProperties\}/);
    assert.match(css, /width: 46px !important/);
    assert.match(css, /width: 58px !important/);
    assert.match(css, /Final music studio layout/);
    assert.match(css, /body:has\(\.music-page\) \.music-studio:not\(#xh-music-layout\)/);
    assert.match(css, /grid-template-columns: minmax\(300px, 420px\) minmax\(0, 1fr\)/);
    assert.match(css, /body:has\(\.music-page\) \.music-lyrics:not\(#xh-music-layout\)/);
    assert.match(css, /body:has\(\.music-page\) \.music-playlist:not\(#xh-music-layout\)/);
    assert.match(css, /body:has\(\.music-page\) \.music-playlist button\[data-playing="true"\]::after\s*\{[^}]*position: absolute !important[^}]*pointer-events: none !important/);
  });
});
