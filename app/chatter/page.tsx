import { ChannelHeader } from '@/components/ChannelHeader';
import { ChatterMasonry } from '@/components/channels/ChatterMasonry';
import { SiteNav } from '@/components/SiteNav';
import { getBlogData, getChatters } from '@/lib/blog';
import { staticPageMetadata } from '@/lib/seo';

export const metadata = staticPageMetadata.chatter;

export default async function ChatterPage() {
  const [data, chatters] = await Promise.all([getBlogData(), getChatters()]);
  const tags = new Set(chatters.flatMap((chatter) => chatter.tags));

  return (
    <main className="subpage chatter-page" style={{ '--theme': data.site.themeColor, '--accent': data.site.accentColor } as React.CSSProperties}>
      <SiteNav columns={data.site.columns} title={data.site.title} />
      <ChannelHeader
        eyebrow="Chatter"
        title="云端杂谈"
        description="代码、学术、提瓦特与日常碎片的轻文章记录。"
        stats={[
          { label: '杂谈', value: chatters.length },
          { label: '标签', value: tags.size },
          { label: '形式', value: 'Masonry' }
        ]}
        actions={[
          { href: '/moments', label: '生活动态' },
          { href: '/archive', label: '文章归档' }
        ]}
        signal="chatter / light essays / mood cards / masonry stream"
      />
      <ChatterMasonry chatters={chatters} />
    </main>
  );
}
