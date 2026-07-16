import { GitHubComments } from '@/components/comments/GitHubComments';
import { ChannelHeader } from '@/components/ChannelHeader';
import { MusicStudio } from '@/components/MusicStudio';
import { EmptyState } from '@/components/SectionBlocks';
import { SiteNav } from '@/components/SiteNav';
import { formatPageText, getBlogData, getPageActions, getPageContent, getPageStatLabel } from '@/lib/blog';
import { staticPageMetadata } from '@/lib/seo';

export const metadata = staticPageMetadata.music;

export default async function MusicPage() {
  const data = await getBlogData();
  const playableTracks = data.site.music.filter((track) => track.url);
  const page = getPageContent(data.site, 'music');

  return (
    <main className="subpage music-page" style={{ '--theme': data.site.themeColor, '--accent': data.site.accentColor } as React.CSSProperties}>
      <SiteNav columns={data.site.columns} title={data.site.title} brandSuffix={data.site.brandSuffix} />
      <ChannelHeader
        eyebrow={page.eyebrow}
        title={page.title}
        description={formatPageText(page.description, { trackCount: data.site.music.length, playableCount: playableTracks.length })}
        stats={[
          { label: getPageStatLabel(page, 0, '曲目'), value: data.site.music.length },
          { label: getPageStatLabel(page, 1, '可播'), value: playableTracks.length },
          { label: getPageStatLabel(page, 2, '用途'), value: 'Focus' }
        ]}
        actions={getPageActions(page)}
        signal={page.signal}
      />
      {data.site.music.length ? <MusicStudio tracks={data.site.music} /> : null}
      <section className="main-shell track-list" aria-label="全部歌单">
        {data.site.music.length === 0 ? <EmptyState title={page.emptyTitle} description={page.emptyDescription} /> : null}
      </section>
      <GitHubComments config={data.site.comments} term="/music" title={page.commentTitle || page.title} />
    </main>
  );
}
