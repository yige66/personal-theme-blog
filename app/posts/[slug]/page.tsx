import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { CSSProperties } from 'react';
import { GitHubComments } from '@/components/comments/GitHubComments';
import { ProfileCard } from '@/components/ProfileCard';
import { SiteNav } from '@/components/SiteNav';
import { estimateReadingMinutes, formatDate, getBlogData, getBlogStats, getPostBySlug, renderMarkdown } from '@/lib/blog';
import { createArticleJsonLd, createPostMetadata, toJsonLd } from '@/lib/seo';

type PostPageProps = {
  params: Promise<{ slug: string }>;
};

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
  const [post, data, stats] = await Promise.all([getPostBySlug(slug), getBlogData(), getBlogStats()]);

  if (!post) {
    notFound();
  }

  const articleJsonLd = createArticleJsonLd(data.site, post);
  const readingMinutes = estimateReadingMinutes(post.content);

  return (
    <main className="subpage article-page post-detail-page" style={{ '--theme': data.site.themeColor, '--accent': data.site.accentColor } as CSSProperties}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLd(articleJsonLd) }} />
      <SiteNav columns={data.site.columns} title={data.site.title} brandSuffix={data.site.brandSuffix} />
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
        <aside className="article-sidebar article-profile-sidebar" aria-label="作者资料">
          <ProfileCard site={data.site} stats={stats} />
        </aside>
      </section>
      <GitHubComments config={data.site.comments} term={`/posts/${post.slug}`} title={post.title} />
    </main>
  );
}
