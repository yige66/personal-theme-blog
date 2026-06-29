import { TagNebula } from '@/components/ChannelWorlds';
import { PageScene } from '@/components/PageScene';
import { SiteNav } from '@/components/SiteNav';
import { getBlogData, getTagSummaries } from '@/lib/blog';
import { staticPageMetadata } from '@/lib/seo';

export const metadata = staticPageMetadata.tags;

export default async function TagsPage() {
  const [data, tags] = await Promise.all([getBlogData(), getTagSummaries()]);

  return (
    <main className="subpage tags-page" style={{ '--theme': data.site.themeColor, '--accent': data.site.accentColor } as React.CSSProperties}>
      <SiteNav title={data.site.title} />
      <PageScene
        eyebrow="Tags"
        title="标签星图"
        description="用标签把文章、主题和学习线索连起来，快速进入同一类内容。"
        image={data.site.heroImage}
        imageAlt={`${data.site.title} 标签背景`}
        variant="tags"
        stats={[
          { label: '标签', value: tags.length, caption: '主题入口' },
          { label: '文章', value: tags.reduce((total, tag) => total + tag.count, 0), caption: '标签引用次数' },
          { label: '排序', value: 'Hot', caption: '按热度聚合' }
        ]}
        actions={[
          { href: '/archive', label: '回到归档' },
          { href: '/projects', label: '项目索引' }
        ]}
        signal="tag nebula / topic heat / reading paths"
      />
      <TagNebula tags={tags} />
    </main>
  );
}
