'use client';

import Image from 'next/image';
import { useEffect, useState, type CSSProperties } from 'react';
import type { BlogSite } from '@/lib/blog';

type SplashScreenProps = {
  site: BlogSite;
};

type EntryMode = 'internal' | 'infernal';

const SESSION_KEY = 'personal-theme-blog:splash-seen';

const entryHotspots = [
  { id: 'archive', x: 19, y: 58 },
  { id: 'music', x: 80, y: 59 },
  { id: 'friends', x: 66, y: 31 },
  { id: 'desk', x: 38, y: 73 },
  { id: 'theme', x: 52, y: 24 }
] as const;

const roomObjects = [
  { id: 'bed', x: 14, y: 70, label: 'rest node' },
  { id: 'desk', x: 35, y: 76, label: 'desk console' },
  { id: 'crystal', x: 71, y: 28, label: 'light prism' },
  { id: 'shelf', x: 84, y: 70, label: 'music shelf' },
  { id: 'window', x: 51, y: 40, label: 'scene window' },
  { id: 'plant', x: 58, y: 83, label: 'floor bloom' }
] as const;

const dustMotes = Array.from({ length: 26 }, (_item, index) => ({
  id: `entry-mote-${index}`,
  x: (index * 37 + 11) % 100,
  y: (index * 23 + 17) % 86,
  delay: `${(index % 9) * -0.42}s`,
  size: `${2 + (index % 3)}px`
}));

const rainDrops = Array.from({ length: 28 }, (_item, index) => ({
  id: `entry-rain-${index}`,
  x: `${(index * 13 + 4) % 100}%`,
  delay: `${(index % 14) * -0.16}s`,
  duration: `${0.9 + (index % 6) * 0.07}s`,
  length: `${42 + (index % 5) * 12}px`
}));

