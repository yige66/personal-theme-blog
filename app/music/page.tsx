import { staticPageMetadata } from '@/lib/seo';

export const metadata = staticPageMetadata.music;

import { MusicTrackCard, PageHero } from '@/components/SectionBlocks';
import { SiteNav } from '@/components/SiteNav';
import { getBlogData } from '@/lib/blog';

export default async function MusicPage() {
  const data = await getBlogData();

  return (
    <main className="subpage" style={{ '--theme': data.site.themeColor, '--accent': data.site.accentColor } as React.CSSProperties}>
      <SiteNav title={data.site.title} />
      <PageHero eyebrow="Music" title="星屿电台" description="写作、阅读和编码时的背景歌单。音频地址可以在本地后台继续补充。" />
      <section className="main-shell track-list">
        {data.site.music.map((track, index) => <MusicTrackCard track={track} index={index} key={`${track.title}-${index}`} />)}
      </section>
    </main>
  );
}
