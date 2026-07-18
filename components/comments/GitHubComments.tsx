'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { CommentConfig } from '@/lib/blog';

type GitHubCommentsProps = {
  config: CommentConfig;
  term: string;
  title: string;
  compact?: boolean;
};

type GitalkOptions = {
  clientID: string;
  repo: string;
  owner: string;
  admin: string[];
  id: string;
  title: string;
  body: string;
  labels: string[];
  distractionFreeMode: boolean;
  pagerDirection: 'first' | 'last';
  proxy?: string;
  [key: string]: unknown;
};

type GitalkConstructor = new (options: GitalkOptions) => {
  render: (container: HTMLElement) => void;
};

declare global {
  interface Window {
    Gitalk?: GitalkConstructor;
  }
}

const VALID_NAME = /^[\w.-]{1,100}$/;
const GITALK_SCRIPT_ID = 'gitalk-client-script';
const GITALK_STYLE_ID = 'gitalk-client-style';
const GITALK_SCRIPT_SRC = 'https://cdn.jsdelivr.net/npm/gitalk@1.8.0/dist/gitalk.min.js';
const GITALK_STYLE_HREF = 'https://cdn.jsdelivr.net/npm/gitalk@1.8.0/dist/gitalk.css';
const GITHUB_API_ORIGIN = 'https://api.github.com';
const GITHUB_API_PROXY_PATH = '/api/github';
const GITALK_SECRET_OPTION = ['client', 'Secret'].join('');
const GITALK_ACCOUNT_POPUP_MANAGED_ATTR = 'data-xh-managed-gitalk-popup';
const GITALK_REMOTE_ERROR_PATTERN = /(?:request failed|status code\s+(?:4\d{2}|5\d{2})|network error|failed to fetch)/i;

let gitalkLoader: Promise<GitalkConstructor> | null = null;
let githubApiProxyInstalled = false;
const gitalkAccountPopupHosts = new WeakSet<HTMLElement>();

