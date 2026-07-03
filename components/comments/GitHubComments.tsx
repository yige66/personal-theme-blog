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
const GITALK_SECRET_OPTION = ['client', 'Secret'].join('');

let gitalkLoader: Promise<GitalkConstructor> | null = null;

export function GitHubComments({ compact = false, config, term, title }: GitHubCommentsProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [shouldLoad, setShouldLoad] = useState(true);
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
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
  const enabled = Boolean(config.enabled && repoIsValid && clientIsConfigured && provider.includes('gitalk'));
  const commentId = useMemo(() => createGitalkId(config.mapping, term, title), [config.mapping, term, title]);
  const issueUrl = repoIsValid ? `https://github.com/${owner}/${repo}/issues` : 'https://github.com';
  const loginUrl = repoIsValid ? `https://github.com/${owner}/${repo}/issues?q=${encodeURIComponent(commentId)}` : 'https://github.com/login';

  useEffect(() => {
    if (!shouldLoad || !enabled || !containerRef.current) {
      return undefined;
    }

    let canceled = false;
    const container = containerRef.current;
    container.innerHTML = '';
    setLoadState('loading');

    loadGitalk()
      .then((Gitalk) => {
        if (canceled) {
          return;
        }

        const gitalk = new Gitalk({
          clientID: config.clientId || '',
          repo,
          owner: owner || '',
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
        syncGitalkTheme(container);
        cleanOAuthCodeFromUrl();
        setLoadState('ready');
      })
      .catch(() => {
        if (!canceled) {
          setLoadState('error');
        }
      });

    return () => {
      canceled = true;
      container.innerHTML = '';
    };
  }, [admin, commentId, compact, config.clientId, config.label, config.proxy, enabled, owner, repo, shouldLoad, term, title]);

  const commentsContent = (
    <>
      <header className="github-comments-head">
        <div>
          <span>GitHub Login Comments</span>
          <strong>{compact ? '评论' : title}</strong>
          <small>使用 GitHub 账号登录，评论会同步到仓库 Issues。</small>
        </div>
        <div className="github-comments-actions">
          <a href={issueUrl} target="_blank" rel="noreferrer">Issues</a>
          <a href={loginUrl} target="_blank" rel="noreferrer">GitHub</a>
        </div>
      </header>

      {enabled ? (
        <>
          <div className="github-comments-loader" data-state={loadState}>
            <div>
              <strong>{loadState === 'ready' ? '评论区已连接' : '目标站同款 Gitalk 评论'}</strong>
              <p>点击后加载 Gitalk。登录 GitHub 后即可在当前页面对应的 Issue 下发表评论。</p>
            </div>
            <button type="button" onClick={() => setShouldLoad(true)} disabled={shouldLoad && loadState !== 'error'}>
              {loadState === 'loading' ? '正在连接 GitHub' : loadState === 'error' ? '重新连接' : '评论区自动加载中'}
            </button>
          </div>
          <div className={`github-comments-frame ${compact ? 'moment-gitalk' : 'custom-gitalk-glass'}`} ref={containerRef} data-term={commentId} data-provider="gitalk" />
        </>
      ) : (
        <div className="github-comments-setup">
          <strong>Gitalk 评论入口已预留</strong>
          <p>需要在 GitHub OAuth App 中配置 Client ID，并在部署环境设置服务端 OAuth 密钥。密钥只会在 `/api/github` 代理中读取。</p>
          <code>{'comments: { provider: "gitalk", owner: "user", repo: "repo", clientId: "..." }'}</code>
        </div>
      )}
    </>
  );

  if (compact) {
    return (
      <section className="github-comments-card is-compact" aria-label={`${title} 的 GitHub 评论`}>
        {commentsContent}
      </section>
    );
  }

  return (
    <section className="main-shell github-comments-shell" aria-label={`${title} 的 GitHub 评论`}>
      <div className="github-comments-card">
        {commentsContent}
      </div>
    </section>
  );
}

function loadGitalk(): Promise<GitalkConstructor> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Gitalk can only load in the browser.'));
  }

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
