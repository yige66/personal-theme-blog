import type { Metadata } from 'next';
import { BackgroundSlider } from '@/components/BackgroundSlider';
import { GlobalToolbox } from '@/components/GlobalToolbox';
import { GitHubOAuthCallback } from '@/components/github/GitHubOAuthCallback';
import { GitHubStarFloating } from '@/components/github/GitHubStarFloating';
import { HomeEffects } from '@/components/HomeEffects';
import { MusicProvider } from '@/components/music/MusicProvider';
import { SplashScreen } from '@/components/SplashScreen';
import { TasteMotion } from '@/components/TasteMotion';
import { getBlogData, getPublishedPosts } from '@/lib/blog';
import { createSiteMetadata } from '@/lib/seo';
import './globals.css';
import './home-overrides.css';
import './entry-overrides.css';
import './project-world.css';

export const dynamic = 'force-dynamic';

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
  return (
    <html lang="zh-CN" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <style
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              #xh-app-root { opacity: 0; visibility: hidden; pointer-events: none; }
              html.xh-splash-seen #xh-app-root { opacity: 1; visibility: visible; pointer-events: auto; }
              html.xh-splash-seen.xh-splash-bypass #xh-app-root { opacity: 1; visibility: visible; pointer-events: auto; transition: none !important; }
            `
          }}
        />
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              var now = new Date();
              var initialMode = now.getHours() >= 18 || now.getHours() < 6 ? 'night' : 'day';
              var month = now.getMonth();
              var initialSeason = month >= 2 && month <= 4 ? 'spring' : month >= 5 && month <= 7 ? 'summer' : month >= 8 && month <= 10 ? 'autumn' : 'winter';
              try {
                document.documentElement.setAttribute('data-xh-theme', initialMode);
                document.documentElement.setAttribute('data-xh-theme-next', initialMode);
                document.documentElement.setAttribute('data-xh-theme-transition', 'idle');
                document.documentElement.setAttribute('data-xh-theme-phase', initialMode);
                document.documentElement.setAttribute('data-xh-season', initialSeason);
                document.documentElement.setAttribute('data-xh-season-next', initialSeason);
                document.documentElement.setAttribute('data-xh-season-previous', initialSeason);
                document.documentElement.setAttribute('data-xh-season-transition', 'idle');
              } catch (error) {
                document.documentElement.setAttribute('data-xh-theme', initialMode);
                document.documentElement.setAttribute('data-xh-theme-next', initialMode);
                document.documentElement.setAttribute('data-xh-theme-transition', 'idle');
                document.documentElement.setAttribute('data-xh-theme-phase', initialMode);
                document.documentElement.setAttribute('data-xh-season', initialSeason);
                document.documentElement.setAttribute('data-xh-season-next', initialSeason);
                document.documentElement.setAttribute('data-xh-season-previous', initialSeason);
                document.documentElement.setAttribute('data-xh-season-transition', 'idle');
              }

              try {
                if (window.location.pathname !== '/') {
                  document.documentElement.classList.add('xh-splash-seen', 'xh-splash-bypass');
                } else if (sessionStorage.getItem('personal-theme-blog:splash-seen') === 'true') {
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
        <MusicProvider tracks={data.site.music} cloudMusicIds={data.site.cloudMusicIds}>
          <HomeEffects site={data.site} posts={posts} notes={data.notes} />
          <SplashScreen site={data.site} />
          <GitHubOAuthCallback />
          <GitHubStarFloating />
          <TasteMotion />
          <GlobalToolbox columns={data.site.columns} github={data.site.github} email={data.site.email} />
          <div id="xh-app-root">
            {children}
          </div>
        </MusicProvider>
      </body>
    </html>
  );
}
