'use client';

import { useEffect, useState } from 'react';

type ThemeMode = 'day' | 'night';
type ThemePhase = ThemeMode | 'dusk' | 'dawn';
type Season = 'spring' | 'summer' | 'autumn' | 'winter';

const seasonCopy: Record<Season, { label: string; day: string; night: string }> = {
  spring: { label: '\u6625\u65e5\u82b1\u5ead', day: '\u82b1\u96e8\u4e0e\u6674\u5149', night: '\u6708\u8272\u4e0e\u591c\u6a31' },
  summer: { label: '\u590f\u65e5\u6d77\u98ce', day: '\u9752\u7a7a\u4e0e\u5149\u6591', night: '\u796d\u706f\u4e0e\u8424\u5149' },
  autumn: { label: '\u79cb\u65e5\u7ea2\u53f6', day: '\u91d1\u98ce\u4e0e\u843d\u53f6', night: '\u8584\u96fe\u4e0e\u6696\u661f' },
  winter: { label: '\u51ac\u65e5\u96ea\u91ce', day: '\u971c\u5149\u4e0e\u96ea\u82b1', night: '\u6781\u5149\u4e0e\u96ea\u6676' }
};

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

function getSeason(): Season {
  if (typeof document === 'undefined') {
    return 'spring';
  }
  const season = document.documentElement.dataset.xhSeason;
  return season === 'summer' || season === 'autumn' || season === 'winter' ? season : 'spring';
}

export function ThemeSceneCard() {
  const [mode, setMode] = useState<ThemeMode>('day');
  const [nextMode, setNextMode] = useState<ThemeMode>('day');
  const [phase, setPhase] = useState<ThemePhase>('day');
  const [season, setSeason] = useState<Season>('spring');
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    setMode(getThemeMode());
    setNextMode(getNextThemeMode());
    setPhase(getThemePhase());
    setSeason(getSeason());
    setTransitioning(document.documentElement.dataset.xhThemeTransition === 'active');

    const observer = new MutationObserver(() => {
      setMode(getThemeMode());
      setNextMode(getNextThemeMode());
      setPhase(getThemePhase());
      setSeason(getSeason());
      setTransitioning(document.documentElement.dataset.xhThemeTransition === 'active');
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-xh-theme', 'data-xh-theme-next', 'data-xh-theme-transition', 'data-xh-theme-phase', 'data-xh-season']
    });

    return () => observer.disconnect();
  }, []);

  const seasonText = seasonCopy[season];
  const seasonSummary = mode === 'night' ? seasonText.night : seasonText.day;

  return (
    <button
      className={`xh-theme-scene-card is-${mode} is-phase-${phase} is-season-${season}${transitioning ? ' is-transitioning' : ''}`}
      type="button"
      aria-pressed={mode === 'night'}
      aria-label={mode === 'night' ? '\u5207\u6362\u5230\u65e5\u95f4\u6a21\u5f0f' : '\u5207\u6362\u5230\u591c\u95f4\u6a21\u5f0f'}
      data-next-mode={nextMode}
      data-theme-phase={phase}
      data-season={season}
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
      <small>{transitioning ? '\u573a\u666f\u6b63\u5728\u8fde\u7eed\u5207\u6362' : `${seasonText.label} / ${seasonSummary}`}</small>
    </button>
  );
}
