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
        title="文章归档"
        description="搜索标题、摘要、年份或标签，在时间线和卡片矩阵之间切换。"
        stats={[
          { label: '文章', value: postCount },
          { label: '年份', value: groups.length },
          { label: '入口', value: 'Tags' }
        ]}
        actions={[
          { href: '/tags', label: '查看标签' },
          { href: '/moments', label: '看看动态' }
        ]}
        signal={`${postCount} posts / ${groups.length} archive years / topic routes online`}
      />
      <ArchiveSwitchboard groups={groups} />
    </main>
  );
}
