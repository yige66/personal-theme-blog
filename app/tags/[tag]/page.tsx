import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { CSSProperties } from 'react';
import { ChannelHeader } from '@/components/ChannelHeader';
import { TagReadingDock } from '@/components/channels/TagSurfaces';
import { SiteNav } from '@/components/SiteNav';
import { formatPageText, getBlogData, getPageActions, getPageContent, getPageStatLabel, getPostsByTag, getTagSummaries } from '@/lib/blog';
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

  const page = getPageContent(data.site, 'tag-detail');
  const pageVariables = { tag: decodedTag, postCount: posts.length };

  return (
    <main className="subpage tag-page" style={{ '--theme': data.site.themeColor, '--accent': data.site.accentColor } as CSSProperties}>
      <SiteNav columns={data.site.columns} title={data.site.title} brandSuffix={data.site.brandSuffix} />
      <ChannelHeader
        eyebrow={formatPageText(page.eyebrow, pageVariables)}
        title={formatPageText(page.title, pageVariables)}
        description={formatPageText(page.description, pageVariables)}
        stats={[
          { label: getPageStatLabel(page, 0, '文章'), value: posts.length },
          { label: getPageStatLabel(page, 1, '标签'), value: decodedTag },
          { label: getPageStatLabel(page, 2, '阅读'), value: 'Dock' }
        ]}
        actions={getPageActions(page)}
        signal={formatPageText(page.signal, pageVariables)}
      />
      <TagReadingDock tag={decodedTag} posts={posts} />
    </main>
  );
}
