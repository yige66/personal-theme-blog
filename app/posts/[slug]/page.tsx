import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SiteNav } from '@/components/SiteNav';
import { estimateReadingMinutes, formatDate, getBlogData, getPostBySlug, getPublishedPosts, renderMarkdown } from '@/lib/blog';
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

  return (
    <main className="article-page" style={{ '--theme': data.site.themeColor, '--accent': data.site.accentColor } as React.CSSProperties}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLd(articleJsonLd) }} />
      <SiteNav title={data.site.title} />
      <section className="main-shell article-layout">
        <article className="article-shell">
          <div className="article-cover">
            <Image src={post.cover || data.site.heroImage} alt={`${post.title} 封面`} width={980} height={520} priority />
          </div>
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
        <aside className="article-sidebar" aria-label="文章侧栏">
          <section>
            <Image src={data.site.avatar} alt={`${data.site.owner} 的头像`} width={88} height={88} />
            <strong>{data.site.owner}</strong>
            <span>{data.site.role}</span>
          </section>
          {recentPosts.length ? (
            <section>
              <h2>最近文章</h2>
              {recentPosts.map((item) => (
                <Link href={`/posts/${item.slug}`} key={item.id}>{item.title}</Link>
              ))}
            </section>
          ) : null}
          <section>
            <h2>评论</h2>
            <p>{data.site.comments.enabled ? data.site.comments.provider : '评论系统待配置。后台已预留 GitHub Issues / Gitalk 类配置。'}</p>
          </section>
        </aside>
      </section>
    </main>
  );
}
