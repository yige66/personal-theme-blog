'use client';

import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { parseGitHubRepository, type GitHubRepository } from '@/lib/github-repository';

type StarState = 'idle' | 'loading' | 'starred' | 'error' | 'configuration';

export type GitHubStarButtonProps = {
  className?: string;
  repo: string;
  variant?: 'project' | 'floating';
};

type ProjectStarButtonProps = {
  repo: string;
};

type StarredRepositoryPayload = {
  full_name?: unknown;
  name?: unknown;
  owner?: { login?: unknown };
};

const STARRED_REPOSITORIES_ENDPOINT = 'https://api.github.com/user/starred?per_page=100';
let starredRepositoryCache: Set<string> | null = null;
let hasLoadedStarredRepositories = false;
let starredRepositoriesRequest: Promise<Set<string> | null> | null = null;
const optimisticStarredRepositories = new Set<string>();
const starStatusListeners = new Set<() => void>();

/** 通过同一 HttpOnly 会话读取当前用户的 Star 列表，并在页面内的按钮之间共享结果。 */
function loadStarredRepositories(): Promise<Set<string> | null> {
  if (hasLoadedStarredRepositories) {
    return Promise.resolve(starredRepositoryCache);
  }

  if (starredRepositoriesRequest) {
    return starredRepositoriesRequest;
  }

  starredRepositoriesRequest = fetch(`/api/github?path=${encodeURIComponent(STARRED_REPOSITORIES_ENDPOINT)}`, {
    credentials: 'include',
    headers: { Accept: 'application/vnd.github+json' },
    cache: 'no-store'
  })
    .then(async (response) => {
      if (response.status === 401 || response.status === 403) {
        hasLoadedStarredRepositories = true;
        starredRepositoryCache = new Set();
        return starredRepositoryCache;
      }

      if (!response.ok) {
        throw new Error(`GitHub starred repositories request failed with ${response.status}`);
      }

      const payload: unknown = await response.json();
      if (!Array.isArray(payload)) {
        throw new Error('GitHub starred repositories response was not an array');
      }

      const next = new Set(
        payload
          .map((entry) => repositoryKeyFromGitHubPayload(entry as StarredRepositoryPayload))
          .filter((key): key is string => Boolean(key))
      );
      optimisticStarredRepositories.forEach((key) => next.add(key));
      starredRepositoryCache = next;
      hasLoadedStarredRepositories = true;
      return next;
    })
    .catch(() => null)
    .finally(() => {
      starredRepositoriesRequest = null;
    });

  return starredRepositoriesRequest;
}

function repositoryKeyFromGitHubPayload(payload: StarredRepositoryPayload): string {
  const fullName = typeof payload.full_name === 'string'
    ? payload.full_name
    : typeof payload.owner?.login === 'string' && typeof payload.name === 'string'
      ? `${payload.owner.login}/${payload.name}`
      : '';
  const repository = parseGitHubRepository(`https://github.com/${fullName}`);
  return repository ? `${repository.owner}/${repository.repo}`.toLowerCase() : '';
}

function repositoryKey(repository: GitHubRepository): string {
  return `${repository.owner}/${repository.repo}`.toLowerCase();
}

function getCachedStarredState(key: string): boolean | undefined {
  if (optimisticStarredRepositories.has(key)) {
    return true;
  }

  return hasLoadedStarredRepositories ? starredRepositoryCache?.has(key) ?? false : undefined;
}

function subscribeToStarStatus(listener: () => void): () => void {
  starStatusListeners.add(listener);
  return () => starStatusListeners.delete(listener);
}

function markRepositoryAsStarred(repository: GitHubRepository): void {
  const key = repositoryKey(repository);
  optimisticStarredRepositories.add(key);
  starredRepositoryCache?.add(key);
  starStatusListeners.forEach((listener) => listener());
}

export function ProjectStarButton({ repo }: ProjectStarButtonProps) {
  return <GitHubStarButton repo={repo} variant="project" />;
}

