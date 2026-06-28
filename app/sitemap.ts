import type { MetadataRoute } from 'next';
import { getBlogData, getPublishedPosts, getTagSummaries } from '@/lib/blog';
import { absoluteUrl, mostRecentDate, PUBLIC_ROUTES } from '@/lib/seo';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [data, posts, tags] = await Promise.all([getBlogData(), getPublishedPosts(), getTagSummaries()]);
  const siteLastModified = mostRecentDate([
    ...data.posts.map((post) => post.updatedAt),
    ...data.notes.map((note) => note.date),
    ...data.projects.map((project) => project.startedAt)
  ]) ?? new Date();

  const staticRoutes = PUBLIC_ROUTES.map((route) => ({
    url: absoluteUrl(route.path),
    lastModified: siteLastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority
  }));

  const postRoutes = posts.map((post) => ({
    url: absoluteUrl(`/posts/${post.slug}`),
    lastModified: new Date(post.updatedAt),
    changeFrequency: 'monthly' as const,
    priority: post.featured ? 0.92 : 0.82
  }));

  const tagRoutes = tags.map((tag) => ({
    url: absoluteUrl(`/tags/${encodeURIComponent(tag.name)}`),
    lastModified: new Date(tag.latestAt),
    changeFrequency: 'weekly' as const,
    priority: Math.min(0.78, 0.48 + tag.count * 0.05)
  }));

  return [...staticRoutes, ...postRoutes, ...tagRoutes];
}
