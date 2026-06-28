import Link from 'next/link';
import { PageHero } from '@/components/SectionBlocks';
import { SiteNav } from '@/components/SiteNav';
import { getBlogData, getTagSummaries } from '@/lib/blog';

export default async function TagsPage() {
  const [data, tags] = await Promise.all([getBlogData(), getTagSummaries()]);

  return (
    <main className="subpage" style={{ '--theme': data.site.themeColor, '--accent': data.site.accentColor } as React.CSSProperties}>
      <SiteNav title={data.site.title} />
      <PageHero eyebrow="Tags" title="标签矩阵" description="用标签把文章、主题和学习线索连起来，快速进入同一类内容。" />
      <section className="main-shell tag-cloud-page">
        {tags.map((tag) => (
          <Link className="glass-card tag-cloud-card" href={`/tags/${encodeURIComponent(tag.name)}`} key={tag.name}>
            <strong>#{tag.name}</strong>
            <span>{tag.count} 篇文章</span>
          </Link>
        ))}
      </section>
    </main>
  );
}
