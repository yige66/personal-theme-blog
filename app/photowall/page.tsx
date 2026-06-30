import { ChannelHeader } from '@/components/ChannelHeader';
import { PhotoWallClient } from '@/components/PhotoWallClient';
import { EmptyState } from '@/components/SectionBlocks';
import { SiteNav } from '@/components/SiteNav';
import { getBlogData } from '@/lib/blog';
import { staticPageMetadata } from '@/lib/seo';

export const metadata = staticPageMetadata.gallery;

export default async function PhotoWallPage() {
  const data = await getBlogData();
  const albumCount = data.site.gallery.length;
  const totalImages = data.site.gallery.reduce((total, item) => total + Math.max(1, item.items?.length ?? 0), 0);

  return (
    <main className="subpage photowall-page" style={{ '--theme': data.site.themeColor, '--accent': data.site.accentColor } as React.CSSProperties}>
      <SiteNav title={data.site.title} />
      <ChannelHeader
        eyebrow="Photo Wall"
        title="光影画廊"
        description="定格时间，封存泰拉与现实的每一次心跳。"
        stats={[
          { label: '图集', value: albumCount },
          { label: '照片', value: totalImages },
          { label: '浏览', value: 'Album' }
        ]}
        actions={[
          { href: '/gallery', label: '通用画廊' },
          { href: '/moments', label: '动态记录' }
        ]}
        signal="album entry / stacked covers / fullscreen lightbox"
      />
      {data.site.gallery.length ? <PhotoWallClient items={data.site.gallery} /> : null}
      {data.site.gallery.length === 0 ? (
        <section className="main-shell gallery-masonry" aria-label="全部相册素材">
          <EmptyState title="暂无相册素材" description="上传图片并加入相册后，照片墙会在这里展开。" />
        </section>
      ) : null}
    </main>
  );
}
