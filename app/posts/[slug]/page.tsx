import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { CSSProperties } from 'react';
import { ArticleTOC } from '@/components/article/ArticleTOC';
import { GitHubComments } from '@/components/comments/GitHubComments';
import { SidebarLyric } from '@/components/music/SidebarLyric';
import { SiteNav } from '@/components/SiteNav';
import { estimateReadingMinutes, extractTableOfContents, formatDate, getBlogData, getPostBySlug, getPublishedPosts, renderMarkdown } from '@/lib/blog';
import { createArticleJsonLd, createPostMetadata, toJsonLd } from '@/lib/seo';

type PostPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const posts = await getPublishedPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const [post, data] = await Promise.all([getPostBySlug(slug), getBlogData()]);

  if (!post) {
    return { title: '文章不存在' };
  }

  return createPostMetadata(data.site, post);
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const [post, data, allPosts] = await Promise.all([getPostBySlug(slug), getBlogData(), getPublishedPosts()]);

  if (!post) {
    notFound();
  }

  const articleJsonLd = createArticleJsonLd(data.site, post);
  const recentPosts = allPosts.filter((item) => item.id !== post.id).slice(0, 4);
  const readingMinutes = estimateReadingMinutes(post.content);
  const toc = extractTableOfContents(post.content);

  return (
    <main className="article-page" style={{ '--theme': data.site.themeColor, '--accent': data.site.accentColor } as CSSProperties}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLd(articleJsonLd) }} />
      <SiteNav title={data.site.title} />
      <section className="main-shell article-layout">
        <article className="article-shell article-capsule">
          <div className="article-cover" data-motion="image-scale">
            <Image src={post.cover || data.site.heroImage} alt={`${post.title} 封面`} width={1080} height={620} priority />
          </div>
          <div className="article-kicker">
            <p className="eyebrow">{post.category}</p>
            <span>{readingMinutes} min read</span>
          </div>
          <h1>{post.title}</h1>
          <p className="article-summary">{post.summary}</p>
          <div className="article-meta">
            <time dateTime={post.createdAt}>{formatDate(post.createdAt)}</time>
            {post.tags.map((tag) => <Link href={`/tags/${encodeURIComponent(tag)}`} key={tag}>{tag}</Link>)}
          </div>
          <div id="article-content" className="markdown-body" dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }} />
        </article>
        <aside className="article-sidebar article-dock" aria-label="文章侧栏">
          <section className="article-author-card">
            <Image src={data.site.avatar} alt={`${data.site.owner} 的头像`} width={88} height={88} />
            <strong>{data.site.owner}</strong>
            <span>{data.site.role}</span>
          </section>
          <SidebarLyric />
          <ArticleTOC headings={toc} />
          {recentPosts.length ? (
            <section>
              <h2>最近文章</h2>
              {recentPosts.map((item) => (
                <Link href={`/posts/${item.slug}`} key={item.id}>{item.title}</Link>
              ))}
            </section>
          ) : null}
        </aside>
      </section>
      <GitHubComments config={data.site.comments} term={`/posts/${post.slug}`} title={post.title} />
    </main>
  );
}