export function SplashScreen({ site }: SplashScreenProps) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [mode, setMode] = useState<EntryMode>('internal');

  const entry = site.entry;
  const nextModeButton = mode === 'internal' ? entry.switchToBeyondButton : entry.switchToInternalButton;

  const entryStyle = {
    '--entry-hero-image': `url("${site.heroImage}")`
  } as CSSProperties;

  useEffect(() => {
    setMounted(true);

    const hasSeen = window.sessionStorage.getItem(SESSION_KEY) === 'true';
    if (hasSeen) {
      document.documentElement.classList.add('xh-splash-seen');
      return undefined;
    }

    setVisible(true);
    const loadingTimer = window.setTimeout(() => setLoaded(true), 1050);
    return () => window.clearTimeout(loadingTimer);
  }, []);

  useEffect(() => {
    if (!visible) {
      return;
    }

    document.documentElement.setAttribute('data-ib-entry-mode', mode);
    return undefined;
  }, [mode, visible]);

  const enterBlog = () => {
    if (leaving) {
      return;
    }

    setLeaving(true);
    window.sessionStorage.setItem(SESSION_KEY, 'true');
    window.setTimeout(() => {
      document.documentElement.classList.add('xh-splash-seen');
      setVisible(false);
    }, 720);
  };

  const toggleMode = () => {
    setMode((currentMode) => currentMode === 'internal' ? 'infernal' : 'internal');
  };

  if (!mounted || !visible) {
    return null;
  }

  return (
    <div
      className={`ib-entry-splash is-${mode}${loaded ? ' is-loaded' : ' is-loading'}${leaving ? ' is-leaving' : ''}`}
      style={entryStyle}
      role="dialog"
      aria-modal="true"
      aria-label={entry.ariaLabel}
    >
      <div className={`ib-entry-preloader${loaded ? ' fade-out' : ''}`} aria-hidden={loaded}>
        <strong>{entry.preloaderTitle}</strong>
        <span>{entry.preloaderSubtitle}</span>
      </div>

      <div className="ib-entry-bg ib-entry-bg-internal" aria-hidden="true" />
      <div className="ib-entry-bg ib-entry-bg-infernal" aria-hidden="true" />
      <div className="ib-entry-overlay" aria-hidden="true" />

      <div className="ib-entry-mist" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="ib-entry-glow" aria-hidden="true" />

      <section className="ib-entry-stage" aria-label="Interactive entry scenery">
        <div className="ib-entry-scanlines" aria-hidden="true" />
        <div className="ib-entry-rain" aria-hidden="true">
          {rainDrops.map((drop) => (
            <i
              key={drop.id}
              style={{
                '--rain-left': drop.x,
                '--rain-delay': drop.delay,
                '--rain-duration': drop.duration,
                '--rain-height': drop.length
              } as CSSProperties}
            />
          ))}
        </div>
        <div className="ib-entry-dust" aria-hidden="true">
          {dustMotes.map((mote) => (
            <i
              key={mote.id}
              style={{
                left: `${mote.x}%`,
                top: `${mote.y}%`,
                width: mote.size,
                height: mote.size,
                animationDelay: mote.delay
              }}
            />
          ))}
        </div>
        <div className="ib-entry-day-layer" aria-hidden="true">
          <span className="ib-entry-sun" />
        </div>
        <div className="ib-entry-night-layer" aria-hidden="true">
          <span className="ib-entry-moon" />
          <span className="ib-entry-stars" />
        </div>
        <div className="ib-entry-window" aria-hidden="true">
          {Array.from({ length: 8 }, (_item, index) => <span key={index} />)}
        </div>
        <div className="ib-entry-room-backdrop" aria-hidden="true">
          <span className="is-left-shelf" />
          <span className="is-center-window" />
          <span className="is-right-terminal" />
          <span className="is-floor-reflection" />
        </div>
        <div className="ib-entry-room-light" aria-hidden="true" />
        <div className="ib-entry-orbit" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="ib-entry-room-floor" aria-hidden="true" />
        {roomObjects.map((object) => (
          <span
            className={`ib-entry-object is-${object.id}`}
            style={{ '--object-x': `${object.x}%`, '--object-y': `${object.y}%` } as CSSProperties}
            aria-hidden="true"
            key={object.id}
          >
            {object.label}
          </span>
        ))}
        {entryHotspots.map((hotspot) => (
          <button
            className={`ib-entry-hotspot is-${hotspot.id}`}
            type="button"
            style={{ '--entry-x': `${hotspot.x}%`, '--entry-y': `${hotspot.y}%` } as CSSProperties}
            onClick={hotspot.id === 'theme' ? toggleMode : enterBlog}
            key={hotspot.id}
          >
            <span aria-hidden="true">{entry.hotspots[hotspot.id].target}</span>
            <strong>{entry.hotspots[hotspot.id].label}</strong>
            <small>{entry.hotspots[hotspot.id].hint}</small>
          </button>
        ))}
        <aside className="ib-entry-dialogue" aria-label="Entry hint">
          <small>{entry.dialogue.eyebrow}</small>
          <strong>{entry.dialogue.title}</strong>
          <span>{entry.dialogue.description}</span>
        </aside>
        <span className="ib-entry-character" aria-hidden="true">
          <Image src={site.avatar} alt="" width={92} height={92} priority />
        </span>
      </section>

      <section className={`ib-entry-welcome${mode === 'infernal' ? ' ib-on' : ''}`} aria-label="Welcome">
        <span className="ib-entry-rule" aria-hidden="true" />
        <p className="ib-entry-sign">
          {entry.signaturePrefix} <span>{entry.signatureName || site.owner || site.title}</span>
          <i aria-hidden="true"> | </i>
          <em>{entry.signatureSuffix}</em>
        </p>

        <div className={`ib-entry-swap${mode === 'infernal' ? ' ib-mode' : ''}`}>
          <div className="ib-entry-original">
            <p className="ib-entry-title">
              {entry.original.eyebrow} <span>{entry.original.eyebrowHighlight}</span>
            </p>
            <h1>{entry.original.title}</h1>
            <p className="ib-entry-desc">
              {entry.original.description}
            </p>
          </div>

          <div className="ib-entry-beyond">
            <p className="ib-entry-title">
              {entry.beyond.eyebrow} <span>{entry.beyond.eyebrowHighlight}</span>
            </p>
            <h1>{entry.beyond.title}</h1>
            <p className="ib-entry-desc">
              {entry.beyond.description}
            </p>
          </div>
        </div>

        <div className="ib-entry-actions">
          <button className="ib-entry-action-btn" type="button" onClick={enterBlog}>
            {entry.enterButton}
          </button>
          <button className="ib-entry-action-btn secondary" id="ib-mode-toggle" type="button" onClick={toggleMode}>
            {nextModeButton}
          </button>
        </div>

        <button className="ib-entry-skip" type="button" onClick={enterBlog}>
          {entry.skipButton}
        </button>

        <div className="ib-entry-status" aria-hidden="true">
          {entry.statusLines.map((line) => <b key={line}>{line}</b>)}
        </div>
      </section>

      <aside className="ib-entry-console" aria-hidden="true">
        <span>{entry.consoleTitle}</span>
        {entry.bootLines.map((line) => <b key={line}>{line}</b>)}
      </aside>
    </div>
  );
}
