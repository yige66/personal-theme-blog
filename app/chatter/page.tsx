import { ChatterMasonry } from '@/components/ChannelWorlds';
import { PageScene } from '@/components/PageScene';
import { SiteNav } from '@/components/SiteNav';
import { getBlogData, getChatters } from '@/lib/blog';
import { staticPageMetadata } from '@/lib/seo';

export const metadata = staticPageMetadata.chatter;

export default async function ChatterPage() {
  const [data, chatters] = await Promise.all([getBlogData(), getChatters()]);
  const tags = new Set(chatters.flatMap((chatter) => chatter.tags));

  return (
    <main className="subpage chatter-page" style={{ '--theme': data.site.themeColor, '--accent': data.site.accentColor } as React.CSSProperties}>
      <SiteNav title={data.site.title} />
      <PageScene
        eyebrow="Chatter"
        title="云端杂谈"
        description="把短动态和正式文章之间的想法单独拎出来，形成 XHBlogs 那种带封面、心情、标签和瀑布节奏的轻文章频道。"
        image={data.site.heroImage}
        imageAlt={`${data.site.title} chatter cover`}
        variant="moments"
        stats={[
          { label: '杂谈', value: chatters.length, caption: '轻文章条目' },
          { label: '标签', value: tags.size, caption: '可筛选主题' },
          { label: '形态', value: 'Masonry', caption: '瀑布流阅读' }
        ]}
        actions={[
          { href: '/moments', label: '说说动态' },
          { href: '/timeline', label: '聚合时间线' }
        ]}
        signal="chatter / light essays / mood cards / masonry stream"
      />
      <ChatterMasonry chatters={chatters} />
    </main>
  );
}
