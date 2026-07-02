'use client';

import { useEffect, useState } from 'react';

type ThemeMode = 'day' | 'night';
type ThemePhase = ThemeMode | 'dusk' | 'dawn';

function getThemeMode(): ThemeMode {
  if (typeof document === 'undefined') {
    return 'day';
  }
  return document.documentElement.dataset.xhTheme === 'night' ? 'night' : 'day';
}

function getNextThemeMode(): ThemeMode {
  if (typeof document === 'undefined') {
    return 'day';
  }
  return document.documentElement.dataset.xhThemeNext === 'night' ? 'night' : 'day';
}

function getThemePhase(): ThemePhase {
  if (typeof document === 'undefined') {
    return 'day';
  }
  const phase = document.documentElement.dataset.xhThemePhase;
  return phase === 'dusk' || phase === 'dawn' || phase === 'night' ? phase : 'day';
}

export function ThemeSceneCard() {
  const [mode, setMode] = useState<ThemeMode>('day');
  const [nextMode, setNextMode] = useState<ThemeMode>('day');
  const [phase, setPhase] = useState<ThemePhase>('day');
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    setMode(getThemeMode());
    setNextMode(getNextThemeMode());
    setPhase(getThemePhase());
    setTransitioning(document.documentElement.dataset.xhThemeTransition === 'active');

    const observer = new MutationObserver(() => {
      setMode(getThemeMode());
      setNextMode(getNextThemeMode());
      setPhase(getThemePhase());
      setTransitioning(document.documentElement.dataset.xhThemeTransition === 'active');
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-xh-theme', 'data-xh-theme-next', 'data-xh-theme-transition', 'data-xh-theme-phase']
    });

    return () => observer.disconnect();
  }, []);

  return (
    <button
      className={`xh-theme-scene-card is-${mode} is-phase-${phase}${transitioning ? ' is-transitioning' : ''}`}
      type="button"
      aria-pressed={mode === 'night'}
      aria-label={mode === 'night' ? '\u5207\u6362\u5230\u65e5\u95f4\u6a21\u5f0f' : '\u5207\u6362\u5230\u591c\u95f4\u6a21\u5f0f'}
      data-next-mode={nextMode}
      data-theme-phase={phase}
      data-transitioning={transitioning ? 'true' : 'false'}
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
      <strong>{mode === 'night' ? '\u591c\u95f4\u6a21\u5f0f' : '\u65e5\u95f4\u6a21\u5f0f'}</strong>
      <small>{transitioning ? '\u573a\u666f\u6b63\u5728\u8fde\u7eed\u5207\u6362' : mode === 'night' ? '\u6708\u5149\u4e0e\u96e8\u5e55\u4fdd\u6301\u67d4\u548c' : '\u65e5\u5149\u4e0e\u4e91\u5c42\u4fdd\u6301\u6e05\u723d'}</small>
    </button>
  );
}
