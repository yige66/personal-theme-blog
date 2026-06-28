import { staticPageMetadata } from '@/lib/seo';

export const metadata = staticPageMetadata.gallery;

import { EmptyState, GalleryTile, PageHero, PageInsightBar } from '@/components/SectionBlocks';
import { SiteNav } from '@/components/SiteNav';
import { getBlogData } from '@/lib/blog';

export default async function GalleryPage() {
  const data = await getBlogData();

  return (
    <main className="subpage" style={{ '--theme': data.site.themeColor, '--accent': data.site.accentColor } as React.CSSProperties}>
      <SiteNav title={data.site.title} />
      <PageHero eyebrow="Gallery" title="灵境照片墙" description="用于陈列头像、头图、项目截图、生活照片和视觉碎片，图片可以在后台数据中替换。" />
      <PageInsightBar items={[{ label: '图片', value: data.site.gallery.length, caption: '相册素材' }, { label: '来源', value: 'CMS', caption: '后台上传路径' }, { label: '展示', value: 'Grid', caption: '响应式照片墙' }]} action={{ href: '/console', label: '管理素材' }} />
      <section className="main-shell gallery-grid page-grid">
        {data.site.gallery.length === 0 ? <EmptyState title="暂无相册素材" description="上传图片并加入相册后，照片墙会在这里展开。" /> : null}
        {data.site.gallery.map((item) => <GalleryTile item={item} key={item.title} />)}
      </section>
    </main>
  );
}
