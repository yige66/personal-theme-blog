import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

const curatedFiles = [
  'app/page.tsx',
  'app/about/page.tsx',
  'app/archive/page.tsx',
  'app/console/page.tsx',
  'app/gallery/page.tsx',
  'app/photowall/page.tsx',
  'app/links/page.tsx',
  'app/friends/page.tsx',
  'app/moments/page.tsx',
  'app/chatter/page.tsx',
  'app/chatter/[slug]/page.tsx',
  'app/api/music/route.ts',
  'app/music/page.tsx',
  'app/timeline/page.tsx',
  'app/posts/[slug]/page.tsx',
  'app/projects/page.tsx',
  'app/tags/page.tsx',
  'app/tags/[tag]/page.tsx',
  'components/HomeEffects.tsx',
  'components/BackgroundSlider.tsx',
  'components/SplashScreen.tsx',
  'components/ChannelWorlds.tsx',
  'components/ChannelHeader.tsx',
  'components/PhotoWallClient.tsx',
  'components/channels/AboutRoom.tsx',
  'components/channels/ChatterMasonry.tsx',
  'components/channels/LinkStarMap.tsx',
  'components/channels/ProjectShowcase.tsx',
  'components/channels/TagSurfaces.tsx',
  'components/channels/TimelineArchive.tsx',
  'components/comments/MomentComments.tsx',
  'components/GalleryWall.tsx',
  'components/GlobalToolbox.tsx',
  'components/FriendsBoardClient.tsx',
  'components/LatestPostCarousel.tsx',
  'components/MomentsBoard.tsx',
  'components/MusicStudio.tsx',
  'components/ArchiveSwitchboard.tsx',
  'components/music/CloudPlayerCard.tsx',
  'components/music/LyricStrip.tsx',
  'components/music/MusicProvider.tsx',
  'components/music/SidebarLyric.tsx',
  'components/comments/GitHubComments.tsx',
  'components/PortalSearch.tsx',
  'components/RoomConsole.tsx',
  'components/room/RoomAtmosphere.tsx',
  'components/room/RoomDialogue.tsx',
  'components/room/RoomMarker.tsx',
  'components/room/RoomWalkMap.tsx',
  'components/room/useTypewriter.ts',
  'components/SiteDashboard.tsx',
  'components/SpaceDock.tsx',
  'components/SectionBlocks.tsx',
  'components/SiteNav.tsx',
  'data/blog.json',
  'lib/experience.ts',
  'lib/portal-index.ts',
  'lib/room-engine.ts',
  'lib/seo.ts'
];

describe('source text quality', () => {
  it('does not ship mojibake in curated Chinese UI and content files', async () => {
    const mojibake = /[绔鐨鍥鍦鏄鏂鏍闊鍙鎼寮瑰褰浠鎵]{2,}|�/;

    for (const file of curatedFiles) {
      const source = await readFile(file, 'utf8');
      assert.doesNotMatch(source, mojibake, file);
    }
  });
});