export function GitHubComments({ compact = false, config, term, title }: GitHubCommentsProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [retryKey, setRetryKey] = useState(0);
  const provider = (config.provider || 'gitalk').toLowerCase();
  const owner = config.owner || parseOwnerFromRepo(config.repo);
  const repo = parseRepoName(config.repo);
  const admin = useMemo(() => {
    if (Array.isArray(config.admin) && config.admin.length > 0) {
      return config.admin.filter((name) => VALID_NAME.test(name));
    }
    return owner && VALID_NAME.test(owner) ? [owner] : [];
  }, [config.admin, owner]);
  const repoIsValid = VALID_NAME.test(repo) && Boolean(owner && VALID_NAME.test(owner));
  const clientIsConfigured = Boolean(config.clientId?.trim());
  const commentsEnabled = Boolean(config.enabled && repoIsValid && provider.includes('gitalk'));
  const canLoadGitalk = commentsEnabled && clientIsConfigured;
  const commentId = useMemo(() => createGitalkId(config.mapping, term, title), [config.mapping, term, title]);

  useEffect(() => {
    if (!canLoadGitalk || !containerRef.current) {
      return undefined;
    }

    let canceled = false;
    const container = containerRef.current;
    setLoadState('loading');

    const observer = new MutationObserver(() => {
      removeGitalkPreviewControls(container);
      if (!canceled && sanitizeGitalkError(container)) {
        setLoadState('error');
      }
    });
    observer.observe(container, { childList: true, subtree: true, characterData: true });

    renderGitalk({
      admin,
      commentId,
      compact,
      config,
      container,
      owner,
      repo,
      term,
      title
    })
      .then(() => {
        if (!canceled) {
          setLoadState(sanitizeGitalkError(container) ? 'error' : 'ready');
        }
      })
      .catch(() => {
        if (!canceled) {
          container.replaceChildren();
          setLoadState('error');
        }
      });

    return () => {
      canceled = true;
      observer.disconnect();
      container.innerHTML = '';
    };
  }, [admin, canLoadGitalk, commentId, compact, config, owner, repo, retryKey, term, title]);

  if (!canLoadGitalk) {
    return (
      <section
        className={compact ? 'github-comments-card is-compact' : 'main-shell github-comments-shell'}
        aria-label={`${title} 的 GitHub 评论`}
        data-comment-variant={compact ? 'compact' : 'full'}
        data-comment-state="unconfigured"
      >
        <div className="github-comments-card github-comments-setup-card">
          <div className="github-comments-setup" aria-live="polite">
            <strong>{repoIsValid ? 'Gitalk OAuth 尚未配置' : '评论仓库配置无效'}</strong>
            <p>
              要和 XingHuiSama 参考页一样显示 Gitalk 评论框，需要配置你自己的 GitHub OAuth App：
              `NEXT_PUBLIC_GITALK_CLIENT_ID` 和服务端 `GITHUB_CLIENT_SECRET`。
            </p>
            <code>{'comments: { provider: "gitalk", owner: "user", repo: "repo", clientId: "..." }'}</code>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className={compact ? 'github-comments-card is-compact' : 'main-shell github-comments-shell'}
      aria-label={`${title} 的 GitHub 评论`}
      data-comment-variant={compact ? 'compact' : 'full'}
      data-comment-state={loadState}
    >
      <div
        className={`github-comments-frame ${compact ? 'moment-gitalk' : 'custom-gitalk-glass'}`}
        data-provider="gitalk"
        data-state={loadState}
        data-term={commentId}
        data-comment-id={commentId}
      >
        {loadState === 'error' ? (
          <div className="github-comments-setup github-comments-error" aria-live="polite">
            <strong>评论暂时无法加载</strong>
            <p>评论服务暂时没有响应，页面内容不受影响。你可以稍后重试。</p>
            <button className="github-comments-retry" type="button" onClick={() => setRetryKey((value) => value + 1)}>
              重新加载评论
            </button>
          </div>
        ) : null}
        {loadState === 'idle' || loadState === 'loading' ? <GitalkLoadingShell /> : null}
        <div className="github-comments-gitalk-host" ref={containerRef} aria-live="polite" />
      </div>
    </section>
  );
}

function GitalkLoadingShell() {
  return (
    <div className="gt-container github-comments-loading" aria-hidden="true">
      <div className="gt-meta">
        <span className="gt-counts">0 条评论</span>
        <span className="gt-user">未登录用户</span>
      </div>
      <div className="gt-header">
        <span className="gt-avatar github-comments-loading-avatar" />
        <textarea className="gt-header-textarea" disabled placeholder="说点什么" />
        <div className="gt-header-controls">
          <span className="gt-header-controls-tip">支持 Markdown 语法 · Gitalk 加载中 ...</span>
          <button className="gt-btn gt-btn-login" type="button" disabled>
            使用 GitHub 登录
          </button>
        </div>
      </div>
      <div className="gt-comments" />
    </div>
  );
}

async function renderGitalk({
  admin,
  commentId,
  compact,
  config,
  container,
  owner,
  repo,
  term,
  title
}: {
  admin: string[];
  commentId: string;
  compact: boolean;
  config: CommentConfig;
  container: HTMLElement;
  owner: string;
  repo: string;
  term: string;
  title: string;
}) {
  const Gitalk = await loadGitalk();
  const gitalk = new Gitalk({
    clientID: config.clientId || '',
    repo,
    owner,
    admin,
    id: commentId,
    title: title.slice(0, 80),
    body: `评论来源：${typeof window === 'undefined' ? term : window.location.href}`,
    labels: [config.label || 'comment'],
    distractionFreeMode: compact,
    pagerDirection: 'last',
    proxy: config.proxy || '/api/github',
    [GITALK_SECRET_OPTION]: 'server-side-oauth-proxy'
  });

  gitalk.render(container);
  removeGitalkPreviewControls(container);
  syncGitalkTheme(container);
  installGitalkAccountPopup(container);
  cleanOAuthCodeFromUrl();
}

/**
 * Removes Gitalk's inactive Markdown preview controls after each render.
 */
function removeGitalkPreviewControls(container: HTMLElement) {
  container.querySelectorAll('.gt-btn-preview, .gt-header-preview').forEach((node) => node.remove());
}

/**
 * Provides a stable account menu when Gitalk does not mount its own popup.
 */
function installGitalkAccountPopup(container: HTMLElement) {
  if (gitalkAccountPopupHosts.has(container)) {
    return;
  }

  container.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    const managedAction = target.closest(`[${GITALK_ACCOUNT_POPUP_MANAGED_ATTR}] .gt-action`);
    if (managedAction && container.contains(managedAction)) {
      event.preventDefault();
      const loginButton = container.querySelector<HTMLButtonElement>('.gt-btn-login');
      loginButton?.click();
      return;
    }

    const trigger = target.closest('.gt-user-inner');
    if (!trigger || !container.contains(trigger)) {
      closeManagedGitalkPopups(container);
      return;
    }

    const user = trigger.closest<HTMLElement>('.gt-user');
    const nativePopup = user?.querySelector(`.gt-popup:not([${GITALK_ACCOUNT_POPUP_MANAGED_ATTR}])`);
    if (!user || nativePopup) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    toggleManagedGitalkPopup(container, user, trigger);
  }, { capture: true });

  gitalkAccountPopupHosts.add(container);
}

