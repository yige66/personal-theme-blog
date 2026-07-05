import { GalleryWall } from '@/components/GalleryWall';
import { ChannelHeader } from '@/components/ChannelHeader';
import { EmptyState } from '@/components/SectionBlocks';
import { SiteNav } from '@/components/SiteNav';
import { formatPageText, getBlogData, getPageActions, getPageContent, getPageStatLabel } from '@/lib/blog';
import { staticPageMetadata } from '@/lib/seo';

export const metadata = staticPageMetadata.gallery;

export default async function GalleryPage() {
  const data = await getBlogData();
  const collectionCount = data.site.gallery.filter((item) => item.featured || item.items?.length).length || data.site.gallery.length;
  const totalImages = data.site.gallery.reduce((total, item) => total + Math.max(1, item.items?.length ?? 0), 0);
  const page = getPageContent(data.site, 'gallery');

  return (
    <main className="subpage gallery-page" style={{ '--theme': data.site.themeColor, '--accent': data.site.accentColor } as React.CSSProperties}>
      <SiteNav columns={data.site.columns} title={data.site.title} brandSuffix={data.site.brandSuffix} />
      <ChannelHeader
        eyebrow={page.eyebrow}
        title={page.title}
        description={formatPageText(page.description, { collectionCount, totalImages })}
        stats={[
          { label: getPageStatLabel(page, 0, '图片'), value: totalImages },
          { label: getPageStatLabel(page, 1, '图集'), value: collectionCount },
          { label: getPageStatLabel(page, 2, '展示'), value: 'Masonry' }
        ]}
        actions={getPageActions(page)}
        signal={page.signal}
      />
      {data.site.gallery.length ? <GalleryWall items={data.site.gallery} /> : null}
      {data.site.gallery.length === 0 ? (
        <section className="main-shell gallery-masonry" aria-label="全部相册素材">
          <EmptyState title={page.emptyTitle} description={page.emptyDescription} />
        </section>
      ) : null}
    </main>
  );
}
