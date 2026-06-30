import { GitHubComments } from '@/components/comments/GitHubComments';
import { ChannelHeader } from '@/components/ChannelHeader';
import { MusicStudio } from '@/components/MusicStudio';
import { EmptyState } from '@/components/SectionBlocks';
import { SiteNav } from '@/components/SiteNav';
import { getBlogData } from '@/lib/blog';
import { staticPageMetadata } from '@/lib/seo';

export const metadata = staticPageMetadata.music;

export default async function MusicPage() {
  const data = await getBlogData();
  const playableTracks = data.site.music.filter((track) => track.url);

  return (
    <main className="subpage music-page" style={{ '--theme': data.site.themeColor, '--accent': data.site.accentColor } as React.CSSProperties}>
      <SiteNav title={data.site.title} />
      <ChannelHeader
        eyebrow="Music"
        title="星屿电台"
        description="写作、阅读和编码时的背景歌单。先维护封面、场景和说明，接入真实音频后即可变成完整电台。"
        stats={[
          { label: '曲目', value: data.site.music.length },
          { label: '可播', value: playableTracks.length },
          { label: '用途', value: 'Focus' }
        ]}
        actions={[
          { href: '/console', label: '管理歌单' },
          { href: '/archive', label: '边听边读' }
        ]}
        signal="cloud music / focus radio / writing ambience"
      />
      {data.site.music.length ? <MusicStudio tracks={data.site.music} /> : null}
      <section className="main-shell track-list" aria-label="全部歌单">
        {data.site.music.length === 0 ? <EmptyState title="暂无音乐" description="在内容数据中添加曲目后，这里会成为站点电台。" /> : null}
      </section>
      <GitHubComments config={data.site.comments} term="/music" title="星屿电台" />
    </main>
  );
}
