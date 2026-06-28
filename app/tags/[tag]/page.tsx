import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHero, PageInsightBar } from '@/components/SectionBlocks';
import { SiteNav } from '@/components/SiteNav';
import { estimateReadingMinutes, formatDate, getBlogData, getPostsByTag, getTagSummaries } from '@/lib/blog';
import { createTagMetadata } from '@/lib/seo';

type TagPageProps = {
  params: Promise<{ tag: string }>;
};

export async function generateStaticParams() {
  const tags = await getTagSummaries();
  return tags.map((tag) => ({ tag: tag.name }));
}

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const { tag } = await params;
  const decodedTag = decodeURIComponent(tag);
  const posts = await getPostsByTag(decodedTag);

  if (posts.length === 0) {
    return { title: '#Not Found' };
  }

  return createTagMetadata(decodedTag, posts.length);
}

export default async function TagPage({ params }: TagPageProps) {
  const { tag } = await params;
  const decodedTag = decodeURIComponent(tag);
  const [data, posts] = await Promise.all([getBlogData(), getPostsByTag(decodedTag)]);

  if (posts.length === 0) {
    notFound();
  }

  return (
    <main className="subpage tag-page" style={{ '--theme': data.site.themeColor, '--accent': data.site.accentColor } as React.CSSProperties}>
      <SiteNav title={data.site.title} />
      <PageHero eyebrow="Tag" title={`#${decodedTag}`} description="同一标签下的文章集合。" />
      <PageInsightBar
        items={[
          { label: '文章', value: posts.length, caption: '当前标签内' },
          { label: '标签', value: decodedTag, caption: '主题聚焦' },
          { label: '阅读', value: 'List', caption: '按发布时间浏览' }
        ]}
        action={{ href: '/tags', label: '全部标签' }}
      />
      <section className="main-shell article-list">
        {posts.map((post, index) => (
          <Link className="article-row" href={`/posts/${post.slug}`} key={post.id}>
            <span className="row-index">{String(index + 1).padStart(2, '0')}</span>
            <span>
              <strong>{post.title}</strong>
              <small>{post.summary}</small>
            </span>
            <span className="row-meta">{formatDate(post.createdAt)} / {estimateReadingMinutes(post.content)} min</span>
          </Link>
        ))}
      </section>
    </main>
  );
}
