'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type CSSProperties, useEffect, useRef, useState } from 'react';
import { experienceRoutes } from '@/lib/experience';
import type { SiteColumn } from '@/lib/blog';

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
  about: '关于'
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

function cleanBrandSuffix(value?: string): string {
  const suffix = String(value ?? '').trim();
  return suffix ? ` ${suffix}` : '';
}

function labelFor(id: string, fallback: string): string {
  return routeLabels[id] ?? fallback;
}

function navRoutes(columns: SiteColumn[] = []) {
  const byId = new Map(columns.map((column) => [column.id, column]));
  const routes = experienceRoutes
    .map((route) => {
      const column = byId.get(route.id);
      if (column && (!column.visible || !column.navVisible)) {
        return null;
      }

      return {
        ...route,
        href: column?.href || route.href,
        label: column?.label || labelFor(route.id, route.label),
        tone: column?.tone || route.tone,
        coordinate: column?.coordinate || route.coordinate,
        room: column?.room || route.room
      };
    })
    .filter((route): route is NonNullable<typeof route> => Boolean(route));

  const customRoutes = columns
    .filter((column) => column.visible && column.navVisible)
    .filter((column) => !experienceRoutes.some((route) => route.id === column.id))
    .map((column) => ({
      id: column.id,
      href: column.href,
      label: column.label,
      tone: column.tone || 'Custom',
      coordinate: column.coordinate || '',
      room: column.room || column.title
    }));

  return [...routes, ...customRoutes];
}

function isActive(pathname: string, href: string): boolean {
  if (href === '/') {
    return pathname === '/';
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteNav({ columns = [], title, brandSuffix }: { columns?: SiteColumn[]; title: string; brandSuffix?: string }) {
  const pathname = usePathname();
  const ringRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ angle: number; rotation: number } | null>(null);
  const fadeRef = useRef(0);
  const [hidden, setHidden] = useState(false);
  const [navFade, setNavFade] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [orbitRotation, setOrbitRotation] = useState(0);
  const [orbitDragging, setOrbitDragging] = useState(false);
  const brandTitle = cleanTitle(title);
  const brandSuffixText = cleanBrandSuffix(brandSuffix);
  const routes = navRoutes(columns);
  const navStyle = {
    '--nav-scroll-opacity': (1 - navFade).toFixed(3),
    '--nav-scroll-y': `${Math.round(navFade * -34)}px`,
    '--nav-scroll-blur': `${(navFade * 2.5).toFixed(2)}px`
  } as CSSProperties;

  useEffect(() => {
    let previousY = window.scrollY;
    let frame = 0;

    const handleScroll = () => {
      if (frame) {
        return;
      }

      frame = window.requestAnimationFrame(() => {
        const currentY = window.scrollY;
        const delta = currentY - previousY;
        const nextFade = menuOpen || currentY < 24 ? 0 : Math.min(1, Math.max(0, fadeRef.current + delta / 150));

        fadeRef.current = nextFade;
        setNavFade(nextFade);
        setHidden(nextFade > 0.96 && !menuOpen);
        previousY = Math.max(0, currentY);
        frame = 0;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);

      if (frame) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    fadeRef.current = 0;
    setNavFade(0);
    setHidden(false);
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
      <nav className={`top-nav site-nav${hidden ? ' is-hidden' : ''}${menuOpen ? ' is-orbit-open' : ''}`} style={navStyle} aria-label="主导航">
        <Link className="brand" href="/" aria-label={`${brandTitle}${brandSuffixText} 首页`}>
          <span data-brand-suffix={brandSuffixText}>{brandTitle}</span>
          <small>Personal Blog</small>
        </Link>

        <div className="nav-links">
          {routes.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link className={active ? 'active' : ''} aria-current={active ? 'page' : undefined} key={item.href} href={item.href}>
                {item.label}
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
          {routes.map((item, index) => {
            const active = isActive(pathname, item.href);
            const angle = index * (360 / routes.length) - 90;
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
                <span>{item.label}</span>
                <small>{item.tone}</small>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
