'use client';

import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { parseGitHubRepository, type GitHubRepository } from '@/lib/github-repository';
import { GITHUB_STAR_MESSAGE_SOURCE, isGitHubStarOAuthMessage, type GitHubStarOAuthStatus } from '@/lib/github-star';

type StarState = 'idle' | 'loading' | 'starred' | 'error' | 'configuration';

export type GitHubStarButtonProps = {
  className?: string;
  repo: string;
  variant?: 'project' | 'floating';
};

type ProjectStarButtonProps = {
  repo: string;
};

const GITHUB_API_ORIGIN = 'https://api.github.com';
const GITHUB_STAR_POPUP_NAME = 'github-star-auth';
const GITHUB_STAR_POPUP_FEATURES = 'popup=yes,width=560,height=760,resizable=yes,scrollbars=yes';

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
  const label = isLoading
    ? '正在打开 GitHub…'
    : isStarred
      ? '已 Star'
      : state === 'configuration'
        ? 'Star 配置缺失'
        : state === 'error'
          ? 'Star 失败，重试'
          : 'Star';
  const oauthWindowRef = useRef<Window | null>(null);
  const oauthPollRef = useRef<number | null>(null);

  useEffect(() => {
    if (!owner || !repositoryName) {
      return undefined;
    }

    const handleOAuthMessage = (event: MessageEvent<unknown>) => {
      const popup = oauthWindowRef.current;
      if (event.origin !== window.location.origin || !popup || event.source !== popup) {
        return;
      }

      if (!isGitHubStarOAuthMessage(event.data)) {
        return;
      }

      stopOAuthPopup(false);
      if (event.data.status === 'success') {
        void verifyStar();
      } else {
        setState('error');
      }
    };

    window.addEventListener('message', handleOAuthMessage);
    return () => {
      window.removeEventListener('message', handleOAuthMessage);
      stopOAuthPopup(true);
    };
  }, [owner, repositoryName]);

  /** Confirms the authenticated user's real GitHub Star before changing the visual state. */
  async function verifyStar() {
    if (!repository) {
      return;
    }

    setState('loading');
    const target = `${GITHUB_API_ORIGIN}/user/starred/${owner}/${repositoryName}`;
    try {
      const response = await fetch(`/api/github?path=${encodeURIComponent(target)}`, {
        method: 'GET',
        credentials: 'include',
        headers: { Accept: 'application/vnd.github+json' }
      });
      setState(response.status === 204 ? 'starred' : 'error');
    } catch {
      setState('error');
    }
  }

  function handleStar(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    if (isLoading || isStarred) {
      return;
    }

    if (!repository) {
      return;
    }

    setState('loading');
    const authWindow = openGitHubAuthWindow(repository);
    if (authWindow) {
      watchOAuthPopup(authWindow);
    }
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
      void verifyStar();
    } else if (intent === 'configuration') {
      setState('configuration');
      notifyOAuthOpener('error');
    } else {
      setState('error');
      notifyOAuthOpener('error');
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
      aria-label={isLoading ? `正在打开 GitHub 授权窗口：给 ${repositoryName} 点 Star` : isStarred ? `已给 ${repositoryName} 点 Star` : `给 ${repositoryName} 点 Star`}
      title={isLoading ? '正在打开 GitHub 授权窗口' : isStarred ? '已 Star' : '给 GitHub 项目点 Star'}
      data-github-star={repositoryUrl}
      data-github-star-state={state}
    >
      {variant === 'floating' ? <GitHubGlyph /> : null}
      <StarGlyph filled={isStarred} />
      <span aria-live="polite">{label}</span>
    </button>
  );

  function watchOAuthPopup(popup: Window) {
    stopOAuthPopup(true);
    oauthWindowRef.current = popup;
    const poll = window.setInterval(() => {
      if (!popup.closed) {
        return;
      }

      window.clearInterval(poll);
      if (oauthPollRef.current === poll) {
        oauthPollRef.current = null;
      }
      if (oauthWindowRef.current === popup) {
        oauthWindowRef.current = null;
        setState('error');
      }
    }, 350);
    oauthPollRef.current = poll;
  }

  function stopOAuthPopup(close: boolean) {
    if (oauthPollRef.current !== null) {
      window.clearInterval(oauthPollRef.current);
      oauthPollRef.current = null;
    }

    const popup = oauthWindowRef.current;
    oauthWindowRef.current = null;
    if (close && popup && !popup.closed) {
      popup.close();
    }
  }
}

/** Opens OAuth directly from the click event so the browser cannot leave a blank shell while the request waits. */
function openGitHubAuthWindow(repository: GitHubRepository): Window | null {
  const startUrl = createGitHubOAuthStartUrl(repository);

  const authWindow = window.open(startUrl.toString(), GITHUB_STAR_POPUP_NAME, GITHUB_STAR_POPUP_FEATURES);
  if (authWindow) {
    authWindow.focus();
    return authWindow;
  }

  startUrl.searchParams.delete('popup');
  window.location.assign(startUrl.toString());
  return null;
}

function createGitHubOAuthStartUrl(repository: GitHubRepository) {
  const currentUrl = new URL(window.location.href);
  currentUrl.searchParams.delete('github_star');
  currentUrl.searchParams.delete('github_repo');
  const returnTo = `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`;
  const startUrl = new URL('/api/github/oauth/start', window.location.origin);
  startUrl.searchParams.set('repo', repository.url);
  startUrl.searchParams.set('returnTo', returnTo);
  startUrl.searchParams.set('popup', '1');
  return startUrl;
}

/** Reports a configuration or cancellation result to the opener without exposing OAuth data. */
function notifyOAuthOpener(status: GitHubStarOAuthStatus): boolean {
  if (!window.opener || window.opener === window || window.opener.closed) {
    return false;
  }

  try {
    window.opener.postMessage({ source: GITHUB_STAR_MESSAGE_SOURCE, status }, window.location.origin);
    window.setTimeout(() => window.close(), 50);
    return true;
  } catch {
    return false;
  }
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
