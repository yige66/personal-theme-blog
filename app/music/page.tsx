import { staticPageMetadata } from '@/lib/seo';

export const metadata = staticPageMetadata.music;

import { EmptyState, MusicTrackCard, PageHero, PageInsightBar } from '@/components/SectionBlocks';
import { SiteNav } from '@/components/SiteNav';
import { getBlogData } from '@/lib/blog';

export default async function MusicPage() {
  const data = await getBlogData();

  return (
    <main className="subpage" style={{ '--theme': data.site.themeColor, '--accent': data.site.accentColor } as React.CSSProperties}>
      <SiteNav title={data.site.title} />
      <PageHero eyebrow="Music" title="星屿电台" description="写作、阅读和编码时的背景歌单。音频地址会跟随内容数据一起发布。" />
      <PageInsightBar items={[{ label: '曲目', value: data.site.music.length, caption: '歌单数量' }, { label: '状态', value: data.site.music.some((track) => track.url) ? 'Ready' : 'Draft', caption: '音频地址配置' }, { label: '用途', value: 'Focus', caption: '阅读写作背景' }]} action={{ href: '/console', label: '管理歌单' }} />
      <section className="main-shell track-list">
        {data.site.music.length === 0 ? <EmptyState title="暂无音乐" description="在内容数据中添加曲目后，这里会成为站点电台。" /> : null}
        {data.site.music.map((track, index) => <MusicTrackCard track={track} index={index} key={`${track.title}-${index}`} />)}
      </section>
    </main>
  );
}
