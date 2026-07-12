import { ChannelHeader } from '@/components/ChannelHeader';
import { GitHubComments } from '@/components/comments/GitHubComments';
import { FriendsBoardClient } from '@/components/FriendsBoardClient';
import { SiteNav } from '@/components/SiteNav';
import { formatPageText, getBlogData, getPageActions, getPageContent, getPageStatLabel } from '@/lib/blog';
import { staticPageMetadata } from '@/lib/seo';

export const metadata = staticPageMetadata.friends;

export default async function FriendsPage() {
  const data = await getBlogData();
  const page = getPageContent(data.site, 'friends');

  return (
    <main className="subpage friends-page" style={{ '--theme': data.site.themeColor, '--accent': data.site.accentColor } as React.CSSProperties}>
      <SiteNav columns={data.site.columns} title={data.site.title} brandSuffix={data.site.brandSuffix} />
      <ChannelHeader
        eyebrow={page.eyebrow}
        title={page.title}
        description={formatPageText(page.description, { linkCount: data.links.length })}
        stats={[
          { label: getPageStatLabel(page, 0, '友链'), value: data.links.length },
          { label: getPageStatLabel(page, 1, '申请'), value: '留言区' },
          { label: getPageStatLabel(page, 2, '留言'), value: data.site.comments.enabled ? '开放' : '关闭' }
        ]}
        actions={getPageActions(page)}
        signal={page.signal}
      />
      <FriendsBoardClient links={data.links} site={data.site} />
      <section id="gitalk-container" className="main-shell friends-comments">
        <GitHubComments config={data.site.comments} term="/friends" title={page.commentTitle || page.title} />
      </section>
    </main>
  );
}