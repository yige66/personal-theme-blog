import { GitHubComments } from '@/components/comments/GitHubComments';
import { ChannelHeader } from '@/components/ChannelHeader';
import { FriendsBoardClient } from '@/components/FriendsBoardClient';
import { SiteNav } from '@/components/SiteNav';
import { getBlogData } from '@/lib/blog';
import { staticPageMetadata } from '@/lib/seo';

export const metadata = staticPageMetadata.friends;

export default async function FriendsPage() {
  const data = await getBlogData();
  const externalLinks = data.links.filter((link) => link.url.startsWith('http'));

  return (
    <main className="subpage friends-page" style={{ '--theme': data.site.themeColor, '--accent': data.site.accentColor } as React.CSSProperties}>
      <SiteNav title={data.site.title} />
      <ChannelHeader
        eyebrow="Friends"
        title="友链星图"
        description="友链是长期互访的关系网络：头像、站点气质、连接标签和申请格式都独立成面，而不是普通链接列表。"
        stats={[
          { label: '友链', value: externalLinks.length },
          { label: '节点', value: data.links.length },
          { label: '格式', value: 'Apply' }
        ]}
        actions={[
          { href: '/links', label: '关系星图' },
          { href: data.site.github, label: 'GitHub' }
        ]}
        signal="friends / avatars / link exchange / network nodes"
      />
      <FriendsBoardClient links={data.links} site={data.site} />
      <GitHubComments config={data.site.comments} term="/friends" title="友链星图" />
    </main>
  );
}
