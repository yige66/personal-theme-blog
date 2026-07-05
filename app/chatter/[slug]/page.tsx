import { notFound } from 'next/navigation';
import { ArticleTOC } from '@/components/article/ArticleTOC';
import { GitHubComments } from '@/components/comments/GitHubComments';
import { SidebarLyric } from '@/components/music/SidebarLyric';
import { SiteNav } from '@/components/SiteNav';
import { extractTableOfContents, getBlogData, getChatterBySlug, getChatters, renderMarkdown } from '@/lib/blog';

export async function generateStaticParams() {
  const chatters = await getChatters();
  return chatters.map((chatter) => ({ slug: chatter.slug }));
}

export default async function ChatterDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [data, chatter] = await Promise.all([getBlogData(), getChatterBySlug(slug)]);

  if (!chatter) {
    notFound();
  }

  const html = renderMarkdown(chatter.content);
  const toc = extractTableOfContents(chatter.content);

  return (
    <main className="article-page chatter-detail-page" style={{ '--theme': data.site.themeColor, '--accent': data.site.accentColor } as React.CSSProperties}>
      <SiteNav columns={data.site.columns} title={data.site.title} brandSuffix={data.site.brandSuffix} />
      <article className="article-shell main-shell">
        <header className="article-capsule">
          <p className="article-kicker">Chatter / {chatter.mood || 'Notebook'}</p>
          <h1>{chatter.title}</h1>
          <p className="article-summary">{chatter.summary}</p>
          <div className="article-tags">
            {chatter.tags.map((tag) => <span key={tag}>{tag}</span>)}
          </div>
        </header>
        <div className="article-layout">
          <div className="markdown-body" id="article-content" dangerouslySetInnerHTML={{ __html: html }} />
          <aside className="article-sidebar">
            <SidebarLyric />
            <ArticleTOC headings={toc} />
          </aside>
        </div>
      </article>
      <GitHubComments config={data.site.comments} term={`/chatter/${chatter.slug}`} title={chatter.title} />
    </main>
  );
}
