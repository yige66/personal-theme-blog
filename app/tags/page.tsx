import { ChannelHeader } from '@/components/ChannelHeader';
import { TagNebula } from '@/components/channels/TagSurfaces';
import { SiteNav } from '@/components/SiteNav';
import { getBlogData, getTagSummaries } from '@/lib/blog';
import { staticPageMetadata } from '@/lib/seo';

export const metadata = staticPageMetadata.tags;

export default async function TagsPage() {
  const [data, tags] = await Promise.all([getBlogData(), getTagSummaries()]);

  return (
    <main className="subpage tags-page" style={{ '--theme': data.site.themeColor, '--accent': data.site.accentColor } as React.CSSProperties}>
      <SiteNav title={data.site.title} />
      <ChannelHeader
        eyebrow="Tags"
        title="标签星云"
        description="用标签把文章、主题和学习线索连起来，快速进入同一类内容轨道。"
        stats={[
          { label: '标签', value: tags.length },
          { label: '文章', value: tags.reduce((total, tag) => total + tag.count, 0) },
          { label: '排序', value: 'Hot' }
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
