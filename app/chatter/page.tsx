import { ChannelHeader } from '@/components/ChannelHeader';
import { ChatterMasonry } from '@/components/channels/ChatterMasonry';
import { SiteNav } from '@/components/SiteNav';
import { formatPageText, getBlogData, getChatters, getPageActions, getPageContent, getPageStatLabel } from '@/lib/blog';
import { staticPageMetadata } from '@/lib/seo';

export const metadata = staticPageMetadata.chatter;

export default async function ChatterPage() {
  const [data, chatters] = await Promise.all([getBlogData(), getChatters()]);
  const tags = new Set(chatters.flatMap((chatter) => chatter.tags));
  const page = getPageContent(data.site, 'chatter');

  return (
    <main className="subpage chatter-page" style={{ '--theme': data.site.themeColor, '--accent': data.site.accentColor } as React.CSSProperties}>
      <SiteNav columns={data.site.columns} title={data.site.title} brandSuffix={data.site.brandSuffix} />
      <ChannelHeader
        eyebrow={page.eyebrow}
        title={page.title}
        description={formatPageText(page.description, { chatterCount: chatters.length, tagCount: tags.size })}
        stats={[
          { label: getPageStatLabel(page, 0, '杂谈'), value: chatters.length },
          { label: getPageStatLabel(page, 1, '标签'), value: tags.size },
          { label: getPageStatLabel(page, 2, '形式'), value: 'Masonry' }
        ]}
        actions={getPageActions(page)}
        signal={page.signal}
      />
      <ChatterMasonry chatters={chatters} />
    </main>
  );
}
