import { staticPageMetadata } from '@/lib/seo';

export const metadata = staticPageMetadata.moments;

import { PageHero, TimelineDate } from '@/components/SectionBlocks';
import { SiteNav } from '@/components/SiteNav';
import { getBlogData } from '@/lib/blog';

export default async function MomentsPage() {
  const data = await getBlogData();
  const notes = [...data.notes].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <main className="subpage" style={{ '--theme': data.site.themeColor, '--accent': data.site.accentColor } as React.CSSProperties}>
      <SiteNav title={data.site.title} />
      <PageHero eyebrow="Moments" title="动态流" description="轻量记录每天的进度、状态和灵感，不必等到写成完整文章。" />
      <section className="main-shell moment-timeline">
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
