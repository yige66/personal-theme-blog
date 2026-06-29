import { ArchiveSwitchboard } from '@/components/ArchiveSwitchboard';
import { PageScene } from '@/components/PageScene';
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
      <PageScene
        eyebrow="Archive"
        title="文章归档"
        description="按 XHBlogs 的归档逻辑组织文章：搜索标题与摘要、按标签筛选，并在时间线和卡片矩阵之间切换。"
        image={data.site.heroImage}
        imageAlt={`${data.site.title} 归档背景`}
        variant="archive"
        stats={[
          { label: '文章', value: postCount, caption: '已发布归档' },
          { label: '年份', value: groups.length, caption: '时间跨度' },
          { label: '入口', value: 'Tags', caption: '按主题继续探索' }
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
