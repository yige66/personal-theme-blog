'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { GitHubStarButton } from '@/components/projects/ProjectStarButton';
import { BLOG_REPOSITORY_URL } from '@/lib/github-repository';

const SPLASH_COMPLETE_EVENT = 'personal-theme-blog:splash-complete';

export function GitHubStarFloating() {
  const pathname = usePathname();
  const [splashComplete, setSplashComplete] = useState(false);

  useEffect(() => {
    if (pathname !== '/') {
      setSplashComplete(true);
      return undefined;
    }

    const syncSplashState = () => {
      setSplashComplete(document.documentElement.classList.contains('xh-splash-seen'));
    };

    syncSplashState();
    window.addEventListener(SPLASH_COMPLETE_EVENT, syncSplashState);
    const observer = new MutationObserver(syncSplashState);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => {
      window.removeEventListener(SPLASH_COMPLETE_EVENT, syncSplashState);
      observer.disconnect();
    };
  }, [pathname]);

  if (pathname === '/' && !splashComplete) {
    return null;
  }

  if (pathname === '/projects' || pathname.startsWith('/projects/') || pathname.startsWith('/admin')) {
    return null;
  }

  return <GitHubStarButton repo={BLOG_REPOSITORY_URL} variant="floating" />;
}
