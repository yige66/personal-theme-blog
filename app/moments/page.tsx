import { ChannelHeader } from '@/components/ChannelHeader';
import { MomentsBoard } from '@/components/MomentsBoard';
import { EmptyState } from '@/components/SectionBlocks';
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
      <ChannelHeader
        eyebrow="Moments"
        title="生活动态"
        description="在代码之外捕捉瞬间的温度，用星图串起轻量的日常记录。"
        stats={[
          { label: '动态', value: notes.length },
          { label: '主题', value: tags.length || '-' },
          { label: '节奏', value: data.site.streak || 0 }
        ]}
        actions={[
          { href: '/archive', label: '阅读文章' },
          { href: '/console', label: '管理动态' }
        ]}
        signal="daily notes / mood filters / constellation stream"
      />
      {moods.length ? (
        <section className="main-shell moment-mood-rail" aria-label="动态心情">
          {moods.map((mood) => <span key={mood}>{mood}</span>)}
        </section>
      ) : null}
      {notes.length ? (
        <MomentsBoard comments={data.site.comments} notes={notes} />
      ) : (
        <section className="main-shell moment-waterfall">
          <EmptyState title="暂无动态" description="在后台维护动态后，这里会形成轻量时间线。" />
        </section>
      )}
    </main>
  );
}
