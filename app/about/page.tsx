import { AboutRoom } from '@/components/channels/AboutRoom';
import { SiteNav } from '@/components/SiteNav';
import { getBlogData, getBlogStats, type BlogData } from '@/lib/blog';
import { staticPageMetadata } from '@/lib/seo';
import type { CSSProperties } from 'react';

export const metadata = staticPageMetadata.about;

type AboutPageProps = {
  searchParams?: Promise<{
    tab?: string | string[];
  }>;
};

type AboutActivity = {
  id: string;
  type: '文章' | '杂谈' | '说说';
  title: string;
  date: string;
  href: string;
};

function normalizeTab(value: string | string[] | undefined): 'intro' | 'activity' {
  const tab = Array.isArray(value) ? value[0] : value;
  return tab === 'activity' ? 'activity' : 'intro';
}

function createAboutActivities(data: BlogData): AboutActivity[] {
  const posts = data.posts
    .filter((post) => post.status === 'published')
    .map((post) => ({
      id: `post-${post.id}`,
      type: '文章' as const,
      title: post.title,
      date: post.updatedAt || post.createdAt,
      href: `/posts/${post.slug}`
    }));

  const chatters = data.chatters.map((chatter) => ({
    id: `chatter-${chatter.id}`,
    type: '杂谈' as const,
    title: chatter.title,
    date: chatter.date,
    href: `/chatter/${chatter.slug}`
  }));

  const notes = data.notes.map((note) => ({
    id: `note-${note.id}`,
    type: '说说' as const,
    title: note.title || note.content.slice(0, 24),
    date: note.date,
    href: '/moments'
  }));

  return [...posts, ...chatters, ...notes].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export default async function AboutPage({ searchParams }: AboutPageProps) {
  const [data, stats] = await Promise.all([getBlogData(), getBlogStats()]);
  const params = await searchParams;
  const activeTab = normalizeTab(params?.tab);
  const activities = createAboutActivities(data);

  return (
    <main className="subpage about-page" style={{ '--theme': data.site.themeColor, '--accent': data.site.accentColor } as CSSProperties}>
      <SiteNav title={data.site.title} />
      <AboutRoom activeTab={activeTab} activities={activities} site={data.site} stats={stats} />
    </main>
  );
}
