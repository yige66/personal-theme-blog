import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { CSSProperties } from 'react';
import { ChannelHeader } from '@/components/ChannelHeader';
import { TagReadingDock } from '@/components/channels/TagSurfaces';
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
    <main className="subpage tag-page" style={{ '--theme': data.site.themeColor, '--accent': data.site.accentColor } as CSSProperties}>
      <SiteNav columns={data.site.columns} title={data.site.title} brandSuffix={data.site.brandSuffix} />
      <ChannelHeader
        eyebrow="Tag"
        title={`#${decodedTag}`}
        description="同一标签下的文章集合，被收束到一条可以继续漫游的阅读轨道里。"
        stats={[
          { label: '文章', value: posts.length },
          { label: '标签', value: decodedTag },
          { label: '阅读', value: 'Dock' }
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
