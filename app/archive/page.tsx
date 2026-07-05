import { ArchiveSwitchboard } from '@/components/ArchiveSwitchboard';
import { ChannelHeader } from '@/components/ChannelHeader';
import { SiteNav } from '@/components/SiteNav';
import { formatPageText, getArchiveGroups, getBlogData, getPageActions, getPageContent, getPageStatLabel } from '@/lib/blog';
import { staticPageMetadata } from '@/lib/seo';

export const metadata = staticPageMetadata.archive;

export default async function ArchivePage() {
  const [data, groups] = await Promise.all([getBlogData(), getArchiveGroups()]);
  const postCount = groups.reduce((total, group) => total + group.posts.length, 0);
  const tagCount = new Set(groups.flatMap((group) => group.posts.flatMap((post) => post.tags))).size;
  const page = getPageContent(data.site, 'archive');

  return (
    <main className="subpage archive-page" style={{ '--theme': data.site.themeColor, '--accent': data.site.accentColor } as React.CSSProperties}>
      <SiteNav columns={data.site.columns} title={data.site.title} brandSuffix={data.site.brandSuffix} />
      <ChannelHeader
        eyebrow={page.eyebrow}
        title={page.title}
        description={formatPageText(page.description, { postCount, yearCount: groups.length, tagCount })}
        stats={[
          { label: getPageStatLabel(page, 0, '文章'), value: postCount },
          { label: getPageStatLabel(page, 1, '年份'), value: groups.length },
          { label: getPageStatLabel(page, 2, '标签'), value: tagCount }
        ]}
        actions={getPageActions(page)}
        signal={page.signal}
      />
      <ArchiveSwitchboard groups={groups} />
    </main>
  );
}
