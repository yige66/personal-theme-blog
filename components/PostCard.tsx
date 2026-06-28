import Image from 'next/image';
import Link from 'next/link';
import { BlogPost, estimateReadingMinutes, formatDate } from '@/lib/blog';

export function PostCard({ post, featured = false }: { post: BlogPost; featured?: boolean }) {
  return (
    <article className={featured ? 'post-card featured-post' : 'post-card'}>
      <Link className="post-cover" href={`/posts/${post.slug}`} aria-label={`阅读 ${post.title}`}>
        <Image src={post.cover} alt={`${post.title} 封面`} width={featured ? 860 : 520} height={featured ? 460 : 320} />
      </Link>
      <div className="post-body">
        <div className="post-meta">
          <time dateTime={post.createdAt}>{formatDate(post.createdAt)}</time>
          <span>{post.category}</span>
          <span>{estimateReadingMinutes(post.content)} min</span>
        </div>
        <h3><Link href={`/posts/${post.slug}`}>{post.title}</Link></h3>
        <p>{post.summary}</p>
        <div className="tag-row">
          {post.tags.map((tag) => <span key={tag}>{tag}</span>)}
        </div>
      </div>
    </article>
  );
}
