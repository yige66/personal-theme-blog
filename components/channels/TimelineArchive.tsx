import Link from 'next/link';
import type { TimelineItem } from '@/lib/blog';
import { formatDate } from '@/lib/blog';
import { EmptyState } from '@/components/SectionBlocks';

export function TimelineArchive({ items }: { items: TimelineItem[] }) {
  if (items.length === 0) {
    return (
      <section className="main-shell timeline-world">
        <EmptyState title="暂无时间线" description="发布文章、动态、杂谈或项目后，这里会自动汇成时间线。" />
      </section>
    );
  }

  const types = Array.from(new Set(items.map((item) => item.type)));

  return (
    <section className="main-shell timeline-world" aria-label="内容聚合时间线">
      <div className="timeline-toolbar">
        {types.map((type) => <span key={type}>{type}</span>)}
      </div>
      <div className="timeline-spine">
        {items.map((item, index) => (
          <Link className={`timeline-node timeline-node-${item.type}`} href={item.href} key={`${item.type}-${item.id}-${index}`}>
            <time>{formatDate(item.date)}</time>
            <span>{item.accent || item.type}</span>
            <strong>{item.title}</strong>
            <p>{item.summary}</p>
            <small>{item.tags.slice(0, 4).map((tag) => `#${tag}`).join(' ')}</small>
          </Link>
        ))}
      </div>
    </section>
  );
}
