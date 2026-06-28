import { staticPageMetadata } from '@/lib/seo';

export const metadata = staticPageMetadata.archive;

import Link from 'next/link';
import { PageHero } from '@/components/SectionBlocks';
import { SiteNav } from '@/components/SiteNav';
import { formatDate, getArchiveGroups, getBlogData, estimateReadingMinutes } from '@/lib/blog';

export default async function ArchivePage() {
  const [data, groups] = await Promise.all([getBlogData(), getArchiveGroups()]);

  return (
    <main className="subpage" style={{ '--theme': data.site.themeColor, '--accent': data.site.accentColor } as React.CSSProperties}>
      <SiteNav title={data.site.title} />
      <PageHero eyebrow="Archive" title="文章归档" description="按时间线回看文章、项目记录和学习笔记，让内容从零散片段变成可复访的地图。" />
      <section className="main-shell archive-list">
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
