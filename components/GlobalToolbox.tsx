'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type GlobalToolboxProps = {
  github: string;
  email: string;
};

const tools = [
  { href: '/archive', label: '文', title: '文章归档' },
  { href: '/photowall', label: '图', title: '照片墙' },
  { href: '/music', label: '音', title: '音乐电台' },
  { href: '/moments', label: '记', title: '说说动态' },
  { href: '/chatter', label: '谈', title: '云端杂谈' },
  { href: '/friends', label: '友', title: '友链星团' }
];

export function GlobalToolbox({ github, email }: GlobalToolboxProps) {
  const pathname = usePathname();
  const githubIsExternal = github.startsWith('http');

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <aside className="xh-global-toolbox" aria-label="全局快捷工具">
      <button type="button" onClick={scrollToTop} aria-label="回到顶部" title="回到顶部">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 5l7 7-1.4 1.4-4.6-4.58V20h-2V8.82l-4.6 4.58L5 12l7-7z" />
        </svg>
      </button>
      {tools.map((tool) => {
        const active = pathname === tool.href || pathname.startsWith(`${tool.href}/`);
        return (
          <Link className={active ? 'is-active' : ''} href={tool.href} aria-label={tool.title} title={tool.title} key={tool.href}>
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
      <a href={`mailto:${email}`} aria-label="发送邮件" title="发送邮件">
        Mail
      </a>
    </aside>
  );
}
