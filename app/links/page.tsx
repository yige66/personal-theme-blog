import { staticPageMetadata } from '@/lib/seo';

export const metadata = staticPageMetadata.links;

import { EmptyState, PageHero, PageInsightBar } from '@/components/SectionBlocks';
import { SiteNav } from '@/components/SiteNav';
import { getBlogData } from '@/lib/blog';

export default async function LinksPage() {
  const data = await getBlogData();

  return (
    <main className="subpage" style={{ '--theme': data.site.themeColor, '--accent': data.site.accentColor } as React.CSSProperties}>
      <SiteNav title={data.site.title} />
      <PageHero eyebrow="Links" title="友链与入口" description="把朋友站点、代码仓库、归档入口和常用链接放在同一个可维护的矩阵里。" />
      <PageInsightBar items={[{ label: '链接', value: data.links.length, caption: '站内外入口' }, { label: '外链', value: data.links.filter((link) => link.url.startsWith('http')).length, caption: '外部站点' }, { label: '维护', value: 'CMS', caption: '后台可编辑' }]} action={{ href: '/console', label: '管理友链' }} />
      <section className="main-shell link-grid page-grid">
        {data.links.length === 0 ? <EmptyState title="暂无友链" description="在后台添加链接后，这里会形成可维护的入口矩阵。" /> : null}
        {data.links.map((link) => (
          <a className="glass-card link-card" href={link.url} key={link.title} target={link.url.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
            <strong>{link.title}</strong>
            <span>{link.description}</span>
          </a>
        ))}
      </section>
    </main>
  );
}
