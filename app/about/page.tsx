import Image from 'next/image';
import Link from 'next/link';
import { PageHero } from '@/components/SectionBlocks';
import { SiteNav } from '@/components/SiteNav';
import { getBlogData, getBlogStats } from '@/lib/blog';
import { staticPageMetadata } from '@/lib/seo';

export const metadata = staticPageMetadata.about;

export default async function AboutPage() {
  const [data, stats] = await Promise.all([getBlogData(), getBlogStats()]);

  return (
    <main className="subpage about-page" style={{ '--theme': data.site.themeColor, '--accent': data.site.accentColor } as React.CSSProperties}>
      <SiteNav title={data.site.title} />
      <PageHero eyebrow="About" title={data.site.owner} description={data.site.bio} />
      <section className="main-shell about-profile">
        <div className="about-cover">
          <Image src={data.site.heroImage} alt={`${data.site.title} 头图`} width={1180} height={520} priority />
        </div>
        <div className="about-avatar">
          <Image src={data.site.avatar} alt={`${data.site.owner} 的头像`} width={160} height={160} />
        </div>
        <div className="about-profile-copy">
          <p className="eyebrow">Now</p>
          <h2>{data.site.role}</h2>
          <p>{data.site.status}</p>
          <p>{data.site.motto}</p>
          <div className="project-actions">
            <a href={data.site.github} target="_blank" rel="noreferrer">GitHub</a>
            <Link href="/links">友链</Link>
          </div>
        </div>
      </section>
      <section className="main-shell about-grid">
        <article className="about-card">
          <p className="eyebrow">Stats</p>
          <h2>站点概况</h2>
          <div className="about-stats">
            <span><strong>{stats.posts}</strong>文章</span>
            <span><strong>{stats.projects}</strong>项目</span>
            <span><strong>{stats.notes}</strong>动态</span>
            <span><strong>{stats.gallery}</strong>图片</span>
          </div>
        </article>
        <article className="about-card">
          <p className="eyebrow">Contact</p>
          <h2>找到我</h2>
          <p>{data.site.location}</p>
          <p>{data.site.email}</p>
        </article>
        <article className="about-card about-activity">
          <p className="eyebrow">Activity</p>
          <h2>维护热力</h2>
          <div aria-label="站点维护热力图">
            {Array.from({ length: 35 }, (_item, index) => (
              <i key={index} style={{ '--level': (index * 7 + stats.posts + stats.notes) % 5 } as React.CSSProperties} />
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
