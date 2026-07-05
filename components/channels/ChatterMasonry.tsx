import Image from 'next/image';
import Link from 'next/link';
import type { BlogChatter } from '@/lib/blog';
import { formatDate } from '@/lib/blog';
import { EmptyState } from '@/components/SectionBlocks';

export function ChatterMasonry({ chatters }: { chatters: BlogChatter[] }) {
  if (chatters.length === 0) {
    return (
      <section className="main-shell chatter-board">
        <EmptyState title="暂无杂谈" description="补充杂谈内容后，这里会显示学习记录、项目碎片和生活小记。" />
      </section>
    );
  }

  return (
    <section className="main-shell chatter-board xh-reference-surface" aria-label="云端杂谈图文流">
      <div className="chatter-masonry">
        {chatters.map((chatter, index) => (
          <Link className={`chatter-card chatter-${index % 5}`} href={`/chatter/${chatter.slug}`} key={chatter.id}>
            {chatter.cover ? (
              <span className="chatter-cover">
                <Image src={chatter.cover} alt="" width={680} height={420} />
                {chatter.mood ? <em>{chatter.mood}</em> : null}
              </span>
            ) : null}
            <small>{formatDate(chatter.date)}</small>
            <strong>{chatter.title}</strong>
            <p>{chatter.summary || chatter.content}</p>
            <span className="chatter-tags">
              {chatter.tags.slice(0, 4).map((tag) => <em key={tag}>#{tag}</em>)}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
