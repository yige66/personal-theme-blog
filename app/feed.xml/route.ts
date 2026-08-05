import { getBlogData, getPublishedPosts } from '@/lib/blog';
import { createRssFeed } from '@/lib/rss';
import { absoluteUrl, getSiteUrl } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  const [data, posts] = await Promise.all([getBlogData(), getPublishedPosts()]);
  const siteUrl = getSiteUrl();
  const feedUrl = absoluteUrl('/feed.xml', siteUrl);
  const xml = createRssFeed({
    title: data.site.title,
    description: data.site.subtitle,
    siteUrl: siteUrl.origin,
    feedUrl,
    items: posts.map((post) => ({
      title: post.title,
      summary: post.summary,
      url: absoluteUrl(`/posts/${post.slug}`, siteUrl),
      status: post.status,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt
    }))
  });

  return new Response(xml, {
    headers: {
      'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=86400',
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'X-Content-Type-Options': 'nosniff'
    }
  });
}
