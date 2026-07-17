'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { usePathname } from 'next/navigation';
import type { BlogSite } from '@/lib/blog';
import { startGlassCanvas, startRainCanvas, startRainRipple } from './splashEffects';

type SplashScreenProps = {
  site: BlogSite;
};

type StartPhase = 'loading' | 'ready' | 'leaving';

const SESSION_KEY = 'personal-theme-blog:splash-seen';
const SPLASH_COMPLETE_EVENT = 'personal-theme-blog:splash-complete';
const MIN_SPLASH_READY_MS = 1050;
const HERO_READY_TIMEOUT_MS = 5000;

const splashLayoutArchitecture = {
  shell: {
    preloader: true,
    splash: ['signature', 'welcome-copy', 'water-surface', 'glass-tools', 'enter-blog', 'dissolve'],
    backgrounds: ['internal-background'],
    ambience: ['rain-canvas', 'water-ripple', 'glass-fog']
  },
  sourceAnchors: ['rain-container', 'gw-slot', 'gw-pane', 'gw-ripple', 'gw-fogwipe', 'gw-draw'],
  entryOnly: true
} as const;

const waterRipples = Array.from({ length: 16 }, (_item, index) => ({
  id: `splash-water-ripple-${index}`,
  x: `${(index * 19 + 9) % 100}%`,
  y: `${50 + ((index * 17 + 7) % 44)}%`,
  scale: (0.72 + (index % 5) * 0.16).toFixed(2),
  delay: `${index * -0.32}s`
}));

const glassScratches = Array.from({ length: 18 }, (_item, index) => ({
  id: `splash-glass-scratch-${index}`,
  x: `${(index * 23 + 5) % 100}%`,
  y: `${(index * 29 + 11) % 92}%`,
  length: `${18 + (index % 6) * 9}px`,
  opacity: (0.12 + (index % 5) * 0.055).toFixed(3),
  tilt: `${-32 + (index % 7) * 11}deg`,
  delay: `${index * -0.24}s`
}));

