'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { CSSProperties, MouseEvent } from 'react';
import type { BlogNote, BlogPost, BlogSite, MusicTrack } from '@/lib/blog';
import { useMusic } from '@/components/music/MusicProvider';
import { PixelKurisuPet } from '@/components/PixelKurisuPet';

type HomeEffectsProps = {
  site: BlogSite;
  posts: BlogPost[];
  notes: BlogNote[];
  activeTrack?: MusicTrack;
};

type Ripple = {
  x: number;
  y: number;
  radius: number;
  opacity: number;
  speed: number;
};

const dailyDanmaku = [
  '\u4eca\u5929\u4e5f\u6709\u8ba4\u771f\u66f4\u65b0',
  'BGM \u6b63\u5728\u5faa\u73af\u4e2d',
  '\u628a\u65e5\u5e38\u6536\u8fdb\u5f52\u6863',
  '\u7167\u7247\u5899\u9002\u5408\u6162\u6162\u901b',
  '\u8bc4\u8bba\u533a\u53ef\u4ee5\u7559\u4e0b\u811a\u5370',
  '\u591c\u95f4\u6a21\u5f0f\u9002\u5408\u53d1\u5446',
  '\u53cb\u94fe\u91cc\u4f4f\u7740\u6709\u8da3\u7075\u9b42',
  '\u9879\u76ee\u9875\u8bb0\u5f55\u957f\u671f\u5b9e\u9a8c',
  '\u7075\u611f\u521a\u521a\u5192\u6ce1',
  '\u5199\u5b8c\u8fd9\u6bb5\u5c31\u53bb\u542c\u6b4c'
];

const xhThemeAttribute = 'data-xh-theme';
const xhThemeNextAttribute = 'data-xh-theme-next';
const xhThemeTransitionAttribute = 'data-xh-theme-transition';
const xhThemePhaseAttribute = 'data-xh-theme-phase';
const xhSeasonAttribute = 'data-xh-season';
const xhSeasonNextAttribute = 'data-xh-season-next';
const xhSeasonPreviousAttribute = 'data-xh-season-previous';
const xhSeasonTransitionAttribute = 'data-xh-season-transition';
const seasonRotationIntervalMs = 120000;
const seasonTransitionDurationMs = 4200;

type ThemeMode = 'day' | 'night';
type ThemeTransition = 'active' | 'idle';
type ThemePhase = 'day' | 'night' | 'dusk' | 'dawn';
type Season = 'spring' | 'summer' | 'autumn' | 'winter';

const seasonOrder: Season[] = ['spring', 'summer', 'autumn', 'winter'];
const seasonCopy: Record<Season, { label: string; day: string; night: string }> = {
  spring: { label: '\u6625\u65e5\u82b1\u5ead', day: '\u82b1\u96e8\u4e0e\u6674\u5149', night: '\u6708\u8272\u4e0e\u591c\u6a31' },
  summer: { label: '\u590f\u65e5\u6d77\u98ce', day: '\u9752\u7a7a\u4e0e\u5149\u6591', night: '\u796d\u706f\u4e0e\u8424\u5149' },
  autumn: { label: '\u79cb\u65e5\u7ea2\u53f6', day: '\u91d1\u98ce\u4e0e\u843d\u53f6', night: '\u8584\u96fe\u4e0e\u6696\u661f' },
  winter: { label: '\u51ac\u65e5\u96ea\u91ce', day: '\u971c\u5149\u4e0e\u96ea\u82b1', night: '\u6781\u5149\u4e0e\u96ea\u6676' }
};

