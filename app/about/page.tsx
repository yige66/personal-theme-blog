import { staticPageMetadata } from '@/lib/seo';

export const metadata = staticPageMetadata.about;

import Link from 'next/link';
import { PageHero } from '@/components/SectionBlocks';
import { SiteNav } from '@/components/SiteNav';
import { getBlogData, getBlogStats } from '@/lib/blog';

export default async function AboutPage() {
  const [data, stats] = await Promise.all([getBlogData(), getBlogStats()]);

  return (
    <main className="subpage" style={{ '--theme': data.site.themeColor, '--accent': data.site.accentColor } as React.CSSProperties}>
      <SiteNav title={data.site.title} />
      <PageHero eyebrow="About" title={data.site.owner} description={data.site.bio} />
      <section className="main-shell about-grid">
        <article className="glass-card about-card">
          <p className="eyebrow">Now</p>
          <h2>{data.site.role}</h2>
          <p>{data.site.status}</p>
          <p>{data.site.motto}</p>
        </article>
        <article className="glass-card about-card">
          <p className="eyebrow">Stats</p>
          <h2>站点概况</h2>
          <div className="about-stats">
            <span><strong>{stats.posts}</strong>文章</span>
            <span><strong>{stats.projects}</strong>项目</span>
            <span><strong>{stats.notes}</strong>动态</span>
            <span><strong>{stats.gallery}</strong>图片</span>
          </div>
        </article>
        <article className="glass-card about-card">
          <p className="eyebrow">Contact</p>
          <h2>找到我</h2>
          <p>{data.site.location}</p>
          <p>{data.site.email}</p>
          <div className="project-actions">
            <a href={data.site.github} target="_blank" rel="noreferrer">GitHub</a>
            <Link href="/links">友链</Link>
          </div>
        </article>
      </section>
    </main>
  );
}
