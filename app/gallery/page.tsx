import { staticPageMetadata } from '@/lib/seo';

export const metadata = staticPageMetadata.gallery;

import { EmptyState, GalleryCollectionCard, GalleryTile, PageHero, PageInsightBar } from '@/components/SectionBlocks';
import { SiteNav } from '@/components/SiteNav';
import { getBlogData } from '@/lib/blog';

export default async function GalleryPage() {
  const data = await getBlogData();
  const featuredCollections = data.site.gallery.filter((item) => item.featured || item.items?.length);
  const looseItems = data.site.gallery.filter((item) => !featuredCollections.includes(item));
  const totalImages = data.site.gallery.reduce((total, item) => total + Math.max(1, item.items?.length ?? 0), 0);

  return (
    <main className="subpage" style={{ '--theme': data.site.themeColor, '--accent': data.site.accentColor } as React.CSSProperties}>
      <SiteNav title={data.site.title} />
      <PageHero eyebrow="Gallery" title="灵境照片墙" description="从头像、头图、项目截图到日常视觉碎片，按图集持续整理成可回看的站点素材库。" />
      <PageInsightBar items={[{ label: '图片', value: totalImages, caption: '图集内素材' }, { label: '图集', value: featuredCollections.length || data.site.gallery.length, caption: '集合入口' }, { label: '展示', value: 'Mosaic', caption: '响应式照片墙' }]} action={{ href: '/console', label: '管理素材' }} />
      {featuredCollections.length ? (
        <section className="main-shell gallery-collection-grid" aria-label="精选图集">
          {featuredCollections.map((item) => <GalleryCollectionCard item={item} key={item.title} />)}
        </section>
      ) : null}
      <section className="main-shell gallery-grid page-grid" aria-label="全部相册素材">
        {data.site.gallery.length === 0 ? <EmptyState title="暂无相册素材" description="上传图片并加入相册后，照片墙会在这里展开。" /> : null}
        {(looseItems.length ? looseItems : data.site.gallery).map((item) => <GalleryTile item={item} key={item.title} />)}
      </section>
    </main>
  );
}
