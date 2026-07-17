'use client';

import { usePathname } from 'next/navigation';
import { GitHubStarButton } from '@/components/projects/ProjectStarButton';
import { BLOG_REPOSITORY_URL } from '@/lib/github-repository';

export function GitHubStarFloating() {
  const pathname = usePathname();

  if (pathname === '/projects' || pathname.startsWith('/projects/') || pathname.startsWith('/admin')) {
    return null;
  }

  return <GitHubStarButton repo={BLOG_REPOSITORY_URL} variant="floating" />;
}
