import { ArchiveSwitchboard } from '@/components/ArchiveSwitchboard';
import { ChannelHeader } from '@/components/ChannelHeader';
import { SiteNav } from '@/components/SiteNav';
import { getArchiveGroups, getBlogData } from '@/lib/blog';
import { staticPageMetadata } from '@/lib/seo';

export const metadata = staticPageMetadata.archive;

export default async function ArchivePage() {
  const [data, groups] = await Promise.all([getBlogData(), getArchiveGroups()]);
  const postCount = groups.reduce((total, group) => total + group.posts.length, 0);

  return (
    <main className="subpage archive-page" style={{ '--theme': data.site.themeColor, '--accent': data.site.accentColor } as React.CSSProperties}>
      <SiteNav title={data.site.title} />
      <ChannelHeader
        eyebrow="Archive"
        title="归档与探索"
        description={`总计 ${postCount} 篇研究记录`}
      />
      <ArchiveSwitchboard groups={groups} />
    </main>
  );
}
