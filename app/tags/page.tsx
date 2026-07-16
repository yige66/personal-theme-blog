import { ChannelHeader } from '@/components/ChannelHeader';
import { TagNebula } from '@/components/channels/TagSurfaces';
import { SiteNav } from '@/components/SiteNav';
import { formatPageText, getBlogData, getPageActions, getPageContent, getPageStatLabel, getTagSummaries } from '@/lib/blog';
import { staticPageMetadata } from '@/lib/seo';

export const metadata = staticPageMetadata.tags;

export default async function TagsPage() {
  const [data, tags] = await Promise.all([getBlogData(), getTagSummaries()]);
  const postCount = tags.reduce((total, tag) => total + tag.count, 0);
  const page = getPageContent(data.site, 'tags');

  return (
    <main className="subpage tags-page" style={{ '--theme': data.site.themeColor, '--accent': data.site.accentColor } as React.CSSProperties}>
      <SiteNav columns={data.site.columns} title={data.site.title} brandSuffix={data.site.brandSuffix} />
      <ChannelHeader
        eyebrow={page.eyebrow}
        title={page.title}
        description={formatPageText(page.description, { tagCount: tags.length, postCount })}
        stats={[
          { label: getPageStatLabel(page, 0, '标签'), value: tags.length },
          { label: getPageStatLabel(page, 1, '文章'), value: postCount },
          { label: getPageStatLabel(page, 2, '排序'), value: 'Hot' }
        ]}
        actions={getPageActions(page)}
        signal={page.signal}
      />
      <TagNebula tags={tags} />
    </main>
  );
}