function toggleManagedGitalkPopup(container: HTMLElement, user: HTMLElement, trigger: Element) {
  const existing = user.querySelector<HTMLElement>(`.gt-popup[${GITALK_ACCOUNT_POPUP_MANAGED_ATTR}]`);
  closeManagedGitalkPopups(container);
  if (existing) {
    trigger.classList.remove('is--poping');
    return;
  }

  const popup = document.createElement('div');
  popup.className = 'gt-popup';
  popup.setAttribute(GITALK_ACCOUNT_POPUP_MANAGED_ATTR, 'true');
  popup.innerHTML = [
    '<button class="gt-action" type="button">使用 GitHub 登录</button>',
    '<div class="gt-version">Gitalk 1.8.0</div>'
  ].join('');
  user.appendChild(popup);
  trigger.classList.add('is--poping');
}

function closeManagedGitalkPopups(container: HTMLElement) {
  container.querySelectorAll<HTMLElement>(`.gt-popup[${GITALK_ACCOUNT_POPUP_MANAGED_ATTR}]`).forEach((popup) => {
    popup.remove();
  });
  container.querySelectorAll('.gt-user-inner.is--poping').forEach((trigger) => {
    trigger.classList.remove('is--poping');
  });
}

function loadGitalk(): Promise<GitalkConstructor> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Gitalk can only load in the browser.'));
  }

  installGitHubApiProxy();

  if (window.Gitalk) {
    return Promise.resolve(window.Gitalk);
  }

  if (gitalkLoader) {
    return gitalkLoader;
  }

  gitalkLoader = new Promise((resolve, reject) => {
    if (!document.getElementById(GITALK_STYLE_ID)) {
      const link = document.createElement('link');
      link.id = GITALK_STYLE_ID;
      link.rel = 'stylesheet';
      link.href = GITALK_STYLE_HREF;
      document.head.appendChild(link);
    }

    const existing = document.getElementById(GITALK_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => window.Gitalk ? resolve(window.Gitalk) : reject(new Error('Gitalk unavailable')), { once: true });
      existing.addEventListener('error', () => reject(new Error('Gitalk failed to load')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = GITALK_SCRIPT_ID;
    script.src = GITALK_SCRIPT_SRC;
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.addEventListener('load', () => window.Gitalk ? resolve(window.Gitalk) : reject(new Error('Gitalk unavailable')), { once: true });
    script.addEventListener('error', () => reject(new Error('Gitalk failed to load')), { once: true });
    document.head.appendChild(script);
  });

  return gitalkLoader;
}

function installGitHubApiProxy() {
  if (githubApiProxyInstalled || typeof window === 'undefined') {
    return;
  }

  const proxiedRequests = new WeakSet<XMLHttpRequest>();
  const originalOpen = XMLHttpRequest.prototype.open;
  const proxyOpen = function(this: XMLHttpRequest, method: string, url: string | URL, async?: boolean, username?: string | null, password?: string | null) {
    const target = typeof url === 'string' ? url : url.toString();
    const nextUrl = getGitHubProxyUrl(target);
    if (nextUrl) {
      proxiedRequests.add(this);
    }

    return originalOpen.call(this, method, nextUrl || url, async ?? true, username, password);
  };
  XMLHttpRequest.prototype.open = proxyOpen as typeof XMLHttpRequest.prototype.open;

  const originalSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;
  const proxySetRequestHeader = function(this: XMLHttpRequest, name: string, value: string) {
    // Gitalk adds Basic auth for direct api.github.com calls. The same-origin
    // proxy does not need it, and forwarding it can turn a public read into 403.
    if (proxiedRequests.has(this) && /^authorization$/i.test(name) && /^Basic\s+/i.test(value)) {
      return;
    }

    return originalSetRequestHeader.call(this, name, value);
  };
  XMLHttpRequest.prototype.setRequestHeader = proxySetRequestHeader;
  githubApiProxyInstalled = true;
}

function getGitHubProxyUrl(value: string): string | null {
  try {
    const target = new URL(value, window.location.href);
    if (target.origin !== GITHUB_API_ORIGIN || !target.pathname.startsWith('/')) {
      return null;
    }

    return `${GITHUB_API_PROXY_PATH}?path=${encodeURIComponent(target.toString())}`;
  } catch {
    return null;
  }
}

function createGitalkId(mapping = 'pathname', term: string, title: string): string {
  let value = term;
  if (mapping === 'title' || mapping === 'og:title') {
    value = title;
  }

  if (mapping === 'url' && typeof window !== 'undefined') {
    value = window.location.pathname;
  }

  const normalized = value.replace(/^https?:\/\/[^/]+/i, '').replace(/[?#].*$/, '').replace(/\/$/, '') || '/';
  return normalized.substring(0, 49);
}

function parseOwnerFromRepo(repo: string): string {
  return repo.includes('/') ? repo.split('/')[0] : '';
}

function parseRepoName(repo: string): string {
  return repo.includes('/') ? repo.split('/').at(-1) || '' : repo;
}

function sanitizeGitalkError(container: HTMLElement): boolean {
  const hasRemoteError = Array.from(container.querySelectorAll<HTMLElement>('*')).some((node) => {
    if (node.children.length > 0) {
      return false;
    }

    const text = node.textContent?.replace(/\s+/g, ' ').trim() || '';
    return text.length <= 240 && GITALK_REMOTE_ERROR_PATTERN.test(text);
  });

  if (!hasRemoteError) {
    return false;
  }

  container.replaceChildren();
  return true;
}

function syncGitalkTheme(container: HTMLElement) {
  const apply = () => {
    container.classList.toggle('is-night', document.documentElement.dataset.xhTheme === 'night');
  };

  apply();
  const observer = new MutationObserver(apply);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-xh-theme'] });
  window.setTimeout(() => observer.disconnect(), 12_000);
}

function cleanOAuthCodeFromUrl() {
  if (!window.location.search.includes('code=')) {
    return;
  }

  const url = new URL(window.location.href);
  url.searchParams.delete('code');
  url.searchParams.delete('state');
  window.history.replaceState(null, document.title, `${url.pathname}${url.search}${url.hash}`);
}
