import { LinkStarMap } from '@/components/ChannelWorlds';
import { PageScene } from '@/components/PageScene';
import { SiteNav } from '@/components/SiteNav';
import { getBlogData } from '@/lib/blog';
import { staticPageMetadata } from '@/lib/seo';

export const metadata = staticPageMetadata.links;

export default async function LinksPage() {
  const data = await getBlogData();

  return (
    <main className="subpage links-page" style={{ '--theme': data.site.themeColor, '--accent': data.site.accentColor } as React.CSSProperties}>
      <SiteNav title={data.site.title} />
      <PageScene
        eyebrow="Friends"
        title="友链与入口"
        description="朋友站点、代码仓库、归档入口和常用链接都放在同一张可维护的关系图里。"
        image={data.site.avatar}
        imageAlt={`${data.site.owner} 的头像`}
        variant="links"
        stats={[
          { label: '链接', value: data.links.length, caption: '站内外入口' },
          { label: '外链', value: data.links.filter((link) => link.url.startsWith('http')).length, caption: '外部站点' },
          { label: '维护', value: 'CMS', caption: '后台可编辑' }
        ]}
        actions={[
          { href: '/console', label: '管理友链' },
          { href: data.site.github, label: 'GitHub' }
        ]}
        signal="friends / repositories / routes / soft connections"
      />
      <LinkStarMap links={data.links} />
    </main>
  );
}
