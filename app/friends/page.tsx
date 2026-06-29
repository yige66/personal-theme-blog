import { GitHubComments } from '@/components/comments/GitHubComments';
import { FriendsBoardClient } from '@/components/FriendsBoardClient';
import { PageScene } from '@/components/PageScene';
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
      <PageScene
        eyebrow="Friends"
        title="友链星团"
        description="复现 XHBlogs 的友链内容面：头像、站点气质、关系节点和申请提示都独立成页，而不是藏在普通链接列表里。"
        image={data.site.avatar}
        imageAlt={`${data.site.owner} avatar`}
        variant="links"
        stats={[
          { label: '友链', value: externalLinks.length, caption: '外部站点' },
          { label: '入口', value: data.links.length, caption: '站内外节点' },
          { label: '格式', value: 'Apply', caption: '交换信息' }
        ]}
        actions={[
          { href: '/links', label: '关系星图' },
          { href: data.site.github, label: 'GitHub' }
        ]}
        signal="friends / avatars / link exchange / network nodes"
      />
      <FriendsBoardClient links={data.links} site={data.site} />
      <GitHubComments config={data.site.comments} term="/friends" title="友链星团" />
    </main>
  );
}
