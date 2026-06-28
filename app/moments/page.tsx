import { staticPageMetadata } from '@/lib/seo';

export const metadata = staticPageMetadata.moments;

import { EmptyState, PageHero, PageInsightBar, TimelineDate } from '@/components/SectionBlocks';
import { SiteNav } from '@/components/SiteNav';
import { getBlogData } from '@/lib/blog';

export default async function MomentsPage() {
  const data = await getBlogData();
  const notes = [...data.notes].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <main className="subpage" style={{ '--theme': data.site.themeColor, '--accent': data.site.accentColor } as React.CSSProperties}>
      <SiteNav title={data.site.title} />
      <PageHero eyebrow="Moments" title="动态流" description="轻量记录每天的进度、状态和灵感，不必等到写成完整文章。" />
      <PageInsightBar items={[{ label: '动态', value: notes.length, caption: '状态记录' }, { label: '最新', value: notes[0]?.date || '-', caption: '最近一次更新' }, { label: '节奏', value: data.site.streak || 0, caption: '连续写作天数' }]} action={{ href: '/archive', label: '阅读文章' }} />
      <section className="main-shell moment-timeline">
        {notes.length === 0 ? <EmptyState title="暂无动态" description="在后台维护动态后，这里会形成轻量时间线。" /> : null}
        {notes.map((note) => (
          <article className="glass-card moment-card wide" key={note.id}>
            <TimelineDate value={note.date} />
            <p>{note.content}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
