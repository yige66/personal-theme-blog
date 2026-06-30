import type { Metadata } from 'next';
import { BackgroundSlider } from '@/components/BackgroundSlider';
import { GlobalToolbox } from '@/components/GlobalToolbox';
import { HomeEffects } from '@/components/HomeEffects';
import { MusicProvider } from '@/components/music/MusicProvider';
import { SplashScreen } from '@/components/SplashScreen';
import { TasteMotion } from '@/components/TasteMotion';
import { getBlogData, getPublishedPosts } from '@/lib/blog';
import { createSiteMetadata } from '@/lib/seo';
import './globals.css';
import './home-overrides.css';

export async function generateMetadata(): Promise<Metadata> {
  const data = await getBlogData();
  return {
    ...createSiteMetadata(data.site),
    icons: {
      icon: data.site.avatar || '/assets/img/avatar-orbit.svg',
      shortcut: data.site.avatar || '/assets/img/avatar-orbit.svg',
      apple: data.site.avatar || '/assets/img/avatar-orbit.svg'
    }
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [data, posts] = await Promise.all([getBlogData(), getPublishedPosts()]);
  const activeTrack = data.site.music[0];

  return (
    <html lang="zh-CN">
      <head>
        <style
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              #xh-app-root { opacity: 0; visibility: hidden; pointer-events: none; }
              html.xh-splash-seen #xh-app-root { opacity: 1; visibility: visible; pointer-events: auto; }
            `
          }}
        />
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (sessionStorage.getItem('personal-theme-blog:splash-seen') === 'true') {
                  document.documentElement.classList.add('xh-splash-seen');
                }
              } catch (error) {
                document.documentElement.classList.add('xh-splash-seen');
              }
            `
          }}
        />
      </head>
      <body>
        <BackgroundSlider site={data.site} />
        <HomeEffects site={data.site} posts={posts} notes={data.notes} activeTrack={activeTrack} />
        <SplashScreen site={data.site} />
        <TasteMotion />
        <GlobalToolbox github={data.site.github} email={data.site.email} />
        <MusicProvider tracks={data.site.music} cloudMusicIds={data.site.cloudMusicIds}>
          <div id="xh-app-root">
            {children}
          </div>
        </MusicProvider>
      </body>
    </html>
  );
}
