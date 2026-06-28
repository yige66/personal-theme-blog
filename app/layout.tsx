import type { Metadata } from 'next';
import { HomeEffects } from '@/components/HomeEffects';
import { TasteMotion } from '@/components/TasteMotion';
import { getBlogData, getPublishedPosts } from '@/lib/blog';
import { createSiteMetadata } from '@/lib/seo';
import './globals.css';

export async function generateMetadata(): Promise<Metadata> {
  const data = await getBlogData();
  return createSiteMetadata(data.site);
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [data, posts] = await Promise.all([getBlogData(), getPublishedPosts()]);
  const activeTrack = data.site.music[0];

  return (
    <html lang="zh-CN">
      <body>
        <HomeEffects site={data.site} posts={posts} notes={data.notes} activeTrack={activeTrack} />
        <TasteMotion />
        {children}
      </body>
    </html>
  );
}