export function SplashScreen({ site }: SplashScreenProps) {
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const rainRef = useRef<HTMLDivElement | null>(null);
  const waterSlotRef = useRef<HTMLDivElement | null>(null);
  const waterPaneRef = useRef<HTMLDivElement | null>(null);
  const waterCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const rippleBgRef = useRef<HTMLCanvasElement | null>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fogCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [phase, setPhase] = useState<StartPhase>('loading');

  const entry = site.entry;
  const entryOriginal = entry.original;
  const entryBeyond = entry.beyond;
  // The entry experience belongs to the homepage; direct subpage visits must stay interactive.
  const shouldSkipSplash = pathname.startsWith('/admin') || pathname !== '/';
  const entryStyle = {
    '--game-hero-image': `url("${site.heroImage}")`
  } as CSSProperties;

  useEffect(() => {
    setMounted(true);

    if (shouldSkipSplash) {
      document.documentElement.classList.add('xh-splash-seen');
      window.dispatchEvent(new Event(SPLASH_COMPLETE_EVENT));
      return undefined;
    }

    const hasSeen = window.sessionStorage.getItem(SESSION_KEY) === 'true';
    if (hasSeen) {
      document.documentElement.classList.add('xh-splash-seen');
      window.dispatchEvent(new Event(SPLASH_COMPLETE_EVENT));
      return undefined;
    }

    setVisible(true);
    setPhase('loading');
    const startedAt = window.performance.now();
    let settled = false;
    let readyTimer: number | null = null;

    const reveal = () => {
      if (settled) {
        return;
      }

      settled = true;
      const elapsed = window.performance.now() - startedAt;
      readyTimer = window.setTimeout(() => setPhase('ready'), Math.max(0, MIN_SPLASH_READY_MS - elapsed));
    };

    const hero = new window.Image();
    hero.decoding = 'async';
    const waitForDecode = () => {
      if (!hero.decode) {
        reveal();
        return;
      }

      try {
        void hero.decode().catch(() => undefined).then(reveal);
      } catch {
        reveal();
      }
    };

    hero.onload = waitForDecode;
    hero.onerror = reveal;
    hero.src = site.heroImage;
    if (hero.complete) {
      if (hero.naturalWidth > 0) {
        waitForDecode();
      } else {
        reveal();
      }
    }

    const timeout = window.setTimeout(reveal, HERO_READY_TIMEOUT_MS);

    return () => {
      settled = true;
      window.clearTimeout(timeout);
      if (readyTimer !== null) {
        window.clearTimeout(readyTimer);
      }
      hero.onload = null;
      hero.onerror = null;
    };
  }, [shouldSkipSplash, site.heroImage]);

  useEffect(() => {
    if (!visible) {
      return undefined;
    }

    const cleanups = [
      startRainCanvas(rainRef),
      startGlassCanvas({
        slot: waterSlotRef,
        pane: waterPaneRef,
        draw: drawCanvasRef,
        fog: fogCanvasRef
      }),
      startRainRipple({
        root: rootRef,
        slot: waterSlotRef,
        pane: waterPaneRef,
        ripple: waterCanvasRef,
        rippleBg: rippleBgRef,
        draw: drawCanvasRef
      }, site.heroImage)
    ];

    return () => {
      for (const cleanup of cleanups) {
        cleanup?.();
      }
    };
  }, [site.heroImage, visible]);

  const enterBlog = () => {
    if (phase === 'leaving') {
      return;
    }

    setPhase('leaving');
    window.setTimeout(() => {
      window.sessionStorage.setItem(SESSION_KEY, 'true');
      document.documentElement.classList.add('xh-splash-seen');
      setVisible(false);
      window.dispatchEvent(new Event(SPLASH_COMPLETE_EVENT));
    }, 820);
  };

  if (shouldSkipSplash || !mounted || !visible) {
    return null;
  }

  return (
    <div
      ref={rootRef}
      className={`ib-game-start is-${phase}${phase === 'leaving' ? ' is-dissolving' : ''}`}
      style={entryStyle}
      role="dialog"
      aria-modal="true"
      aria-label={entry.ariaLabel}
      data-entry-only={splashLayoutArchitecture.entryOnly}
    >
      <div className={`ib-game-preloader${phase !== 'loading' ? ' fade-out' : ''}`} aria-hidden={phase !== 'loading'}>
        <strong>{entry.preloaderTitle}</strong>
        <span>{entry.preloaderSubtitle}</span>
      </div>

      <div className="ib-game-bg ib-game-bg-internal" aria-hidden="true" />
      <div className="ib-game-overlay" aria-hidden="true" />
      <div ref={rainRef} id="rain-container" className="ib-game-rain-canvas" aria-hidden="true" />

      <div ref={waterSlotRef} id="gw-slot" className="ib-game-welcome-window" aria-hidden="true">
        <div ref={waterPaneRef} id="gw-pane" className="ib-game-art-pane">
          <div className="ib-game-art-image gw-ly" />
          <canvas ref={rippleBgRef} id="gw-ripple-bg" className="ib-game-ripple-bg" />
          <canvas ref={waterCanvasRef} id="gw-ripple" className="ib-game-water-canvas" />
          <div className="gw-grade-c gw-ly" />
          <div className="gw-grade-s gw-ly" />
          <div className="ib-game-water-surface">
            {waterRipples.map((ripple) => (
              <span
                key={ripple.id}
                style={{
                  '--water-x': ripple.x,
                  '--water-y': ripple.y,
                  '--water-scale': ripple.scale,
                  '--water-delay': ripple.delay
                } as CSSProperties}
              />
            ))}
          </div>
          <div className="ib-game-glass-scratches gw-scratch">
            {glassScratches.map((scratch) => (
              <span
                key={scratch.id}
                style={{
                  '--scratch-x': scratch.x,
                  '--scratch-y': scratch.y,
                  '--scratch-length': scratch.length,
                  '--scratch-opacity': scratch.opacity,
                  '--scratch-tilt': scratch.tilt,
                  '--scratch-delay': scratch.delay
                } as CSSProperties}
              />
            ))}
          </div>
          <div className="ib-game-mist-canvas" />
          <canvas ref={fogCanvasRef} id="gw-fogwipe" className="ib-game-fog-wipe" />
          <div className="ib-game-frost gw-frost" />
          <div className="ib-game-depth" />
          <canvas ref={drawCanvasRef} id="gw-draw" className="ib-game-draw" />
        </div>
      </div>

      <div className="gw-ctrl" aria-label="Glass surface controls">
        <button id="gw-tool-finger" className="gw-cbtn active" type="button" aria-label="Use wipe tool" aria-pressed="true">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M8 11V5a2 2 0 0 1 4 0v5" />
            <path d="M12 10V4a2 2 0 0 1 4 0v8" />
            <path d="M16 11V7a2 2 0 0 1 4 0v7c0 4-3 7-7 7h-1c-3 0-5-2-6-5l-1-4a2 2 0 0 1 4-1l1 3" />
          </svg>
        </button>
        <button id="gw-tool-pen" className="gw-cbtn" type="button" aria-label="Use pen tool" aria-pressed="false">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m15 5 4 4" />
            <path d="M13 7 4 16l-1 5 5-1 9-9" />
            <path d="M14 6 18 2l4 4-4 4" />
          </svg>
        </button>
        <button id="gw-clear" className="gw-cbtn" type="button" aria-label="Clear glass drawing">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 6h18" />
            <path d="M8 6V4h8v2" />
            <path d="m9 11 6 6" />
            <path d="m15 11-6 6" />
            <path d="M6 6l1 15h10l1-15" />
          </svg>
        </button>
      </div>

      <div className="gw-therms" aria-label="Glass surface tuning">
        <div id="gw-therm-fog" className="gw-therm" role="slider" aria-label="Fog density" aria-valuemin={0} aria-valuemax={100} aria-valuenow={50}>
          <span className="gw-therm-label">FOG</span>
          <span className="gw-therm-body">
            <span className="gw-therm-tube">
              <span className="gw-therm-fill" />
            </span>
            <span className="gw-therm-bulb" />
          </span>
          <span className="gw-therm-val" />
        </div>
        <div id="gw-therm-brush" className="gw-therm" role="slider" aria-label="Brush size" aria-valuemin={0} aria-valuemax={100} aria-valuenow={50}>
          <span className="gw-therm-label">BRUSH</span>
          <span className="gw-therm-body">
            <span className="gw-therm-tube">
              <span className="gw-therm-fill" />
            </span>
            <span className="gw-therm-bulb" />
          </span>
          <span className="gw-therm-val" />
        </div>
      </div>

      <div className="ib-game-flow-veil" aria-hidden="true" />

      <section className="ib-game-copy" aria-label="Game start copy">
        <span className="ib-game-copy-rule" aria-hidden="true" />
        <p className="ib-game-sign">
          {entry.signaturePrefix} <span>{entry.signatureName || site.owner || site.title}</span>
          <i aria-hidden="true"> | </i>
          <em>{entry.signatureSuffix}</em>
          <button id="gw-toggle" className="gw-toggle" type="button" aria-label="Toggle glass surface" aria-pressed="true">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 12c2.2-4 5.1-6 8-6s5.8 2 8 6c-2.2 4-5.1 6-8 6s-5.8-2-8-6Z" />
              <path d="M12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z" />
            </svg>
          </button>
        </p>

        <p className="ib-game-title">
          {entryOriginal.eyebrow} <span>{entryOriginal.eyebrowHighlight || site.title}</span>
        </p>
        <h1 className="ib-game-wordmark" aria-label={`${entryOriginal.title} ${entryBeyond.title}`}>
          <small>{entryBeyond.eyebrow}</small>
          <span>{entryOriginal.title}</span>
          <span>{entryBeyond.eyebrowHighlight || entryBeyond.title}</span>
        </h1>
        <p className="ib-game-desc">{entryOriginal.description}</p>
        <p className="ib-game-note">{entryBeyond.description}</p>

        <button className="ib-game-action-btn" type="button" onClick={enterBlog} disabled={phase !== 'ready'}>
          {entry.enterButton}
        </button>
      </section>
    </div>
  );
}
