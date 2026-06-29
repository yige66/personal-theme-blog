'use client';

import { useEffect, useState } from 'react';

type ThemeMode = 'day' | 'night';

function getThemeMode(): ThemeMode {
  if (typeof document === 'undefined') {
    return 'day';
  }
  return document.documentElement.dataset.xhTheme === 'night' ? 'night' : 'day';
}

export function ThemeSceneCard() {
  const [mode, setMode] = useState<ThemeMode>('day');
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    setMode(getThemeMode());
    setTransitioning(document.documentElement.dataset.xhThemeTransition === 'active');

    const observer = new MutationObserver(() => {
      setMode(getThemeMode());
      setTransitioning(document.documentElement.dataset.xhThemeTransition === 'active');
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-xh-theme', 'data-xh-theme-transition']
    });

    return () => observer.disconnect();
  }, []);

  return (
    <button
      className={`xh-theme-scene-card is-${mode}${transitioning ? ' is-transitioning' : ''}`}
      type="button"
      aria-pressed={mode === 'night'}
      onClick={() => window.dispatchEvent(new Event('xh-toggle-theme'))}
    >
      <span className="xh-theme-orb" aria-hidden="true">
        <span className="xh-theme-orb-scene is-day">
          <i />
          <b />
        </span>
        <span className="xh-theme-orb-scene is-night">
          <i />
          <b />
        </span>
        <em />
      </span>
      <span className="eyebrow">Theme</span>
      <strong>{mode === 'night' ? '夜间模式' : '日间模式'}</strong>
      <small>{transitioning ? '场景正在切换' : mode === 'night' ? '雨幕、月光、低亮阅读' : '晴空、柔光、清爽阅读'}</small>
    </button>
  );
}
