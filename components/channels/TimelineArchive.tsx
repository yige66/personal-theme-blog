import Image from 'next/image';
import Link from 'next/link';
import type { TimelineItem } from '@/lib/blog';
import { formatDate } from '@/lib/blog';
import { EmptyState } from '@/components/SectionBlocks';

const fallbackCovers = ['/assets/img/hero-mountain.svg', '/assets/img/desk-notes.svg', '/assets/img/admin-board.svg'];

function getItemYear(item: TimelineItem) {
  const date = new Date(item.date);
  if (Number.isNaN(date.getTime())) {
    return item.date.slice(0, 4) || 'Unknown';
  }

  return String(date.getFullYear());
}

function groupTimelineItems(items: TimelineItem[]) {
  return [...items]
    .sort((first, second) => new Date(second.date).getTime() - new Date(first.date).getTime())
    .reduce<Array<{ year: string; items: TimelineItem[] }>>((groups, item) => {
      const year = getItemYear(item);
      const existingGroup = groups.find((group) => group.year === year);

      if (existingGroup) {
        return groups.map((group) => (
          group.year === year ? { ...group, items: [...group.items, item] } : group
        ));
      }

      return [...groups, { year, items: [item] }];
    }, []);
}

export function TimelineArchive({ items }: { items: TimelineItem[] }) {
  if (items.length === 0) {
    return (
      <section className="main-shell timeline-world">
        <EmptyState title="暂无时间线" description="发布文章、动态、杂谈或项目后，这里会自动汇成一条时间线。" />
      </section>
    );
  }

  const types = Array.from(new Set(items.map((item) => item.type)));
  const groups = groupTimelineItems(items);

  return (
    <section className="main-shell timeline-world xh-reference-surface" aria-label="内容聚合时间线">
      <div className="timeline-toolbar">
        <span>全部档案</span>
        {types.map((type) => <span key={type}>{type}</span>)}
      </div>
      <div className="timeline-spine timeline-year-stack">
        {groups.map((group) => (
          <section className="timeline-year-group" aria-label={`${group.year} 年内容`} key={group.year}>
            <aside className="timeline-year-card">
              <span>Year</span>
              <strong>{group.year}</strong>
              <small>{group.items.length} 篇</small>
            </aside>
            <div className="timeline-year-list">
              {group.items.map((item, index) => (
                <Link className={`timeline-node timeline-node-${item.type}`} href={item.href} key={`${item.type}-${item.id}`}>
                  <span className="timeline-node-cover">
                    <Image src={item.cover || fallbackCovers[index % fallbackCovers.length]} alt="" width={560} height={320} />
                  </span>
                  <span className="timeline-node-copy">
                    <small>{String(index + 1).padStart(2, '0')}</small>
                    <strong>{item.title}</strong>
                    <p>{item.summary}</p>
                    <time>{formatDate(item.date)} / {item.accent || item.type}</time>
                    <em>{item.tags.slice(0, 4).map((tag) => `#${tag}`).join(' ')}</em>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}
