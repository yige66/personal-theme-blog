'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type CSSProperties, useEffect, useRef, useState } from 'react';
import { experienceRoutes } from '@/lib/experience';

const routeLabels: Record<string, string> = {
  home: '首页',
  projects: '项目',
  archive: '归档',
  photowall: '照片墙',
  music: '音乐',
  moments: '说说',
  chatter: '杂谈',
  tags: '标签',
  friends: '友链',
  timeline: '时间线',
  about: '关于',
  console: '后台'
};

function cleanTitle(title: string): string {
  if (title.includes('星') && (title.includes('手') || title.includes('记'))) {
    return title;
  }

  if (/^[A-Za-z0-9\s'._-]+$/.test(title.trim())) {
    return title;
  }

  return '星屿手记';
}

function labelFor(id: string, fallback: string): string {
  return routeLabels[id] ?? fallback;
}

function isActive(pathname: string, href: string): boolean {
  if (href === '/') {
    return pathname === '/';
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteNav({ title }: { title: string }) {
  const pathname = usePathname();
  const ringRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ angle: number; rotation: number } | null>(null);
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [orbitRotation, setOrbitRotation] = useState(0);
  const [orbitDragging, setOrbitDragging] = useState(false);
  const brandTitle = cleanTitle(title);

  useEffect(() => {
    let previousY = window.scrollY;

    const handleScroll = () => {
      const currentY = window.scrollY;
      setHidden(currentY > previousY && currentY > 120 && !menuOpen);
      previousY = Math.max(0, currentY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [menuOpen]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (menuOpen) {
      setOrbitRotation(0);
    }
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [menuOpen]);

  const getOrbitAngle = (clientX: number, clientY: number): number => {
    const rect = ringRef.current?.getBoundingClientRect();
    if (!rect) {
      return 0;
    }

    return Math.atan2(clientY - (rect.top + rect.height / 2), clientX - (rect.left + rect.width / 2)) * (180 / Math.PI);
  };

  const normalizeDelta = (value: number): number => {
    if (value > 180) {
      return value - 360;
    }

    if (value < -180) {
      return value + 360;
    }

    return value;
  };

  const handleOrbitPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('a,button')) {
      return;
    }

    dragRef.current = {
      angle: getOrbitAngle(event.clientX, event.clientY),
      rotation: orbitRotation
    };
    setOrbitDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleOrbitPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) {
      return;
    }

    event.preventDefault();
    const nextAngle = getOrbitAngle(event.clientX, event.clientY);
    setOrbitRotation(drag.rotation + normalizeDelta(nextAngle - drag.angle));
  };

  const handleOrbitPointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = null;
    setOrbitDragging(false);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <>
      <nav className={`top-nav site-nav${hidden ? ' is-hidden' : ''}${menuOpen ? ' is-orbit-open' : ''}`} aria-label="主导航">
        <Link className="brand" href="/" aria-label={`${brandTitle} 首页`}>
          <span>{brandTitle}</span>
          <small>Personal Blog</small>
        </Link>

        <div className="nav-links">
          {experienceRoutes.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link className={active ? 'active' : ''} aria-current={active ? 'page' : undefined} key={item.href} href={item.href}>
                {labelFor(item.id, item.label)}
              </Link>
            );
          })}
        </div>

        <button
          className="mobile-orbit-toggle"
          type="button"
          aria-expanded={menuOpen}
          aria-controls="mobile-orbit-panel"
          aria-label={menuOpen ? '关闭导航' : '打开导航'}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>
      </nav>

      <div className={`mobile-orbit-panel${menuOpen ? ' is-open' : ''}`} id="mobile-orbit-panel" aria-hidden={!menuOpen}>
        <button className="mobile-orbit-scrim" type="button" aria-label="关闭导航背景" onClick={() => setMenuOpen(false)} />
        <div
          className={`mobile-orbit-ring${orbitDragging ? ' is-dragging' : ''}`}
          role="menu"
          aria-label="移动端星轨导航"
          ref={ringRef}
          onPointerDown={handleOrbitPointerDown}
          onPointerMove={handleOrbitPointerMove}
          onPointerUp={handleOrbitPointerEnd}
          onPointerCancel={handleOrbitPointerEnd}
          style={{ '--orbit-rotation': `${orbitRotation}deg` } as CSSProperties}
        >
          <div className="mobile-orbit-core">
            <strong>{brandTitle}</strong>
            <small>选择入口</small>
          </div>
          {experienceRoutes.map((item, index) => {
            const active = isActive(pathname, item.href);
            const angle = index * (360 / experienceRoutes.length) - 90;
            const style = {
              '--orbit-angle': `${angle}deg`,
              '--orbit-counter-angle': `${-(angle + orbitRotation)}deg`
            } as CSSProperties;

            return (
              <Link
                className={active ? 'active' : ''}
                aria-current={active ? 'page' : undefined}
                href={item.href}
                key={item.href}
                role="menuitem"
                style={style}
              >
                <span>{labelFor(item.id, item.label)}</span>
                <small>{item.tone} / {item.coordinate}</small>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