export function GitHubStarButton({ className = '', repo, variant = 'project' }: GitHubStarButtonProps) {
  const repository = parseGitHubRepository(repo);
  const intentHandledRef = useRef(false);
  const confirmedStarRef = useRef(false);
  const [state, setState] = useState<StarState>('idle');
  const [remoteStarred, setRemoteStarred] = useState<boolean | undefined>(undefined);
  const owner = repository?.owner || '';
  const repositoryName = repository?.repo || '';
  const repositoryUrl = repository?.url || '';
  const repositoryKeyValue = repository ? repositoryKey(repository) : '';
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
    startGitHubOAuth(repository);
  }

  useEffect(() => {
    if (!repositoryKeyValue) {
      return undefined;
    }

    const updateRemoteState = () => {
      const nextState = getCachedStarredState(repositoryKeyValue);
      if (nextState !== undefined) {
        setRemoteStarred(nextState);
      }
    };
    const unsubscribe = subscribeToStarStatus(updateRemoteState);
    updateRemoteState();
    void loadStarredRepositories().then(updateRemoteState);
    return unsubscribe;
  }, [repositoryKeyValue]);

  useEffect(() => {
    if (remoteStarred === true) {
      setState('starred');
    } else if (remoteStarred === false && !confirmedStarRef.current) {
      setState((current) => current === 'starred' ? 'idle' : current);
    }
  }, [remoteStarred]);

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
      confirmedStarRef.current = true;
      markRepositoryAsStarred(repository);
      setState('starred');
    } else if (intent === 'configuration') {
      setState('configuration');
    } else {
      setState('error');
    }
  }, [owner, repository, repositoryName, repositoryUrl]);

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
      aria-label={isLoading ? `正在打开 GitHub 授权页面：给 ${repositoryName} 点 Star` : isStarred ? `已给 ${repositoryName} 点 Star` : `给 ${repositoryName} 点 Star`}
      title={isLoading ? '正在打开 GitHub 授权页面' : isStarred ? '已 Star' : '给 GitHub 项目点 Star'}
      data-github-star={repositoryUrl}
      data-github-star-state={state}
    >
      {variant === 'floating' ? <GitHubGlyph /> : null}
      <StarGlyph filled={isStarred} />
      <span aria-live="polite">{label}</span>
    </button>
  );
}

/** Navigates in the current tab so GitHub OAuth can complete without popup blockers or blank shells. */
function startGitHubOAuth(repository: GitHubRepository) {
  const startUrl = createGitHubOAuthStartUrl(repository);
  window.location.assign(startUrl.toString());
}

function createGitHubOAuthStartUrl(repository: GitHubRepository) {
  const currentUrl = new URL(window.location.href);
  currentUrl.searchParams.delete('github_star');
  currentUrl.searchParams.delete('github_repo');
  if (currentUrl.pathname === '/projects') {
    currentUrl.searchParams.set('projects_view', 'catalog');
    currentUrl.searchParams.set('projects_focus', repositoryKey(repository));
  }
  const returnTo = `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`;
  const startUrl = new URL('/api/github/oauth/start', window.location.origin);
  startUrl.searchParams.set('repo', repository.url);
  startUrl.searchParams.set('returnTo', returnTo);
  return startUrl;
}

function GitHubGlyph() {
  return (
    <svg className="github-star-glyph" aria-hidden="true" viewBox="0 0 24 24" focusable="false">
      <path d="M12 2C6.5 2 2 6.6 2 12.2c0 4.5 2.9 8.3 6.8 9.7.5.1.7-.2.7-.5v-1.9c-2.8.6-3.4-1.2-3.4-1.2-.4-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 0 1.6 1.1 1.1 1.6 1.1.9 1.6 2.4 1.1 3 .9.1-.7.4-1.1.7-1.4-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.5-1.3.1-2.7 0 0 .9-.3 2.8 1a9.5 9.5 0 0 1 5.1 0c1.9-1.3 2.8-1 2.8-1 .6 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.3 4.7-4.6 5 .4.3.7.9.7 1.8v2.7c0 .3.2.6.7.5 4-1.4 6.8-5.2 6.8-9.7C22 6.6 17.5 2 12 2Z" />
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
