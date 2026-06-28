'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const navItems = [
  { href: '/', label: '首页' },
  { href: '/projects', label: '项目' },
  { href: '/archive', label: '归档' },
  { href: '/gallery', label: '照片墙' },
  { href: '/music', label: '音乐' },
  { href: '/moments', label: '说说' },
  { href: '/tags', label: '标签' },
  { href: '/links', label: '友链' },
  { href: '/about', label: '关于' },
  { href: '/console', label: '后台' }
];

function isActive(pathname: string, href: string): boolean {
  if (href === '/') {
    return pathname === '/';
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteNav({ title }: { title: string }) {
  const pathname = usePathname();
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let previousY = window.scrollY;

    const handleScroll = () => {
      const currentY = window.scrollY;
      setHidden(currentY > previousY && currentY > 120);
      previousY = Math.max(0, currentY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`top-nav site-nav${hidden ? ' is-hidden' : ''}`} aria-label="主导航">
      <Link className="brand" href="/" aria-label={`${title} 首页`}>
        <span>{title}</span>
        <small>Personal Blog</small>
      </Link>
      <div className="nav-links">
        {navItems.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link className={active ? 'active' : ''} aria-current={active ? 'page' : undefined} key={item.href} href={item.href}>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
