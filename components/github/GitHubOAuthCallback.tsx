'use client';

import { useEffect, useState } from 'react';

type OAuthCallbackStatus = {
  tone: 'pending' | 'error';
  message: string;
};

const GITHUB_OAUTH_EXCHANGE_TIMEOUT_MS = 20_000;

/** Completes the OAuth callback and exposes failures as visible, retryable feedback. */
export function GitHubOAuthCallback() {
  const [status, setStatus] = useState<OAuthCallbackStatus | null>(null);
  const [isOAuthCallback, setIsOAuthCallback] = useState(false);

  useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get('code') || '';
    const state = url.searchParams.get('state') || '';
    const oauthError = url.searchParams.get('error');
    setIsOAuthCallback(Boolean((code && state) || oauthError));
    if (!code || !state) {
      if (oauthError) {
        clearOAuthParameters(url);
        setStatus({ tone: 'error', message: 'GitHub 登录已取消，请重新点击 Star。' });
      }
      return undefined;
    }

    let canceled = false;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), GITHUB_OAUTH_EXCHANGE_TIMEOUT_MS);
    setStatus({ tone: 'pending', message: '正在完成 GitHub Star 授权…' });
    fetch('/api/github/oauth/exchange', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, state }),
      signal: controller.signal
    })
      .then(async (response) => {
        const data: unknown = await response.json().catch(() => null);
        if (!response.ok || !isRedirectPayload(data)) {
          throw new Error('GitHub OAuth exchange failed');
        }
        return data.redirectTo;
      })
      .then((redirectTo) => {
        if (canceled) {
          return;
        }

        const safeRedirectTo = toSafeLocalPath(redirectTo);
        window.location.replace(safeRedirectTo);
      })
      .catch((error: unknown) => {
        if (canceled) {
          return;
        }

        clearOAuthParameters(url);
        const timedOut = error instanceof DOMException && error.name === 'AbortError';
        setStatus({
          tone: 'error',
          message: timedOut
            ? 'GitHub Star 授权超时，请检查 GitHub 登录状态后重试。'
            : 'GitHub Star 授权失败，请重新点击 Star。'
        });
      })
      .finally(() => {
        window.clearTimeout(timeout);
      });

    return () => {
      canceled = true;
    };
  }, []);

  return status ? (
    <div className={`github-oauth-status is-${status.tone}${isOAuthCallback ? ' is-callback' : ''}`} role="status" aria-live="polite">
      {status.message}
    </div>
  ) : null;
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
