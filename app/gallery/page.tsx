import { staticPageMetadata } from '@/lib/seo';

export const metadata = staticPageMetadata.gallery;

import { GalleryTile, PageHero } from '@/components/SectionBlocks';
import { SiteNav } from '@/components/SiteNav';
import { getBlogData } from '@/lib/blog';

export default async function GalleryPage() {
  const data = await getBlogData();

  return (
    <main className="subpage" style={{ '--theme': data.site.themeColor, '--accent': data.site.accentColor } as React.CSSProperties}>
      <SiteNav title={data.site.title} />
      <PageHero eyebrow="Gallery" title="灵境照片墙" description="用于陈列头像、头图、项目截图、生活照片和视觉碎片，图片可以在后台数据中替换。" />
      <section className="main-shell gallery-grid page-grid">
        {data.site.gallery.map((item) => <GalleryTile item={item} key={item.title} />)}
      </section>
    </main>
  );
}
