import { GitHubComments } from '@/components/comments/GitHubComments';
import { ChannelHeader } from '@/components/ChannelHeader';
import { FriendsBoardClient } from '@/components/FriendsBoardClient';
import { SiteNav } from '@/components/SiteNav';
import { getBlogData } from '@/lib/blog';
import { staticPageMetadata } from '@/lib/seo';

export const metadata = staticPageMetadata.friends;

export default async function FriendsPage() {
  const data = await getBlogData();

  return (
    <main className="subpage friends-page" style={{ '--theme': data.site.themeColor, '--accent': data.site.accentColor } as React.CSSProperties}>
      <SiteNav title={data.site.title} />
      <ChannelHeader
        eyebrow="Friends"
        title="云端引力"
        description="那些散落在赛博宇宙各处的有趣灵魂与神经节点。"
        stats={[
          { label: '友链', value: data.links.length },
          { label: '申请', value: 'Apply' }
        ]}
        signal="friends / cards / apply / comments"
      />
      <FriendsBoardClient links={data.links} site={data.site} />
      <section id="gitalk-container" className="main-shell friends-comments">
        <GitHubComments config={data.site.comments} term="/friends" title="友链" />
      </section>
    </main>
  );
}
