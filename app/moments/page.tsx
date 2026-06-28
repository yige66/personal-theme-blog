import { EmptyState, MomentTimelineCard, PageHero, PageInsightBar } from '@/components/SectionBlocks';
import { SiteNav } from '@/components/SiteNav';
import { getBlogData } from '@/lib/blog';
import { staticPageMetadata } from '@/lib/seo';

export const metadata = staticPageMetadata.moments;

export default async function MomentsPage() {
  const data = await getBlogData();
  const notes = [...data.notes].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const moods = [...new Set(notes.map((note) => note.mood).filter(Boolean))];
  const tags = [...new Set(notes.flatMap((note) => note.tags ?? []))];

  return (
    <main className="subpage moments-page" style={{ '--theme': data.site.themeColor, '--accent': data.site.accentColor } as React.CSSProperties}>
      <SiteNav title={data.site.title} />
      <PageHero eyebrow="Moments" title="说说动态流" description="轻量记录每天的进度、状态和灵感。不必等到完整文章，站点也能持续有呼吸感。" />
      <PageInsightBar
        items={[
          { label: '动态', value: notes.length, caption: '状态记录' },
          { label: '主题', value: tags.length || '-', caption: '轻标签' },
          { label: '节奏', value: data.site.streak || 0, caption: '连续维护天数' }
        ]}
        action={{ href: '/archive', label: '阅读文章' }}
      />
      {moods.length ? (
        <section className="main-shell moment-mood-rail" aria-label="动态心情">
          {moods.map((mood) => <span key={mood}>{mood}</span>)}
        </section>
      ) : null}
      <section className="main-shell moment-waterfall">
        {notes.length === 0 ? <EmptyState title="暂无动态" description="在后台维护动态后，这里会形成轻量时间线。" /> : null}
        {notes.map((note, index) => <MomentTimelineCard note={note} index={index} key={note.id} />)}
      </section>
    </main>
  );
}
