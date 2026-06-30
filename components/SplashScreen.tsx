'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import type { BlogSite } from '@/lib/blog';

type SplashScreenProps = {
  site: BlogSite;
};

const SESSION_KEY = 'personal-theme-blog:splash-seen';

export function SplashScreen({ site }: SplashScreenProps) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const loadingLines = useMemo(() => [
    'LOADING BACKGROUND LAYERS',
    'SYNCING DAY / NIGHT SCENE',
    'OPENING PERSONAL PORTAL'
  ], []);

  useEffect(() => {
    setMounted(true);

    const hasSeen = window.sessionStorage.getItem(SESSION_KEY) === 'true';
    if (hasSeen) {
      document.documentElement.classList.add('xh-splash-seen');
      return undefined;
    }

    setVisible(true);
    const timer = window.setTimeout(() => {
      setLeaving(true);
      window.sessionStorage.setItem(SESSION_KEY, 'true');
      window.setTimeout(() => {
        document.documentElement.classList.add('xh-splash-seen');
        setVisible(false);
      }, 760);
    }, 2100);

    return () => window.clearTimeout(timer);
  }, []);

  const exitSplash = () => {
    setLeaving(true);
    window.sessionStorage.setItem(SESSION_KEY, 'true');
    window.setTimeout(() => {
      document.documentElement.classList.add('xh-splash-seen');
      setVisible(false);
    }, 520);
  };

  if (!mounted || !visible) {
    return null;
  }

  return (
    <div className={`ib-entry-splash${leaving ? ' is-leaving' : ''}`} role="status" aria-live="polite" aria-label="站点正在载入">
      <div className="ib-entry-mist" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="ib-entry-window" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>
      <button className="ib-entry-panel" type="button" onClick={exitSplash} aria-label="跳过进入动画">
        <span className="ib-entry-avatar">
          <Image src={site.avatar} alt="" width={112} height={112} priority />
        </span>
        <span className="ib-entry-copy">
          <small>{site.title}</small>
          <strong>{site.owner || site.title}</strong>
          <em>{site.motto}</em>
        </span>
        <span className="ib-entry-progress" aria-hidden="true">
          <i />
        </span>
        <span className="ib-entry-lines" aria-hidden="true">
          {loadingLines.map((line) => <b key={line}>{line}</b>)}
        </span>
      </button>
    </div>
  );
}
