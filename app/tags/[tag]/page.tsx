import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { TagReadingDock } from '@/components/ChannelWorlds';
import { PageScene } from '@/components/PageScene';
import { SiteNav } from '@/components/SiteNav';
import { getBlogData, getPostsByTag, getTagSummaries } from '@/lib/blog';
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
      <PageScene
        eyebrow="Tag"
        title={`#${decodedTag}`}
        description="同一标签下的文章集合，被收束到一个可继续漫游的阅读舱里。"
        image={posts[0]?.cover || data.site.heroImage}
        imageAlt={`${decodedTag} 标签文章封面`}
        variant="tags"
        stats={[
          { label: '文章', value: posts.length, caption: '当前标签内' },
          { label: '标签', value: decodedTag, caption: '主题聚焦' },
          { label: '阅读', value: 'Dock', caption: '阅读舱浏览' }
        ]}
        actions={[
          { href: '/tags', label: '全部标签' },
          { href: '/archive', label: '时间归档' }
        ]}
        signal={`#${decodedTag} / ${posts.length} posts / reading dock`}
      />
      <TagReadingDock tag={decodedTag} posts={posts} />
    </main>
  );
}
