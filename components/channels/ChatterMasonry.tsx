import Image from 'next/image';
import Link from 'next/link';
import type { BlogChatter } from '@/lib/blog';
import { formatDate } from '@/lib/blog';
import { EmptyState } from '@/components/SectionBlocks';

export function ChatterMasonry({ chatters }: { chatters: BlogChatter[] }) {
  if (chatters.length === 0) {
    return (
      <section className="main-shell chatter-board">
        <EmptyState title="暂无杂谈" description="补充 chatter 内容后，这里会显示更接近 XHBlogs 的轻文章瀑布流。" />
      </section>
    );
  }

  const tags = Array.from(new Set(chatters.flatMap((chatter) => chatter.tags)));

  return (
    <section className="main-shell chatter-board" aria-label="云端杂谈瀑布">
      <div className="chatter-filter-rail">
        <span>全部</span>
        {tags.slice(0, 8).map((tag) => <span key={tag}>#{tag}</span>)}
      </div>
      <div className="chatter-masonry">
        {chatters.map((chatter, index) => (
          <Link className={`chatter-card chatter-${index % 5}`} href={`/chatter/${chatter.slug}`} key={chatter.id}>
            {chatter.cover ? (
              <span className="chatter-cover">
                <Image src={chatter.cover} alt="" width={680} height={420} />
              </span>
            ) : null}
            <small>{formatDate(chatter.date)} / {chatter.mood || 'Chatter'}</small>
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
