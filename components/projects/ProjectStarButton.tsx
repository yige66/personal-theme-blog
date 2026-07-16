'use client';

import { useState, type MouseEvent } from 'react';

type ProjectStarButtonProps = {
  repo: string;
};

type GitHubRepository = {
  owner: string;
  repo: string;
  url: string;
};

const GITHUB_API_ORIGIN = 'https://api.github.com';
const GITHUB_TOKEN_KEYS = ['gitalk-token', 'GT_ACCESS_TOKEN', 'gitalk-token-v1'];

export function ProjectStarButton({ repo }: ProjectStarButtonProps) {
  const repository = parseGitHubRepository(repo);
  const [state, setState] = useState<'idle' | 'loading' | 'starred' | 'error'>('idle');
  const [authPrompt, setAuthPrompt] = useState(false);

  if (!repository) {
    return null;
  }

  const { owner, repo: repositoryName, url: repositoryUrl } = repository;
  const loginUrl = getGitHubLoginUrl(repositoryUrl);

  const isLoading = state === 'loading';
  const isStarred = state === 'starred';
  const label = isStarred ? '? Star' : state === 'error' ? '?? Star' : 'Star';

  async function handleStar(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    if (isLoading || isStarred) {
      return;
    }

    const accessToken = readGitHubAccessToken();
    if (!accessToken) {
      setAuthPrompt(true);
      return;
    }

    setState('loading');
    try {
      const target = `${GITHUB_API_ORIGIN}/user/starred/${owner}/${repositoryName}`;
      const response = await fetch(`/api/github?path=${encodeURIComponent(target)}`, {
        method: 'PUT',
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${accessToken}`
        }
      });

      if (response.ok || response.status === 204) {
        setState('starred');
        return;
      }

      if (response.status === 401 || response.status === 403) {
        setState('idle');
        setAuthPrompt(true);
        return;
      }

      setState('error');
    } catch {
      setState('error');
    }
  }

  return (
    <>
      <button
        className={`project-star-button${isStarred ? ' is-starred' : ''}${isLoading ? ' is-loading' : ''}`}
        type="button"
        onClick={handleStar}
        disabled={isLoading || isStarred}
        aria-busy={isLoading}
        aria-expanded={authPrompt}
        aria-controls={`star-login-${owner}-${repositoryName}`}
        aria-label={isStarred ? `?? ${repositoryName} ? Star` : `? ${repositoryName} ? Star`}
        title={isStarred ? '? Star' : '? GitHub ??? Star'}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
          <path d="m12 2.7 2.76 5.59 6.17.9-4.47 4.36 1.06 6.15L12 16.8l-5.52 2.9 1.06-6.15-4.47-4.36 6.17-.9L12 2.7Z" />
        </svg>
        <span>{isLoading ? '????' : label}</span>
      </button>
      {authPrompt ? (
        <div className="project-star-login-backdrop" role="presentation" onMouseDown={() => setAuthPrompt(false)}>
          <section
            className="project-star-login-dialog"
            id={`star-login-${owner}-${repositoryName}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`star-login-title-${owner}-${repositoryName}`}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <h2 id={`star-login-title-${owner}-${repositoryName}`}>???? GitHub ??? Star</h2>
            <p>???? GitHub?????????????????? Star?</p>
            <div className="project-star-login-actions">
              <button type="button" onClick={() => setAuthPrompt(false)}>??</button>
              <a href={loginUrl}>?? GitHub ??</a>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}

function getGitHubLoginUrl(repositoryUrl: string): string {
  if (typeof window === 'undefined') {
    return 'https://github.com/login';
  }

  return `https://github.com/login?return_to=${encodeURIComponent(window.location.href || repositoryUrl)}`;
}

function parseGitHubRepository(value: string): GitHubRepository | null {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!raw) {
    return null;
  }

  try {
    const url = new URL(raw);
    if (!/^github\.com$/i.test(url.hostname)) {
      return null;
    }

    const parts = url.pathname.split('/').filter(Boolean).map((part) => part.replace(/\.git$/i, ''));
    if (parts.length !== 2 || !isSafeGitHubName(parts[0]) || !isSafeGitHubName(parts[1])) {
      return null;
    }

    return {
      owner: parts[0],
      repo: parts[1],
      url: `https://github.com/${parts[0]}/${parts[1]}`
    };
  } catch {
    return null;
  }
}

function readGitHubAccessToken(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  for (const key of GITHUB_TOKEN_KEYS) {
    const value = window.localStorage.getItem(key)?.trim() || '';
    if (value && value.length <= 512 && !/[\u0000-\u001f\u007f]/.test(value)) {
      return value;
    }
  }

  return '';
}

function isSafeGitHubName(value: string | undefined): value is string {
  return Boolean(value && /^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/.test(value));
}
