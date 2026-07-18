'use client';

import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { parseGitHubRepository, type GitHubRepository } from '@/lib/github-repository';

type StarState = 'idle' | 'loading' | 'starred' | 'error';

export type GitHubStarButtonProps = {
  className?: string;
  repo: string;
  variant?: 'project' | 'floating';
};

type ProjectStarButtonProps = {
  repo: string;
};

const GITHUB_API_ORIGIN = 'https://api.github.com';
const GITHUB_TOKEN_KEYS = ['gitalk-token', 'GT_ACCESS_TOKEN', 'gitalk-token-v1'];

export function ProjectStarButton({ repo }: ProjectStarButtonProps) {
  return <GitHubStarButton repo={repo} variant="project" />;
}

export function GitHubStarButton({ className = '', repo, variant = 'project' }: GitHubStarButtonProps) {
  const repository = parseGitHubRepository(repo);
  const intentHandledRef = useRef(false);
  const [state, setState] = useState<StarState>('idle');
  const owner = repository?.owner || '';
  const repositoryName = repository?.repo || '';
  const repositoryUrl = repository?.url || '';
  const isLoading = state === 'loading';
  const isStarred = state === 'starred';
  const buttonClassName = [
    variant === 'floating' ? 'github-star-button github-star-floating' : 'project-star-button',
    isStarred ? 'is-starred' : '',
    isLoading ? 'is-loading' : '',
    className
  ].filter(Boolean).join(' ');
  const label = isStarred ? '已 Star' : state === 'error' ? 'Star 失败，重试' : 'Star';

  async function requestStar() {
    if (!repository || isLoading || isStarred) {
      return;
    }

    setState('loading');
    const target = `${GITHUB_API_ORIGIN}/user/starred/${owner}/${repositoryName}`;
    let usedLegacyToken = false;

    try {
      let response = await sendStarRequest(target);

      if (response.status === 401 || response.status === 403) {
        const legacyToken = readGitHubAccessToken();
        if (legacyToken) {
          usedLegacyToken = true;
          response = await sendStarRequest(target, legacyToken);
        }
      }

      if (response.ok || response.status === 204) {
        setState('starred');
        return;
      }

      // A stale Gitalk token must not trap the user in the retry state.
      if (response.status === 401 || response.status === 403 || (usedLegacyToken && response.status >= 500)) {
        startGitHubOAuth(repository);
        return;
      }

      setState('error');
    } catch {
      if (usedLegacyToken) {
        startGitHubOAuth(repository);
        return;
      }

      setState('error');
    }
  }

  function handleStar(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    if (isLoading || isStarred) {
      return;
    }

    void requestStar();
  }

  useEffect(() => {
    if (!repository || intentHandledRef.current || typeof window === 'undefined') {
      return;
    }

    const url = new URL(window.location.href);
    const intent = url.searchParams.get('github_star');
    const intentRepository = url.searchParams.get('github_repo')?.toLowerCase();
    if (!intent || intentRepository !== `${owner}/${repositoryName}`.toLowerCase()) {
      return;
    }

    intentHandledRef.current = true;
    url.searchParams.delete('github_star');
    url.searchParams.delete('github_repo');
    window.history.replaceState(null, document.title, `${url.pathname}${url.search}${url.hash}`);

    if (intent === 'success') {
      setState('starred');
    } else if (intent === 'ready') {
      void requestStar();
    } else {
      setState('error');
    }
  }, [owner, repositoryName, repositoryUrl]);

  if (!repository) {
    return null;
  }

  return (
    <button
      className={buttonClassName}
      type="button"
      onClick={handleStar}
      disabled={isLoading || isStarred}
      aria-busy={isLoading}
      aria-label={isStarred ? `已给 ${repositoryName} 点 Star` : `给 ${repositoryName} 点 Star`}
      title={isStarred ? '已 Star' : '给 GitHub 项目点 Star'}
      data-github-star={repositoryUrl}
      data-github-star-state={state}
    >
      {variant === 'floating' ? <GitHubGlyph /> : null}
      <StarGlyph filled={isStarred} />
      <span aria-live="polite">{isLoading ? '处理中…' : label}</span>
    </button>
  );
}

async function sendStarRequest(target: string, accessToken = ''): Promise<Response> {
  const headers = new Headers({ Accept: 'application/vnd.github+json' });
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  return fetch(`/api/github?path=${encodeURIComponent(target)}`, {
    method: 'PUT',
    credentials: 'include',
    headers
  });
}

function startGitHubOAuth(repository: GitHubRepository) {
  const currentUrl = new URL(window.location.href);
  currentUrl.searchParams.delete('github_star');
  currentUrl.searchParams.delete('github_repo');
  const returnTo = `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`;
  const startUrl = new URL('/api/github/oauth/start', window.location.origin);
  startUrl.searchParams.set('repo', repository.url);
  startUrl.searchParams.set('returnTo', returnTo);
  window.location.assign(startUrl.toString());
}

function readGitHubAccessToken(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  try {
    for (const key of GITHUB_TOKEN_KEYS) {
      const value = window.localStorage.getItem(key)?.trim() || '';
      if (value && value.length <= 512 && !/[\u0000-\u001f\u007f]/.test(value)) {
        return value;
      }
    }
  } catch {
    return '';
  }

  return '';
}

function GitHubGlyph() {
  return (
    <svg className="github-star-glyph" aria-hidden="true" viewBox="0 0 24 24" focusable="false">
      <path d="M12 2C6.5 2 2 6.6 2 12.2c0 4.5 2.9 8.3 6.8 9.7.5.1.7-.2.7-.5v-1.9c-2.8.6-3.4-1.2-3.4-1.2-.4-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 0 1.6 1.1 1.6 1.1.9 1.6 2.4 1.1 3 .9.1-.7.4-1.1.7-1.4-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.5-1.3.1-2.7 0 0 .9-.3 2.8 1a9.5 9.5 0 0 1 5.1 0c1.9-1.3 2.8-1 2.8-1 .6 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.3 4.7-4.6 5 .4.3.7.9.7 1.8v2.7c0 .3.2.6.7.5 4-1.4 6.8-5.2 6.8-9.7C22 6.6 17.5 2 12 2Z" />
    </svg>
  );
}

function StarGlyph({ filled }: { filled: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
      <path className={filled ? 'is-filled' : ''} d="m12 2.7 2.76 5.59 6.17.9-4.47 4.36 1.06 6.15L12 16.8l-5.52 2.9 1.06-6.15-4.47-4.36 6.17-.9L12 2.7Z" />
    </svg>
  );
}
