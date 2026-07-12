import { ChannelHeader } from '@/components/ChannelHeader';
import { PhotoWallClient } from '@/components/PhotoWallClient';
import { EmptyState } from '@/components/SectionBlocks';
import { SiteNav } from '@/components/SiteNav';
import { formatPageText, getBlogData, getPageActions, getPageContent, getPageStatLabel } from '@/lib/blog';
import { staticPageMetadata } from '@/lib/seo';

export const metadata = staticPageMetadata.photowall;

export default async function PhotoWallPage() {
  const data = await getBlogData();
  const albumCount = data.site.gallery.length;
  const totalImages = data.site.gallery.reduce((total, item) => total + Math.max(1, item.items?.length ?? 0), 0);
  const page = getPageContent(data.site, 'photowall');

  return (
    <main className="subpage photowall-page" style={{ '--theme': data.site.themeColor, '--accent': data.site.accentColor } as React.CSSProperties}>
      <SiteNav columns={data.site.columns} title={data.site.title} brandSuffix={data.site.brandSuffix} />
      <ChannelHeader
        eyebrow={page.eyebrow}
        title={page.title}
        description={formatPageText(page.description, { albumCount, totalImages })}
        stats={[
          { label: getPageStatLabel(page, 0, '图集'), value: albumCount },
          { label: getPageStatLabel(page, 1, '照片'), value: totalImages },
          { label: getPageStatLabel(page, 2, '浏览'), value: 'Album' }
        ]}
        actions={getPageActions(page)}
        signal={page.signal}
      />
      {data.site.gallery.length ? <PhotoWallClient items={data.site.gallery} /> : null}
      {data.site.gallery.length === 0 ? (
        <section className="main-shell gallery-masonry" aria-label="全部相册素材">
          <EmptyState title={page.emptyTitle} description={page.emptyDescription} />
        </section>
      ) : null}
    </main>
  );
}
