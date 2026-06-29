import { HomeWorld } from '@/components/HomeWorld';
import { SiteNav } from '@/components/SiteNav';
import { getBlogData, getBlogStats, getPublishedPosts } from '@/lib/blog';
import { createPortalSearchEntries } from '@/lib/portal-index';
import { createWebsiteJsonLd, toJsonLd } from '@/lib/seo';

export default async function HomePage() {
  const [data, posts, stats] = await Promise.all([getBlogData(), getPublishedPosts(), getBlogStats()]);
  const featuredPost = posts.find((post) => post.featured) ?? posts[0];
  const websiteJsonLd = createWebsiteJsonLd(data);
  const searchEntries = createPortalSearchEntries(data, posts);

  return (
    <main className="xh-home" style={{ '--theme': data.site.themeColor, '--accent': data.site.accentColor } as React.CSSProperties}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLd(websiteJsonLd) }} />
      <SiteNav title={data.site.title} />
      <HomeWorld data={data} stats={stats} posts={posts} featuredPost={featuredPost} searchEntries={searchEntries} />
    </main>
  );
}
