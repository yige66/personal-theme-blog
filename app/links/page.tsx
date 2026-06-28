import { PageHero } from '@/components/SectionBlocks';
import { SiteNav } from '@/components/SiteNav';
import { getBlogData } from '@/lib/blog';

export default async function LinksPage() {
  const data = await getBlogData();

  return (
    <main className="subpage" style={{ '--theme': data.site.themeColor, '--accent': data.site.accentColor } as React.CSSProperties}>
      <SiteNav title={data.site.title} />
      <PageHero eyebrow="Links" title="友链与入口" description="把朋友站点、代码仓库、归档入口和常用链接放在同一个可维护的矩阵里。" />
      <section className="main-shell link-grid page-grid">
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
