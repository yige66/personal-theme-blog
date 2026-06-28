import Link from 'next/link';
import { EmptyState, PageHero, PageInsightBar } from '@/components/SectionBlocks';
import { SiteNav } from '@/components/SiteNav';
import { getBlogData, getTagSummaries } from '@/lib/blog';
import { staticPageMetadata } from '@/lib/seo';

export const metadata = staticPageMetadata.tags;

export default async function TagsPage() {
  const [data, tags] = await Promise.all([getBlogData(), getTagSummaries()]);

  return (
    <main className="subpage tags-page" style={{ '--theme': data.site.themeColor, '--accent': data.site.accentColor } as React.CSSProperties}>
      <SiteNav title={data.site.title} />
      <PageHero eyebrow="Tags" title="标签星图" description="用标签把文章、主题和学习线索连起来，快速进入同一类内容。" />
      <PageInsightBar
        items={[
          { label: '标签', value: tags.length, caption: '主题入口' },
          { label: '文章', value: tags.reduce((total, tag) => total + tag.count, 0), caption: '标签引用次数' },
          { label: '排序', value: 'Hot', caption: '按热度聚合' }
        ]}
        action={{ href: '/archive', label: '回到归档' }}
      />
      <section className="main-shell tag-cloud-page">
        {tags.length === 0 ? <EmptyState title="暂无标签" description="发布带标签的文章后，标签星图会自动出现。" /> : null}
        {tags.map((tag) => (
          <Link className="tag-cloud-card" href={`/tags/${encodeURIComponent(tag.name)}`} key={tag.name}>
            <strong>#{tag.name}</strong>
            <span>{tag.count} 篇文章</span>
          </Link>
        ))}
      </section>
    </main>
  );
}
