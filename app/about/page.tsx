import { ChannelHeader } from '@/components/ChannelHeader';
import { AboutRoom } from '@/components/channels/AboutRoom';
import { SiteNav } from '@/components/SiteNav';
import { getBlogData, getBlogStats } from '@/lib/blog';
import { staticPageMetadata } from '@/lib/seo';

export const metadata = staticPageMetadata.about;

export default async function AboutPage() {
  const [data, stats] = await Promise.all([getBlogData(), getBlogStats()]);

  return (
    <main className="subpage about-page" style={{ '--theme': data.site.themeColor, '--accent': data.site.accentColor } as React.CSSProperties}>
      <SiteNav title={data.site.title} />
      <ChannelHeader
        eyebrow="About"
        title={data.site.owner}
        description={data.site.bio}
        stats={[
          { label: '文章', value: stats.posts },
          { label: '项目', value: stats.projects },
          { label: '动态', value: stats.notes }
        ]}
        actions={[
          { href: `mailto:${data.site.email}`, label: '联系我' },
          { href: data.site.github, label: 'GitHub' }
        ]}
        signal={`${data.site.role} / ${data.site.location} / ${data.site.assistantName}`}
      />
      <AboutRoom site={data.site} stats={stats} />
      <section className="main-shell about-grid">
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
        <article className="about-card">
          <p className="eyebrow">Assistant</p>
          <h2>{data.site.assistantName}</h2>
          <p>{data.site.assistantPrompt}</p>
        </article>
      </section>
    </main>
  );
}
