'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { BlogPost } from '@/lib/blog';

type LatestPostCarouselProps = {
  posts: BlogPost[];
  fallbackImage: string;
};

function formatPostDate(value: string): string {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date(value));
}

export function LatestPostCarousel({ posts, fallbackImage }: LatestPostCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activePost = posts[activeIndex];

  useEffect(() => {
    if (posts.length <= 1 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % posts.length);
    }, 6200);

    return () => window.clearInterval(timer);
  }, [posts.length]);

  if (!activePost) {
    return (
      <section className="xh-latest-card xh-latest-carousel is-empty" data-motion="stack-card" aria-label="最新文章">
        <Image src={fallbackImage} alt="博客文章默认封面" width={960} height={720} loading="eager" data-motion="image-scale" />
        <div className="xh-latest-carousel-copy">
          <p className="eyebrow">Latest Post</p>
          <h2>第一篇文章正在准备中</h2>
          <span>等待内容发布</span>
          <Link href="/archive">文章归档</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="xh-latest-card xh-latest-carousel" data-motion="stack-card" aria-label="最新文章轮播">
      <Link className="xh-latest-main-link" href={`/posts/${activePost.slug}`} aria-label={`阅读 ${activePost.title}`} />
      {posts.map((post, index) => (
        <Image
          className={index === activeIndex ? 'is-active' : ''}
          src={post.cover || fallbackImage}
          alt={`${post.title} 封面`}
          width={960}
          height={720}
          loading={index === 0 ? 'eager' : 'lazy'}
          data-motion={index === activeIndex ? 'image-scale' : undefined}
          key={post.id}
        />
      ))}

      <div className="xh-latest-carousel-copy">
        <p className="eyebrow">Latest Insight</p>
        <time>{formatPostDate(activePost.updatedAt)}</time>
        <h2>{activePost.title}</h2>
        <small>{activePost.category}</small>
      </div>

      {posts.length > 1 ? (
        <nav className="xh-carousel-dots" aria-label="轮播文章控制">
          {posts.map((post, index) => (
            <button
              className={index === activeIndex ? 'is-active' : ''}
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setActiveIndex(index);
              }}
              key={post.id}
              aria-label={`切换到 ${post.title}`}
              aria-current={index === activeIndex ? 'true' : undefined}
            >
              <span>{post.title}</span>
            </button>
          ))}
        </nav>
      ) : null}
    </section>
  );
}
