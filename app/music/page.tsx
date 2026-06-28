import { EmptyState, MusicTrackCard, PageHero, PageInsightBar, RadioHeroCard } from '@/components/SectionBlocks';
import { SiteNav } from '@/components/SiteNav';
import { getBlogData } from '@/lib/blog';
import { staticPageMetadata } from '@/lib/seo';

export const metadata = staticPageMetadata.music;

export default async function MusicPage() {
  const data = await getBlogData();
  const playableTracks = data.site.music.filter((track) => track.url);
  const activeTrack = playableTracks[0] ?? data.site.music[0];

  return (
    <main className="subpage music-page" style={{ '--theme': data.site.themeColor, '--accent': data.site.accentColor } as React.CSSProperties}>
      <SiteNav title={data.site.title} />
      <PageHero eyebrow="Music" title="星屿电台" description="写作、阅读和编码时的背景歌单。现在先以封面、场景和说明维护，接入真实音频后可直接播放。" />
      <PageInsightBar
        items={[
          { label: '曲目', value: data.site.music.length, caption: '歌单数量' },
          { label: '可播', value: playableTracks.length, caption: '已配置音频地址' },
          { label: '用途', value: 'Focus', caption: '阅读写作背景' }
        ]}
        action={{ href: '/console', label: '管理歌单' }}
      />
      <RadioHeroCard track={activeTrack} total={data.site.music.length} />
      <section className="main-shell track-list" aria-label="全部歌单">
        {data.site.music.length === 0 ? <EmptyState title="暂无音乐" description="在内容数据中添加曲目后，这里会成为站点电台。" /> : null}
        {data.site.music.map((track, index) => <MusicTrackCard track={track} index={index} key={`${track.title}-${index}`} />)}
      </section>
    </main>
  );
}
