import { GalleryWall } from '@/components/GalleryWall';
import { PageScene } from '@/components/PageScene';
import { EmptyState } from '@/components/SectionBlocks';
import { SiteNav } from '@/components/SiteNav';
import { getBlogData } from '@/lib/blog';
import { staticPageMetadata } from '@/lib/seo';

export const metadata = staticPageMetadata.gallery;

export default async function GalleryPage() {
  const data = await getBlogData();
  const collectionCount = data.site.gallery.filter((item) => item.featured || item.items?.length).length || data.site.gallery.length;
  const totalImages = data.site.gallery.reduce((total, item) => total + Math.max(1, item.items?.length ?? 0), 0);
  const featuredImage = data.site.gallery.find((item) => item.featured) ?? data.site.gallery[0];

  return (
    <main className="subpage gallery-page" style={{ '--theme': data.site.themeColor, '--accent': data.site.accentColor } as React.CSSProperties}>
      <SiteNav title={data.site.title} />
      <PageScene
        eyebrow="Gallery"
        title="灵感照片墙"
        description="头像、头图、项目截图和日常视觉碎片按图集归档。后台上传后，这里会自然长成站点自己的视觉记忆。"
        image={featuredImage?.image || data.site.heroImage}
        imageAlt={featuredImage?.alt || `${data.site.title} 照片墙背景`}
        variant="gallery"
        stats={[
          { label: '图片', value: totalImages, caption: '图集内素材' },
          { label: '图集', value: collectionCount, caption: '集合入口' },
          { label: '展示', value: 'Masonry', caption: '瀑布流与拍立得' }
        ]}
        actions={[
          { href: '/console', label: '管理素材' },
          { href: '/about', label: '个人资料' }
        ]}
        signal="photo wall / polaroid memories / visual archive"
      />
      {data.site.gallery.length ? <GalleryWall items={data.site.gallery} /> : null}
      {data.site.gallery.length === 0 ? (
        <section className="main-shell gallery-masonry" aria-label="全部相册素材">
          <EmptyState title="暂无相册素材" description="上传图片并加入相册后，照片墙会在这里展开。" />
        </section>
      ) : null}
    </main>
  );
}
