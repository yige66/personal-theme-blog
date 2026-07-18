'use client';

import { useEffect, useState } from 'react';

export function GitHubOAuthCallback() {
  const [message, setMessage] = useState('');

  useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get('code') || '';
    const state = url.searchParams.get('state') || '';
    const oauthError = url.searchParams.get('error');
    if (!code || !state) {
      if (oauthError) {
        clearOAuthParameters(url);
        setMessage('GitHub 登录已取消。');
      }
      return undefined;
    }

    let canceled = false;
    setMessage('正在完成 GitHub 登录…');
    fetch('/api/github/oauth/exchange', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, state })
    })
      .then(async (response) => {
        const data: unknown = await response.json().catch(() => null);
        if (!response.ok || !isRedirectPayload(data)) {
          throw new Error('GitHub OAuth exchange failed');
        }
        return data.redirectTo;
      })
      .then((redirectTo) => {
        if (!canceled) {
          window.location.replace(toSafeLocalPath(redirectTo));
        }
      })
      .catch(() => {
        if (canceled) {
          return;
        }

        clearOAuthParameters(url);
        setMessage('GitHub 登录暂时不可用，请稍后重试。');
      });

    return () => {
      canceled = true;
    };
  }, []);

  return message ? <span className="visually-hidden" role="status" aria-live="polite">{message}</span> : null;
}

function isRedirectPayload(value: unknown): value is { redirectTo: string } {
  return typeof value === 'object'
    && value !== null
    && 'redirectTo' in value
    && typeof value.redirectTo === 'string';
}

function toSafeLocalPath(value: string): string {
  try {
    const url = new URL(value, window.location.origin);
    if (url.origin !== window.location.origin || !url.pathname.startsWith('/') || url.pathname.startsWith('//')) {
      return '/projects';
    }
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return '/projects';
  }
}

function clearOAuthParameters(url: URL) {
  ['code', 'state', 'error', 'error_description', 'error_uri'].forEach((key) => url.searchParams.delete(key));
  window.history.replaceState(null, document.title, `${url.pathname}${url.search}${url.hash}`);
}
