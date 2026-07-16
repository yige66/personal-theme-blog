import { ChannelHeader } from '@/components/ChannelHeader';
import { MomentsBoard } from '@/components/MomentsBoard';
import { EmptyState } from '@/components/SectionBlocks';
import { SiteNav } from '@/components/SiteNav';
import { formatPageText, getBlogData, getPageActions, getPageContent, getPageStatLabel } from '@/lib/blog';
import { staticPageMetadata } from '@/lib/seo';

export const metadata = staticPageMetadata.moments;

export default async function MomentsPage() {
  const data = await getBlogData();
  const notes = [...data.notes].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const moods = [...new Set(notes.map((note) => note.mood).filter(Boolean))];
  const page = getPageContent(data.site, 'moments');

  return (
    <main className="subpage moments-page" style={{ '--theme': data.site.themeColor, '--accent': data.site.accentColor } as React.CSSProperties}>
      <SiteNav columns={data.site.columns} title={data.site.title} brandSuffix={data.site.brandSuffix} />
      <ChannelHeader
        eyebrow={page.eyebrow}
        title={page.title}
        description={formatPageText(page.description, { noteCount: notes.length, moodCount: moods.length, streak: data.site.streak })}
        stats={[
          { label: getPageStatLabel(page, 0, '动态'), value: notes.length },
          { label: getPageStatLabel(page, 1, 'Mood'), value: moods.length || '-' },
          { label: getPageStatLabel(page, 2, '节奏'), value: data.site.streak || 0 }
        ]}
        actions={getPageActions(page)}
        signal={page.signal}
      />
      {notes.length ? (
        <MomentsBoard
          authorName={data.site.owner || data.site.title}
          avatar={data.site.avatar}
          comments={data.site.comments}
          notes={notes}
        />
      ) : (
        <section className="main-shell moment-waterfall">
          <EmptyState title={page.emptyTitle} description={page.emptyDescription} />
        </section>
      )}
    </main>
  );
}
