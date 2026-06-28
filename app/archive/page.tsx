import { staticPageMetadata } from '@/lib/seo';

export const metadata = staticPageMetadata.archive;

import Link from 'next/link';
import { EmptyState, PageHero, PageInsightBar } from '@/components/SectionBlocks';
import { SiteNav } from '@/components/SiteNav';
import { formatDate, getArchiveGroups, getBlogData, estimateReadingMinutes } from '@/lib/blog';

export default async function ArchivePage() {
  const [data, groups] = await Promise.all([getBlogData(), getArchiveGroups()]);
  const postCount = groups.reduce((total, group) => total + group.posts.length, 0);

  return (
    <main className="subpage" style={{ '--theme': data.site.themeColor, '--accent': data.site.accentColor } as React.CSSProperties}>
      <SiteNav title={data.site.title} />
      <PageHero eyebrow="Archive" title="文章归档" description="按时间线回看文章、项目记录和学习笔记，让内容从零散片段变成可复访的地图。" />
      <PageInsightBar items={[{ label: '文章', value: postCount, caption: '已发布归档' }, { label: '年份', value: groups.length, caption: '时间线跨度' }, { label: '入口', value: 'Tags', caption: '按主题继续探索' }]} action={{ href: '/tags', label: '查看标签' }} />
      <section className="main-shell archive-list">
        {groups.length === 0 ? <EmptyState title="暂无归档文章" description="在后台发布文章后，这里会自动生成按年份组织的时间线。" /> : null}
        {groups.map((group) => (
          <div className="archive-year" key={group.year}>
            <h2>{group.year}</h2>
            <div className="article-list">
              {group.posts.map((post, index) => (
                <Link className="article-row" href={`/posts/${post.slug}`} key={post.id}>
                  <span className="row-index">{String(index + 1).padStart(2, '0')}</span>
                  <span>
                    <strong>{post.title}</strong>
                    <small>{post.summary}</small>
                  </span>
                  <span className="row-meta">{formatDate(post.createdAt)} / {estimateReadingMinutes(post.content)} min</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
