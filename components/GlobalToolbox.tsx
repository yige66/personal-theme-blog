'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { SiteColumn } from '@/lib/blog';

type GlobalToolboxProps = {
  columns?: SiteColumn[];
  github: string;
  email: string;
};

const tools = [
  { href: '/archive', label: '文', title: '文章归档' },
  { href: '/photowall', label: '图', title: '照片墙' },
  { href: '/music', label: '音', title: '音乐电台' },
  { href: '/moments', label: '记', title: '生活动态' },
  { href: '/chatter', label: '谈', title: '云端杂谈' },
  { href: '/friends', label: '友', title: '友链星团' }
];

function toolboxItems(columns: SiteColumn[] = []) {
  const configured = columns
    .filter((column) => column.visible && column.toolboxVisible)
    .map((column) => ({
      href: column.href,
      label: column.label.slice(0, 1) || column.id.slice(0, 1),
      title: column.title || column.label
    }));

  return configured.length > 0 ? configured : tools;
}

export function GlobalToolbox({ columns = [], github, email }: GlobalToolboxProps) {
  const pathname = usePathname();
  const githubIsExternal = github.startsWith('http');
  const isHome = pathname === '/';
  const isAdmin = pathname.startsWith('/admin');
  const [open, setOpen] = useState(false);
  const items = toolboxItems(columns);
  const publicEmail = email.includes('@') ? email : '';

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setOpen(false);
  };

  if (isHome || isAdmin) {
    return null;
  }

  return (
    <aside className={`xh-global-toolbox${open ? ' is-open' : ''}`} aria-label="全局快捷工具">
      <button
        className="xh-toolbox-trigger"
        type="button"
        aria-expanded={open}
        aria-label={open ? '收起快捷工具' : '打开快捷工具'}
        title={open ? '收起快捷工具' : '快捷工具'}
        onClick={() => setOpen((current) => !current)}
      >
        <span aria-hidden="true" />
      </button>
      <div className="xh-toolbox-menu" aria-hidden={!open}>
        <button type="button" onClick={scrollToTop} aria-label="回到顶部" title="回到顶部">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 5l7 7-1.4 1.4-4.6-4.58V20h-2V8.82l-4.6 4.58L5 12l7-7z" />
          </svg>
        </button>
        {items.map((tool) => {
          const active = pathname === tool.href || pathname.startsWith(`${tool.href}/`);
          return (
            <Link
              className={active ? 'is-active' : ''}
              href={tool.href}
              aria-label={tool.title}
              title={tool.title}
              key={tool.href}
              onClick={() => setOpen(false)}
            >
              {tool.label}
            </Link>
          );
        })}
        <a
          href={githubIsExternal ? github : '/projects'}
          target={githubIsExternal ? '_blank' : undefined}
          rel={githubIsExternal ? 'noreferrer' : undefined}
          aria-label="GitHub"
          title="GitHub"
        >
          Git
        </a>
        {publicEmail ? (
          <a href={`mailto:${publicEmail}`} aria-label="发送邮件" title="发送邮件">
            Mail
          </a>
        ) : (
          <Link href="/about" aria-label="联系信息" title="联系信息" onClick={() => setOpen(false)}>
            About
          </Link>
        )}
      </div>
    </aside>
  );
}
