'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import type { BlogSite } from '@/lib/blog';

type SplashScreenProps = {
  site: BlogSite;
};

type EntryMode = 'internal' | 'infernal';

const SESSION_KEY = 'personal-theme-blog:splash-seen';

const entryHotspots = [
  { id: 'archive', label: 'Archive', hint: 'articles / years', x: 19, y: 58, target: 'ARCHIVE' },
  { id: 'music', label: 'Radio', hint: 'cloud playlist', x: 80, y: 59, target: 'MUSIC' },
  { id: 'friends', label: 'Friends', hint: 'linked worlds', x: 66, y: 31, target: 'FRIENDS' },
  { id: 'desk', label: 'Desk', hint: 'notes / projects', x: 38, y: 73, target: 'DESK' },
  { id: 'theme', label: 'Mode', hint: 'swap atmosphere', x: 52, y: 24, target: 'MODE' }
] as const;

const roomObjects = [
  { id: 'bed', x: 14, y: 70, label: 'rest node' },
  { id: 'desk', x: 35, y: 76, label: 'desk console' },
  { id: 'crystal', x: 71, y: 28, label: 'light prism' },
  { id: 'shelf', x: 84, y: 70, label: 'music shelf' },
  { id: 'window', x: 51, y: 40, label: 'scene window' },
  { id: 'plant', x: 58, y: 83, label: 'floor bloom' }
] as const;

const bootLines = [
  'background crossfade ready',
  'mist field calibrated',
  'rain ambience online',
  'welcome route unlocked'
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

  const loadingLines = useMemo(() => [
    'Static shell prepared',
    'Internal / Beyond layer ready',
    'Choose a mode to begin'
  ], []);

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
      aria-label="Site entry"
    >
      <div className={`ib-entry-preloader${loaded ? ' fade-out' : ''}`} aria-hidden={loaded}>
        <strong>InternalBeyond</strong>
        <span>loading entry shell</span>
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
            <span aria-hidden="true">{hotspot.target}</span>
            <strong>{hotspot.label}</strong>
            <small>{hotspot.hint}</small>
          </button>
        ))}
        <aside className="ib-entry-dialogue" aria-label="Entry hint">
          <small>BOOT CHANNEL</small>
          <strong>Entry channel connected</strong>
          <span>Pick a marker in the scenery or use the welcome controls to open the blog.</span>
        </aside>
        <span className="ib-entry-character" aria-hidden="true">
          <Image src={site.avatar} alt="" width={92} height={92} priority />
        </span>
      </section>

      <section className={`ib-entry-welcome${mode === 'infernal' ? ' ib-on' : ''}`} aria-label="Welcome">
        <span className="ib-entry-rule" aria-hidden="true" />
        <p className="ib-entry-sign">
          Design by <span>{site.owner || site.title}</span>
          <i aria-hidden="true"> | </i>
          <em>Codex</em>
        </p>

        <div className={`ib-entry-swap${mode === 'infernal' ? ' ib-mode' : ''}`}>
          <div className="ib-entry-original">
            <p className="ib-entry-title">
              Welcome to <span>{site.title}</span>
            </p>
            <h1>Welcome</h1>
            <p className="ib-entry-desc">
              Step through mist and starlight. Articles, projects, music, photos, friends and daily fragments wake behind the glass.
            </p>
          </div>

          <div className="ib-entry-beyond">
            <p className="ib-entry-title">
              Internal <span>Beyond</span>
            </p>
            <h1>Internal Beyond</h1>
            <p className="ib-entry-desc">
              Background crossfade, rain, glass blur, mode switching and the delayed route reveal rise together.
            </p>
          </div>
        </div>

        <div className="ib-entry-actions">
          <button className="ib-entry-action-btn" type="button" onClick={enterBlog}>
            Enter Site
          </button>
          <button className="ib-entry-action-btn secondary" id="ib-mode-toggle" type="button" onClick={toggleMode}>
            {mode === 'internal' ? 'Switch Beyond' : 'Return Internal'}
          </button>
        </div>

        <button className="ib-entry-skip" type="button" onClick={enterBlog}>
          Skip Intro
        </button>

        <div className="ib-entry-status" aria-hidden="true">
          {loadingLines.map((line) => <b key={line}>{line}</b>)}
        </div>
      </section>

      <aside className="ib-entry-console" aria-hidden="true">
        <span>ENTRY LOG</span>
        {bootLines.map((line) => <b key={line}>{line}</b>)}
      </aside>
    </div>
  );
}
