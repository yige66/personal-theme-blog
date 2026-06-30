import { ChannelHeader } from '@/components/ChannelHeader';
import { LinkStarMap } from '@/components/channels/LinkStarMap';
import { SiteNav } from '@/components/SiteNav';
import { getBlogData } from '@/lib/blog';
import { staticPageMetadata } from '@/lib/seo';

export const metadata = staticPageMetadata.links;

export default async function LinksPage() {
  const data = await getBlogData();

  return (
    <main className="subpage links-page" style={{ '--theme': data.site.themeColor, '--accent': data.site.accentColor } as React.CSSProperties}>
      <SiteNav title={data.site.title} />
      <ChannelHeader
        eyebrow="Friends"
        title="关系星图"
        description="把友站、代码仓库、归档入口和长期连接放在同一张可维护的关系图里。"
        stats={[
          { label: '链接', value: data.links.length },
          { label: '外链', value: data.links.filter((link) => link.url.startsWith('http')).length },
          { label: '维护', value: 'CMS' }
        ]}
        actions={[
          { href: '/friends', label: '友链申请' },
          { href: data.site.github, label: 'GitHub' }
        ]}
        signal="friends / repositories / routes / soft connections"
      />
      <LinkStarMap links={data.links} />
    </main>
  );
}
