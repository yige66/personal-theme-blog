import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SiteNav } from '@/components/SiteNav';
import { estimateReadingMinutes, formatDate, getBlogData, getPostBySlug, getPublishedPosts, renderMarkdown } from '@/lib/blog';

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

  return {
    title: post.title,
    description: post.summary,
    openGraph: {
      title: post.title,
      description: post.summary,
      type: 'article',
      images: [post.cover],
      siteName: data.site.title
    }
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const [post, data] = await Promise.all([getPostBySlug(slug), getBlogData()]);

  if (!post) {
    notFound();
  }

  return (
    <main className="article-page" style={{ '--theme': data.site.themeColor, '--accent': data.site.accentColor } as React.CSSProperties}>
      <SiteNav title={data.site.title} />
      <article className="article-shell">
        <p className="eyebrow">{post.category}</p>
        <h1>{post.title}</h1>
        <p className="article-summary">{post.summary}</p>
        <div className="article-meta">
          <time dateTime={post.createdAt}>{formatDate(post.createdAt)}</time>
          <span>{estimateReadingMinutes(post.content)} min read</span>
          {post.tags.map((tag) => <Link href={`/tags/${encodeURIComponent(tag)}`} key={tag}>{tag}</Link>)}
        </div>
        <div className="markdown-body" dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }} />
      </article>
      <section className="comment-placeholder">
        <p className="eyebrow">Comments</p>
        <h2>{data.site.comments.enabled ? data.site.comments.provider : '评论系统待配置'}</h2>
        <p>{data.site.comments.enabled ? `仓库：${data.site.comments.repo}` : '后台数据已预留 GitHub Issues / Gitalk 类评论配置，部署后可接入 OAuth。'}</p>
      </section>
    </main>
  );
}