function uniqueMessages(values: string[]): string[] {
  const seen = new Set<string>();
  return values
    .map((item) => item.trim())
    .filter((item) => {
      if (!item || seen.has(item)) {
        return false;
      }
      seen.add(item);
      return true;
    })
    .slice(0, 18);
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function getThemePhase(currentMode: ThemeMode, nextMode: ThemeMode, transition: ThemeTransition): ThemePhase {
  if (transition === 'idle') {
    return currentMode;
  }
  return nextMode === 'night' ? 'dusk' : 'dawn';
}

function isSeason(value: string | null): value is Season {
  return value === 'spring' || value === 'summer' || value === 'autumn' || value === 'winter';
}

function getSeasonForDate(date = new Date()): Season {
  const month = date.getMonth();
  if (month >= 2 && month <= 4) {
    return 'spring';
  }
  if (month >= 5 && month <= 7) {
    return 'summer';
  }
  if (month >= 8 && month <= 10) {
    return 'autumn';
  }
  return 'winter';
}

function getNextSeason(current: Season): Season {
  return seasonOrder[(seasonOrder.indexOf(current) + 1) % seasonOrder.length];
}

function setSeasonAttributes(currentSeason: Season, nextSeason: Season, transition: ThemeTransition, previousSeason = currentSeason) {
  const root = document.documentElement;
  const attributes = [
    [xhSeasonAttribute, currentSeason],
    [xhSeasonNextAttribute, nextSeason],
    [xhSeasonPreviousAttribute, previousSeason],
    [xhSeasonTransitionAttribute, transition]
  ] as const;

  attributes.forEach(([name, value]) => {
    if (root.getAttribute(name) !== value) {
      root.setAttribute(name, value);
    }
  });
}

function setThemeAttributes(currentMode: ThemeMode, nextMode: ThemeMode, transition: ThemeTransition, phaseOverride?: ThemePhase) {
  const phase = phaseOverride ?? getThemePhase(currentMode, nextMode, transition);
  const root = document.documentElement;
  const attributes = [
    [xhThemeAttribute, currentMode],
    [xhThemeNextAttribute, nextMode],
    [xhThemeTransitionAttribute, transition],
    [xhThemePhaseAttribute, phase]
  ] as const;

  attributes.forEach(([name, value]) => {
    if (root.getAttribute(name) !== value) {
      root.setAttribute(name, value);
    }
  });
}

export function HomeEffects({ site, posts, notes, activeTrack }: HomeEffectsProps) {
  const pathname = usePathname();
  const {
    currentTrack,
    isLoading,
    isMuted,
    isPlaying,
    nextTrack,
    playlist,
    previousTrack,
    setVolume,
    toggleMute,
    togglePlaying,
    volume
  } = useMusic();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const transitionTimerRef = useRef<number | null>(null);
  const commitTimerRef = useRef<number | null>(null);
  const seasonTransitionTimerRef = useRef<number | null>(null);
  const isTransitioningRef = useRef(false);
  const isSeasonTransitioningRef = useRef(false);
  const hasSyncedThemeStateRef = useRef(false);
  const [nightMode, setNightMode] = useState(false);
  const [nextMode, setNextMode] = useState<ThemeMode>('day');
  const [themePhase, setThemePhase] = useState<ThemePhase>('day');
  const [season, setSeason] = useState<Season>('spring');
  const [nextSeason, setNextSeason] = useState<Season>('spring');
  const [previousSeason, setPreviousSeason] = useState<Season>('spring');
  const [isSeasonTransitioning, setIsSeasonTransitioning] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const effects = site.effects;
  const intensity = Math.max(20, Math.min(100, effects.intensity || 72));
  const isHome = pathname === '/';
  const isAdmin = pathname.startsWith('/admin');

  const messages = useMemo(() => {
    const configured = effects.danmaku && effects.danmaku.length > 0 ? effects.danmaku : dailyDanmaku;
    const postTitles = posts.slice(0, 3).map((post) => `\u6b63\u5728\u8bfb\uff1a${post.title}`);
    const noteLines = notes.slice(0, 2).map((note) => note.title || note.content);
    return uniqueMessages([...configured, ...dailyDanmaku, ...postTitles, ...noteLines, site.status]);
  }, [effects.danmaku, notes, posts, site.status]);

  const fireflies = useMemo(() => Array.from({ length: Math.round(intensity / 3) }, (_item, index) => {
    const driftX = ((index % 5) - 2) * 22;
    const driftY = -28 - (index % 7) * 8;
    const scale = 0.72 + (index % 4) * 0.16;

    return {
      id: `firefly-${index}`,
      left: `${(index * 17 + 9) % 100}%`,
      top: `${(index * 29 + 14) % 82}%`,
      delay: `${(index % 8) * 0.62}s`,
      glowDelay: `${(index % 8) * -0.34}s`,
      duration: `${7 + (index % 6)}s`,
      driftX: `${driftX}px`,
      driftY: `${driftY}px`,
      driftXStart: `${driftX * -0.45}px`,
      driftYStart: `${driftY * 0.42}px`,
      driftXMid: `${driftX * 0.72}px`,
      driftYMid: `${driftY * -0.18}px`,
      scale: `${scale}`,
      scaleBright: `${scale * 1.22}`,
      scaleDim: `${scale * 0.92}`,
      scaleEnd: `${scale * 1.28}`
    };
  }), [intensity]);

  const petals = useMemo(() => Array.from({ length: Math.round(intensity / 2.75) }, (_item, index) => {
    const drift = 36 + (index % 6) * 18;
    const rotate = (index % 2 === 0 ? 1 : -1) * (220 + (index % 5) * 34);
    const size = 18 + (index % 4) * 2;

    return {
      id: `petal-${index}`,
      left: `${(index * 23 + 4) % 100}%`,
      drift: `${drift}px`,
      driftStart: `${drift * -0.42}px`,
      driftMid: `${drift * 0.72}px`,
      delay: `${(index % 10) * 0.72}s`,
      duration: `${10 + (index % 7)}s`,
      rotate: `${rotate}deg`,
      rotateStart: `${rotate * 0.36}deg`,
      rotateMid: `${rotate * 0.72}deg`,
      size: `${size}px`,
      height: `${size * 0.72}px`
    };
  }), [intensity]);

  const sparkles = useMemo(() => Array.from({ length: 10 }, (_item, index) => ({
    id: `sparkle-${index}`,
    left: `${(index * 19 + 11) % 100}%`,
    top: `${(index * 31 + 8) % 88}%`,
    delay: `${(index % 6) * 0.54}s`
  })), []);

  const seasonalParticles = useMemo(() => Array.from({ length: Math.round(intensity / 2.6) }, (_item, index) => {
    const drift = 48 + (index % 8) * 16;
    const size = 9 + (index % 5) * 3;
    const rotate = (index % 2 === 0 ? 1 : -1) * (150 + (index % 7) * 24);

    return {
      id: `seasonal-${index}`,
      left: `${(index * 17 + 5) % 100}%`,
      top: `${(index * 23 + 9) % 92}%`,
      drift: `${drift}px`,
      driftMid: `${drift * -0.48}px`,
      delay: `${(index % 12) * -0.46}s`,
      duration: `${9 + (index % 8)}s`,
      rotate: `${rotate}deg`,
      size: `${size}px`
    };
  }), [intensity]);

  const rainDrops = useMemo(() => Array.from({ length: Math.round(intensity / 4) }, (_item, index) => ({
    id: `rain-${index}`,
    left: `${(index * 13 + 7) % 100}%`,
    delay: `${(index % 12) * -0.22}s`,
    duration: `${0.82 + (index % 7) * 0.08}s`,
    height: `${38 + (index % 6) * 8}px`
  })), [intensity]);

  useEffect(() => {
    const savedMode = window.localStorage.getItem('xh-theme-mode');
    const savedSeason = window.localStorage.getItem('xh-season-mode');
    const initialNight = savedMode ? savedMode === 'night' : new Date().getHours() >= 18 || new Date().getHours() < 6;
    const initialSeason = isSeason(savedSeason) ? savedSeason : getSeasonForDate();
    setNightMode(initialNight);
    setNextMode(initialNight ? 'night' : 'day');
    setSeason(initialSeason);
    setNextSeason(initialSeason);
    setPreviousSeason(initialSeason);
    setThemeAttributes(initialNight ? 'night' : 'day', initialNight ? 'night' : 'day', 'idle');
    setSeasonAttributes(initialSeason, initialSeason, 'idle');
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const rootMode: ThemeMode = root.getAttribute(xhThemeAttribute) === 'night' ? 'night' : 'day';
    const rootNextMode: ThemeMode = root.getAttribute(xhThemeNextAttribute) === 'night' ? 'night' : 'day';
    const rootPhaseValue = root.getAttribute(xhThemePhaseAttribute);
    const rootPhase: ThemePhase = rootPhaseValue === 'night' || rootPhaseValue === 'dusk' || rootPhaseValue === 'dawn' ? rootPhaseValue : 'day';
    const rootSeason = root.getAttribute(xhSeasonAttribute);
    const rootNextSeason = root.getAttribute(xhSeasonNextAttribute);
    const rootPreviousSeason = root.getAttribute(xhSeasonPreviousAttribute);
    const rootSeasonTransition = root.getAttribute(xhSeasonTransitionAttribute) === 'active';
    const syncedSeason = isSeason(rootSeason) ? rootSeason : getSeasonForDate();
    setNightMode(rootMode === 'night');
    setNextMode(rootNextMode);
    setThemePhase(rootPhase);
    setSeason(syncedSeason);
    setNextSeason(isSeason(rootNextSeason) ? rootNextSeason : syncedSeason);
    setPreviousSeason(isSeason(rootPreviousSeason) ? rootPreviousSeason : syncedSeason);
    setIsSeasonTransitioning(rootSeasonTransition);
    isSeasonTransitioningRef.current = rootSeasonTransition;
  }, []);

  useEffect(() => {
    if (!hasSyncedThemeStateRef.current) {
      hasSyncedThemeStateRef.current = true;
      return;
    }

    isTransitioningRef.current = isTransitioning;

    if (!isTransitioning) {
      const idleMode: ThemeMode = nightMode ? 'night' : 'day';
      setThemeAttributes(idleMode, idleMode, 'idle');
      setNextMode(idleMode);
      setThemePhase(idleMode);
      window.localStorage.setItem('xh-theme-mode', idleMode);
    }
  }, [isTransitioning, nightMode]);


  useEffect(() => () => {
    if (transitionTimerRef.current) {
      window.clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }
    if (commitTimerRef.current) {
      window.clearTimeout(commitTimerRef.current);
      commitTimerRef.current = null;
    }
    if (seasonTransitionTimerRef.current) {
      window.clearTimeout(seasonTransitionTimerRef.current);
      seasonTransitionTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!effects.enabled || prefersReducedMotion()) {
      return undefined;
    }

    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) {
      return undefined;
    }

    const ripples: Ripple[] = [];
    let animationId = 0;

    const resize = () => {
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.floor(window.innerWidth * ratio);
      canvas.height = Math.floor(window.innerHeight * ratio);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const handleClick = (event: PointerEvent) => {
      ripples.push({
        x: event.clientX,
        y: event.clientY,
        radius: 0,
        opacity: 0.56,
        speed: 2.8
      });

      if (ripples.length > 16) {
        ripples.splice(0, ripples.length - 16);
      }
    };

    const draw = () => {
      context.clearRect(0, 0, window.innerWidth, window.innerHeight);

      for (let index = ripples.length - 1; index >= 0; index -= 1) {
        const ripple = ripples[index];
        ripple.radius += ripple.speed;
        ripple.speed *= 0.982;
        ripple.opacity -= 0.012;

        if (ripple.opacity <= 0 || ripple.radius > 82) {
          ripples.splice(index, 1);
          continue;
        }

        const gradient = context.createRadialGradient(ripple.x, ripple.y, Math.max(1, ripple.radius * 0.2), ripple.x, ripple.y, ripple.radius);
        gradient.addColorStop(0, `rgba(255, 255, 255, ${ripple.opacity * 0.18})`);
        gradient.addColorStop(0.62, `rgba(255, 143, 199, ${ripple.opacity * 0.2})`);
        gradient.addColorStop(1, 'rgba(124, 217, 255, 0)');

        context.beginPath();
        context.fillStyle = gradient;
        context.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
        context.fill();

        context.beginPath();
        context.lineWidth = 1.6;
        context.strokeStyle = `rgba(255, 143, 199, ${ripple.opacity})`;
        context.arc(ripple.x, ripple.y, ripple.radius * 0.76, 0, Math.PI * 2);
        context.stroke();
      }

      animationId = window.requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener('resize', resize);
    window.addEventListener('pointerdown', handleClick, { passive: true });

    return () => {
      window.cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointerdown', handleClick);
    };
  }, [effects.enabled]);

  const startThemeTransition = useCallback(() => {
    if (isTransitioningRef.current) {
      return;
    }

    if (transitionTimerRef.current) {
      window.clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }
    if (commitTimerRef.current) {
      window.clearTimeout(commitTimerRef.current);
      commitTimerRef.current = null;
    }

    const currentMode: ThemeMode = nightMode ? 'night' : 'day';
    const targetMode: ThemeMode = nightMode ? 'day' : 'night';
    isTransitioningRef.current = true;
    setThemeAttributes(currentMode, targetMode, 'active', currentMode);
    setThemePhase(currentMode);
    const phaseCommitDelay = prefersReducedMotion() ? 0 : 80;
    commitTimerRef.current = window.setTimeout(() => {
      const activePhase = getThemePhase(currentMode, targetMode, 'active');
      setThemeAttributes(currentMode, targetMode, 'active', activePhase);
      setThemePhase(activePhase);
      commitTimerRef.current = null;
    }, phaseCommitDelay);
    setNextMode(targetMode);
    setIsTransitioning(true);

    const finishDelay = prefersReducedMotion() ? 160 : 3400;

    transitionTimerRef.current = window.setTimeout(() => {
      setThemeAttributes(targetMode, targetMode, 'idle');
      setThemePhase(targetMode);
      setNightMode(targetMode === 'night');
      setNextMode(targetMode);
      setIsTransitioning(false);
      isTransitioningRef.current = false;
      transitionTimerRef.current = null;
    }, finishDelay);
  }, [nightMode]);

  const toggleTheme = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    startThemeTransition();
  };

  const startSeasonTransition = useCallback((targetSeason?: Season) => {
    if (isSeasonTransitioningRef.current) {
      return;
    }

    if (seasonTransitionTimerRef.current) {
      window.clearTimeout(seasonTransitionTimerRef.current);
      seasonTransitionTimerRef.current = null;
    }

    const currentSeason = season;
    const target = targetSeason ?? getNextSeason(currentSeason);
    if (target === currentSeason) {
      return;
    }

    isSeasonTransitioningRef.current = true;
    setPreviousSeason(currentSeason);
    setNextSeason(target);
    setIsSeasonTransitioning(true);
    setSeasonAttributes(currentSeason, target, 'active', currentSeason);

    seasonTransitionTimerRef.current = window.setTimeout(() => {
      setSeason(target);
      setPreviousSeason(currentSeason);
      setNextSeason(target);
      setIsSeasonTransitioning(false);
      setSeasonAttributes(target, target, 'idle', currentSeason);
      window.localStorage.setItem('xh-season-mode', target);
      isSeasonTransitioningRef.current = false;
      seasonTransitionTimerRef.current = null;
    }, prefersReducedMotion() ? 240 : seasonTransitionDurationMs);
  }, [season]);

  const toggleSeason = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    startSeasonTransition();
  };

  useEffect(() => {
    if (isAdmin || !effects.enabled) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      startSeasonTransition();
    }, seasonRotationIntervalMs);

    return () => window.clearInterval(timer);
  }, [effects.enabled, isAdmin, startSeasonTransition]);

  useEffect(() => {
    const handleExternalToggle = () => startThemeTransition();
    const handleExternalSeasonCycle = () => startSeasonTransition();
    window.addEventListener('xh-toggle-theme', handleExternalToggle);
    window.addEventListener('xh-cycle-season', handleExternalSeasonCycle);
    return () => {
      window.removeEventListener('xh-toggle-theme', handleExternalToggle);
      window.removeEventListener('xh-cycle-season', handleExternalSeasonCycle);
    };
  }, [startSeasonTransition, startThemeTransition]);

  if (isAdmin || !effects.enabled) {
    return null;
  }

  const renderedMode: ThemeMode = nightMode ? 'night' : 'day';
  const renderedPhase = themePhase;
  const seasonText = seasonCopy[season];
  const nextSeasonText = seasonCopy[nextSeason];
  const seasonSummary = nightMode ? seasonText.night : seasonText.day;
  const floatingTrack = currentTrack ?? activeTrack;
  const hasMusicTracks = playlist.length > 0;
  const floatingVolume = isMuted ? 0 : volume;
  const floatingVolumePercent = Math.round(floatingVolume * 100);

  return (
    <>
      <div className="xh-aurora-field" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <div className="xh-prism-layer" aria-hidden="true">
        <span />
        <span />
      </div>

      <div className="xh-room-vignette" aria-hidden="true" />

      <div className={`xh-theme-transition${isTransitioning ? ' is-active' : ''}`} data-mode={nextMode} data-phase={renderedPhase} aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <div
        className={`xh-season-transition${isSeasonTransitioning ? ' is-active' : ''}`}
        data-season-from={previousSeason}
        data-season-to={nextSeason}
        aria-hidden="true"
      >
        <span />
        <span />
        <span />
        <span />
      </div>

      <div className="xh-seasonal-aura" data-season={season} aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <div className="xh-seasonal-layer" data-season={season} data-scene-theme={renderedMode} aria-hidden="true">
        {seasonalParticles.map((item) => (
          <i
            key={item.id}
            style={{
              left: item.left,
              top: item.top,
              '--season-delay': item.delay,
              '--season-duration': item.duration,
              '--season-drift': item.drift,
              '--season-drift-mid': item.driftMid,
              '--season-rotate': item.rotate,
              '--season-size': item.size
            } as CSSProperties}
          />
        ))}
      </div>

      <div className={`xh-space-rain${nightMode ? ' is-visible' : ''}`} aria-hidden="true">
        {rainDrops.map((item) => (
          <i
            key={item.id}
            style={{
              '--rain-left': item.left,
              '--rain-delay': item.delay,
              '--rain-duration': item.duration,
              '--rain-height': item.height
            } as CSSProperties}
          />
        ))}
      </div>

      {messages.length > 0 ? (
        <div className="xh-danmaku-layer" aria-label={'\u7ad9\u70b9\u5f39\u5e55'}>
          {messages.map((message, index) => (
            <span
              className="xh-danmaku-item"
              style={{
                '--lane': index % 6,
                '--delay': `${index * -1.35}s`,
                '--speed': `${22 + (index % 5) * 2}s`
              } as CSSProperties}
              key={`${message}-${index}`}
            >
              {message}
            </span>
          ))}
        </div>
      ) : null}

      <div className="xh-firefly-layer" aria-hidden="true">
        {fireflies.map((item) => (
          <i
            key={item.id}
            style={{
              left: item.left,
              top: item.top,
              '--firefly-delay': item.delay,
              '--firefly-glow-delay': item.glowDelay,
              '--firefly-duration': item.duration,
              '--firefly-drift-x': item.driftX,
              '--firefly-drift-y': item.driftY,
              '--firefly-drift-x-start': item.driftXStart,
              '--firefly-drift-y-start': item.driftYStart,
              '--firefly-drift-x-mid': item.driftXMid,
              '--firefly-drift-y-mid': item.driftYMid,
              '--firefly-scale': item.scale,
              '--firefly-scale-bright': item.scaleBright,
              '--firefly-scale-dim': item.scaleDim,
              '--firefly-scale-end': item.scaleEnd
            } as CSSProperties}
          />
        ))}
      </div>

      <div className="xh-petal-layer" aria-hidden="true">
        {petals.map((item) => (
          <i
            key={item.id}
            style={{
              left: item.left,
              '--petal-delay': item.delay,
              '--petal-duration': item.duration,
              '--petal-drift': item.drift,
              '--petal-drift-start': item.driftStart,
              '--petal-drift-mid': item.driftMid,
              '--petal-rotate': item.rotate,
              '--petal-rotate-start': item.rotateStart,
              '--petal-rotate-mid': item.rotateMid,
              '--petal-size': item.size,
              '--petal-height': item.height
            } as CSSProperties}
          />
        ))}
      </div>

      {effects.grass ? <div className="xh-grass-layer" data-season={season} aria-hidden="true" /> : null}

      <div className="xh-kirakira-layer" aria-hidden="true">
        {sparkles.map((item) => (
          <i key={item.id} style={{ left: item.left, top: item.top, animationDelay: item.delay }} />
        ))}
      </div>

      {!isHome ? (
        <>
          <button
            className={`xh-theme-switch is-${renderedMode} is-phase-${renderedPhase}${isTransitioning ? ' is-transitioning' : ''}`}
            type="button"
            aria-pressed={nightMode}
            aria-label={nightMode ? '\u5207\u6362\u5230\u65e5\u95f4\u6a21\u5f0f' : '\u5207\u6362\u5230\u591c\u95f4\u6a21\u5f0f'}
            aria-live="polite"
            data-next-mode={nextMode}
            data-theme-phase={renderedPhase}
            data-transitioning={isTransitioning ? 'true' : 'false'}
            onClick={toggleTheme}
          >
            <span className="xh-theme-switch-orbit" aria-hidden="true">
              <span className="xh-theme-switch-body is-sun">
                <i />
              </span>
              <span className="xh-theme-switch-body is-moon">
                <i />
              </span>
              <em />
            </span>
            <span className="xh-theme-switch-kicker">{nightMode ? 'Moonlit Scene' : 'Prism Day'}</span>
            <strong>{nightMode ? '\u591c\u8272\u573a\u666f' : '\u6668\u5149\u573a\u666f'}</strong>
            <small>{isTransitioning ? '\u8272\u5f69\u6e10\u53d8\u8fc7\u6e21\u4e2d' : nightMode ? '\u6df1\u84dd\u6e10\u53d8\u4e0e\u4f4e\u4eae\u5ea6\u8272\u5f69' : '\u6674\u7a7a\u6e10\u53d8\u4e0e\u67d4\u548c\u8272\u5f69'}</small>
          </button>

          <button
            className={`xh-season-switch is-${season}${isSeasonTransitioning ? ' is-transitioning' : ''}`}
            type="button"
            aria-label={`\u5207\u6362\u5230\u4e0b\u4e00\u4e2a\u5b63\u8282\uff0c\u5f53\u524d${seasonText.label}`}
            data-season={season}
            data-next-season={nextSeason}
            data-transitioning={isSeasonTransitioning ? 'true' : 'false'}
            onClick={toggleSeason}
          >
            <span className="xh-season-switch-orbit" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span className="xh-season-switch-kicker">Season Field</span>
            <strong>{isSeasonTransitioning ? nextSeasonText.label : seasonText.label}</strong>
            <small>{isSeasonTransitioning ? '\u5b63\u8282\u98ce\u573a\u6b63\u5728\u8fc7\u6e21' : seasonSummary}</small>
          </button>
        </>
      ) : null}

      {effects.floatingCompanion ? <PixelKurisuPet /> : null}

      {!isHome ? (
        <aside
          className="xh-floating-player"
          aria-label="悬浮音乐播放器"
          data-playing={isPlaying ? 'true' : 'false'}
          data-loading={isLoading ? 'true' : 'false'}
        >
          <Link className="xh-floating-player-open" href="/music" aria-label="打开音乐栏目" />
          <span>Cloud Music</span>
          <strong>{floatingTrack?.title || '\u6b4c\u5355\u5f85\u8865\u5145'}</strong>
          <small>{isLoading ? '音乐电台同步中' : floatingTrack ? `${floatingTrack.artist} / ${floatingTrack.mood || 'Focus Radio'}` : '\u6570\u636e\u6e90\u53ef\u7ef4\u62a4\u97f3\u4e50\u5c01\u9762\u4e0e\u97f3\u9891\u5730\u5740'}</small>
          <div className="xh-floating-player-controls" aria-label="音乐控制">
            <button type="button" aria-label="上一首" disabled={!hasMusicTracks} onClick={previousTrack}>
              <span aria-hidden="true">‹</span>
            </button>
            <button className="xh-floating-player-toggle" type="button" aria-label={isPlaying ? '暂停' : '播放'} disabled={!hasMusicTracks} onClick={togglePlaying}>
              <span aria-hidden="true">{isPlaying ? 'II' : '▶'}</span>
            </button>
            <button type="button" aria-label="下一首" disabled={!hasMusicTracks} onClick={nextTrack}>
              <span aria-hidden="true">›</span>
            </button>
          </div>
          <div className="xh-floating-player-volume" aria-label={`音量 ${floatingVolumePercent}%`}>
            <button type="button" aria-label={isMuted ? '取消静音' : '静音'} onClick={toggleMute}>
              <span aria-hidden="true">{floatingVolume === 0 ? '静' : '音'}</span>
            </button>
            <label>
              <span className="visually-hidden">音量</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={Number(floatingVolume.toFixed(2))}
                onChange={(event) => setVolume(Number(event.currentTarget.value))}
                aria-label="调整浮动播放器音量"
                style={{ '--floating-volume': `${floatingVolumePercent}%` } as CSSProperties}
              />
            </label>
          </div>
        </aside>
      ) : null}

      <canvas className="xh-click-canvas" ref={canvasRef} aria-hidden="true" />
    </>
  );
}
