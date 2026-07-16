import Image from 'next/image';
import { notFound } from 'next/navigation';
import { GitHubComments } from '@/components/comments/GitHubComments';
import { ProfileCard } from '@/components/ProfileCard';
import { SiteNav } from '@/components/SiteNav';
import { formatDate, getBlogData, getBlogStats, getChatterBySlug, renderMarkdown } from '@/lib/blog';

export default async function ChatterDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [data, chatter, stats] = await Promise.all([getBlogData(), getChatterBySlug(slug), getBlogStats()]);

  if (!chatter) {
    notFound();
  }

  const html = renderMarkdown(chatter.content);
  const coverImage = chatter.cover || data.site.heroImage;

  return (
    <main className="subpage article-page chatter-detail-page" style={{ '--theme': data.site.themeColor, '--accent': data.site.accentColor } as React.CSSProperties}>
      <SiteNav columns={data.site.columns} title={data.site.title} brandSuffix={data.site.brandSuffix} />
      <section className="main-shell article-layout">
        <article className="article-shell article-capsule">
          <div className="article-cover chatter-detail-cover" data-motion="image-scale">
            <Image src={coverImage} alt={`${chatter.title} 封面`} width={1080} height={620} priority />
          </div>
          <div className="article-kicker">
            <p className="eyebrow">Chatter / {chatter.mood || 'Notebook'}</p>
            <span>{formatDate(chatter.date)}</span>
          </div>
          <h1>{chatter.title}</h1>
          {chatter.tags.length ? (
            <div className="article-tags">
              {chatter.tags.map((tag) => <span key={tag}>{tag}</span>)}
            </div>
          ) : null}
          <div className="markdown-body" id="article-content" dangerouslySetInnerHTML={{ __html: html }} />
        </article>
        <aside className="article-sidebar article-profile-sidebar" aria-label="作者资料">
          <ProfileCard site={data.site} stats={stats} />
        </aside>
      </section>
      <GitHubComments config={data.site.comments} term={`/chatter/${chatter.slug}`} title={chatter.title} />
    </main>
  );
}
