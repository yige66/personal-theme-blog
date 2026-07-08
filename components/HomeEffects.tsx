'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
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

type SeasonalSpriteKey = 'petal' | 'firefly' | 'leafA' | 'leafB' | 'leafC' | 'snow' | 'heat' | 'snowMist' | 'snowbank';

type SeasonalSpriteMap = Partial<Record<SeasonalSpriteKey, HTMLImageElement>>;

type SeasonalVfxParticle = {
  kind: 'petal' | 'firefly' | 'bug' | 'leaf' | 'snow';
  season: Season;
  retiring: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  spin: number;
  alpha: number;
  phase: number;
  depth: number;
  sprite: SeasonalSpriteKey;
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
const xhSeasonSettleAttribute = 'data-xh-season-settle';
const seasonRotationIntervalMs = 120000;
const seasonTransitionDurationMs = 4200;
const seasonSettleDurationMs = 2600;
const themeTransitionDurationMs = 3400;

type ThemeMode = 'day' | 'night';
type ThemeTransition = 'active' | 'idle';
type ThemePhase = 'day' | 'night' | 'dusk' | 'dawn';
type Season = 'spring' | 'summer' | 'autumn' | 'winter';
type ThemeBlendState = {
  active: boolean;
  from: ThemeMode;
  to: ThemeMode;
  startedAt: number;
  duration: number;
};
type SeasonSettleState = {
  active: boolean;
  from: Season;
  to: Season;
  startedAt: number;
  duration: number;
};

type SeasonGroundLevels = Record<Season, number>;

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

function setSeasonAttributes(
  currentSeason: Season,
  nextSeason: Season,
  transition: ThemeTransition,
  previousSeason = currentSeason,
  settle: ThemeTransition = 'idle'
) {
  const root = document.documentElement;
  const attributes = [
    [xhSeasonAttribute, currentSeason],
    [xhSeasonNextAttribute, nextSeason],
    [xhSeasonPreviousAttribute, previousSeason],
    [xhSeasonTransitionAttribute, transition],
    [xhSeasonSettleAttribute, settle]
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
    currentLyric,
    currentTrack,
    isLoading,
    isMuted,
    isPlaying,
    nextTrack,
    playlist,
    previousTrack,
    progress,
    setVolume,
    toggleMute,
    togglePlaying,
    volume
  } = useMusic();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const seasonCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const transitionTimerRef = useRef<number | null>(null);
  const commitTimerRef = useRef<number | null>(null);
  const seasonTransitionTimerRef = useRef<number | null>(null);
  const seasonSettleTimerRef = useRef<number | null>(null);
  const isTransitioningRef = useRef(false);
  const isSeasonTransitioningRef = useRef(false);
  const seasonTransitionStartedAtRef = useRef(0);
  const hasSyncedThemeStateRef = useRef(false);
  const nightModeRef = useRef(false);
  const seasonRef = useRef<Season>('spring');
  const nextSeasonRef = useRef<Season>('spring');
  const previousSeasonRef = useRef<Season>('spring');
  const seasonSettleRef = useRef<SeasonSettleState>({
    active: false,
    from: 'spring',
    to: 'spring',
    startedAt: 0,
    duration: seasonSettleDurationMs
  });
  const seasonGroundLevelsRef = useRef<SeasonGroundLevels>({
    spring: 1,
    summer: 0,
    autumn: 0,
    winter: 0
  });
  const themeBlendRef = useRef<ThemeBlendState>({
    active: false,
    from: 'day',
    to: 'day',
    startedAt: 0,
    duration: themeTransitionDurationMs
  });
  const [nightMode, setNightMode] = useState(false);
  const [nextMode, setNextMode] = useState<ThemeMode>('day');
  const [themePhase, setThemePhase] = useState<ThemePhase>('day');
  const [season, setSeason] = useState<Season>('spring');
  const [nextSeason, setNextSeason] = useState<Season>('spring');
  const [previousSeason, setPreviousSeason] = useState<Season>('spring');
  const [isSeasonTransitioning, setIsSeasonTransitioning] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  nightModeRef.current = nightMode;
  seasonRef.current = season;
  nextSeasonRef.current = nextSeason;
  previousSeasonRef.current = previousSeason;
  isSeasonTransitioningRef.current = isSeasonTransitioning;
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

  const sparkles = useMemo(() => Array.from({ length: 10 }, (_item, index) => ({
    id: `sparkle-${index}`,
    left: `${(index * 19 + 11) % 100}%`,
    top: `${(index * 31 + 8) % 88}%`,
    delay: `${(index % 6) * 0.54}s`
  })), []);

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
    seasonRef.current = initialSeason;
    nextSeasonRef.current = initialSeason;
    previousSeasonRef.current = initialSeason;
    seasonTransitionStartedAtRef.current = 0;
    seasonSettleRef.current = {
      active: false,
      from: initialSeason,
      to: initialSeason,
      startedAt: 0,
      duration: seasonSettleDurationMs
    };
    seasonGroundLevelsRef.current = {
      spring: initialSeason === 'spring' ? 1 : 0,
      summer: initialSeason === 'summer' ? 1 : 0,
      autumn: initialSeason === 'autumn' ? 1 : 0,
      winter: initialSeason === 'winter' ? 1 : 0
    };
    setThemeAttributes(initialNight ? 'night' : 'day', initialNight ? 'night' : 'day', 'idle');
    themeBlendRef.current = {
      active: false,
      from: initialNight ? 'night' : 'day',
      to: initialNight ? 'night' : 'day',
      startedAt: 0,
      duration: themeTransitionDurationMs
    };
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
    themeBlendRef.current = {
      active: root.getAttribute(xhThemeTransitionAttribute) === 'active',
      from: rootMode,
      to: rootNextMode,
      startedAt: performance.now(),
      duration: themeTransitionDurationMs
    };
    setNextMode(rootNextMode);
    setThemePhase(rootPhase);
    setSeason(syncedSeason);
    setNextSeason(isSeason(rootNextSeason) ? rootNextSeason : syncedSeason);
    setPreviousSeason(isSeason(rootPreviousSeason) ? rootPreviousSeason : syncedSeason);
    setIsSeasonTransitioning(rootSeasonTransition);
    seasonRef.current = syncedSeason;
    nextSeasonRef.current = isSeason(rootNextSeason) ? rootNextSeason : syncedSeason;
    previousSeasonRef.current = isSeason(rootPreviousSeason) ? rootPreviousSeason : syncedSeason;
    isSeasonTransitioningRef.current = rootSeasonTransition;
    seasonTransitionStartedAtRef.current = rootSeasonTransition ? performance.now() : 0;
    seasonSettleRef.current = {
      active: false,
      from: syncedSeason,
      to: syncedSeason,
      startedAt: 0,
      duration: seasonSettleDurationMs
    };
    seasonGroundLevelsRef.current = {
      spring: syncedSeason === 'spring' ? 1 : 0,
      summer: syncedSeason === 'summer' ? 1 : 0,
      autumn: syncedSeason === 'autumn' ? 1 : 0,
      winter: syncedSeason === 'winter' ? 1 : 0
    };
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
      themeBlendRef.current = {
        active: false,
        from: idleMode,
        to: idleMode,
        startedAt: 0,
        duration: themeTransitionDurationMs
      };
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
    if (seasonSettleTimerRef.current) {
      window.clearTimeout(seasonSettleTimerRef.current);
      seasonSettleTimerRef.current = null;
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
      const ratio = Math.min(window.devicePixelRatio || 1, 1.35);
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

  useEffect(() => {
    if (!effects.enabled || prefersReducedMotion()) {
      return undefined;
    }

    const canvas = seasonCanvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) {
      return undefined;
    }

    const assetPaths: Record<SeasonalSpriteKey, string> = {
      petal: '/assets/seasonal/spring-petal-source.png',
      firefly: '/assets/seasonal/spring-firefly.png',
      leafA: '/assets/seasonal/autumn-leaf-a.png',
      leafB: '/assets/seasonal/autumn-leaf-b.png',
      leafC: '/assets/seasonal/autumn-leaf-c.png',
      snow: '/assets/seasonal/winter-snowflake.png',
      heat: '/assets/seasonal/summer-heat-haze.png',
      snowMist: '/assets/seasonal/winter-snow-mist.png',
      snowbank: '/assets/seasonal/winter-snowbank.png'
    };
    const sprites: SeasonalSpriteMap = {};
    const spriteKeys = Object.keys(assetPaths) as SeasonalSpriteKey[];
    let loadedSprites = 0;
    let isDisposed = false;
    let animationId = 0;
    let width = window.innerWidth;
    let height = window.innerHeight;
    let lastTime = performance.now();
    let lastFrameAt = 0;
    const frameIntervalMs = 1000 / 24;
    const effectStartedAt = performance.now();
    const particles: SeasonalVfxParticle[] = [];
    const smoothStep = (value: number) => {
      const clamped = Math.max(0, Math.min(1, value));
      return clamped * clamped * (3 - clamped * 2);
    };
    const getThemeWeights = (now = performance.now()) => {
      const blend = themeBlendRef.current;
      if (!blend.active) {
        return nightModeRef.current
          ? { day: 0, night: 1, progress: 1 }
          : { day: 1, night: 0, progress: 0 };
      }
      const progress = smoothStep((now - blend.startedAt) / blend.duration);
      const night = blend.to === 'night' ? progress : 1 - progress;
      return {
        day: 1 - night,
        night,
        progress
      };
    };
    const getNightMode = () => getThemeWeights().night >= 0.5;
    const getSeasonState = () => ({
      current: seasonRef.current,
      next: nextSeasonRef.current,
      previous: previousSeasonRef.current,
      transitioning: isSeasonTransitioningRef.current,
      startedAt: seasonTransitionStartedAtRef.current
    });
    const getSeasonTransitionProgress = (now = performance.now()) => {
      const seasonState = getSeasonState();
      if (!seasonState.transitioning || seasonState.startedAt <= 0) {
        return 0;
      }
      return Math.max(0, Math.min(1, (now - seasonState.startedAt) / seasonTransitionDurationMs));
    };
    const getSeasonSettleState = (now = performance.now()) => {
      const settle = seasonSettleRef.current;
      if (!settle.active) {
        return { ...settle, progress: 1 };
      }
      const progress = smoothStep((now - settle.startedAt) / settle.duration);
      if (progress >= 1) {
        seasonSettleRef.current = {
          active: false,
          from: settle.to,
          to: settle.to,
          startedAt: 0,
          duration: seasonSettleDurationMs
        };
        return { ...seasonSettleRef.current, progress: 1 };
      }
      return { ...settle, progress };
    };
    const getParticleSeason = () => {
      const seasonState = getSeasonState();
      if (!seasonState.transitioning) {
        return seasonState.current;
      }
      return seasonState.next;
    };
    const getParticleSeasonAlpha = (particleSeason: Season, now = performance.now()) => {
      const seasonState = getSeasonState();
      if (seasonState.transitioning) {
        const progress = smoothStep(getSeasonTransitionProgress(now));
        if (particleSeason === seasonState.current) {
          return 1 - progress;
        }
        if (particleSeason === seasonState.next) {
          return progress;
        }
        return 0;
      }

      const settle = getSeasonSettleState(now);
      if (settle.active) {
        if (particleSeason === settle.from) {
          return 0;
        }
        if (particleSeason === settle.to) {
          return 1;
        }
        return 0;
      }

      return particleSeason === seasonState.current ? 1 : 0;
    };
    const withAlpha = (alpha: number, drawLayer: () => void) => {
      if (alpha <= 0.01) {
        return;
      }
      context.save();
      context.globalAlpha *= Math.max(0, Math.min(1, alpha));
      drawLayer();
      context.restore();
    };

    const randomBetween = (min: number, max: number) => min + Math.random() * (max - min);
    const chooseLeafSprite = (): SeasonalSpriteKey => {
      const roll = Math.random();
      if (roll < 0.42) {
        return 'leafA';
      }
      return roll < 0.82 ? 'leafB' : 'leafC';
    };

    const resetParticle = (particle: SeasonalVfxParticle, initial = false, seasonOverride?: Season) => {
      const sceneMode = getNightMode() ? 'night' : 'day';
      const activeSeason = seasonOverride ?? getParticleSeason();
      particle.season = activeSeason;
      particle.retiring = false;
      particle.phase = randomBetween(0, Math.PI * 2);
      particle.depth = randomBetween(0.68, 1.26);
      particle.rotation = randomBetween(-Math.PI, Math.PI);

      if (activeSeason === 'spring') {
        particle.kind = 'petal';
        particle.sprite = 'petal';
        particle.size = randomBetween(18, 34) * particle.depth;
        particle.x = randomBetween(-width * 0.18, width * 1.04);
        particle.y = initial ? randomBetween(-height * 0.08, height * 0.92) : randomBetween(-120, -24);
        particle.vx = randomBetween(10, 36) * particle.depth;
        particle.vy = randomBetween(14, 34) * particle.depth;
        particle.spin = randomBetween(-0.75, 0.95);
        particle.alpha = randomBetween(0.62, sceneMode === 'night' ? 0.82 : 0.9);
        return;
      }

      if (activeSeason === 'summer' && sceneMode === 'night') {
        particle.kind = 'firefly';
        particle.sprite = 'firefly';
        particle.size = randomBetween(9, 18) * particle.depth;
        particle.x = randomBetween(width * 0.04, width * 0.96);
        particle.y = randomBetween(height * 0.18, height * 0.82);
        particle.vx = randomBetween(-10, 12);
        particle.vy = randomBetween(-8, 9);
        particle.spin = randomBetween(-0.3, 0.3);
        particle.alpha = randomBetween(0.38, 0.72);
        return;
      }

      if (activeSeason === 'summer' && sceneMode === 'day') {
        particle.kind = 'bug';
        particle.sprite = 'firefly';
        particle.size = randomBetween(4, 7.5) * particle.depth;
        particle.x = randomBetween(width * 0.03, width * 0.98);
        particle.y = initial ? randomBetween(height * 0.42, height * 0.82) : randomBetween(height * 0.48, height * 0.78);
        particle.vx = randomBetween(-8, 9);
        particle.vy = randomBetween(-5, 5);
        particle.spin = randomBetween(-0.4, 0.4);
        particle.alpha = randomBetween(0.12, 0.24);
        return;
      }

      if (activeSeason === 'autumn') {
        particle.kind = 'leaf';
        particle.sprite = chooseLeafSprite();
        particle.size = randomBetween(16, 30) * particle.depth;
        particle.x = randomBetween(-width * 0.08, width * 1.06);
        particle.y = initial ? randomBetween(-height * 0.1, height * 0.86) : randomBetween(-140, -32);
        particle.vx = randomBetween(-18, 34) * particle.depth;
        particle.vy = randomBetween(22, 54) * particle.depth;
        particle.spin = randomBetween(-1.2, 1.4);
        particle.alpha = randomBetween(0.48, 0.76);
        return;
      }

      particle.kind = 'snow';
      particle.sprite = 'snow';
      particle.size = randomBetween(7, 18) * particle.depth;
      particle.x = randomBetween(-width * 0.08, width * 1.08);
      particle.y = initial ? randomBetween(-height * 0.1, height * 0.92) : randomBetween(-120, -18);
      particle.vx = randomBetween(-14, 10) * particle.depth;
      particle.vy = randomBetween(18, 42) * particle.depth;
      particle.spin = randomBetween(-0.35, 0.35);
      particle.alpha = randomBetween(0.58, 0.9);
    };

    const countForSeason = (targetSeason: Season) => {
      if (targetSeason === 'summer') {
        const weights = getThemeWeights();
        const dayCount = Math.max(6, Math.round(intensity / 10));
        const nightCount = Math.max(18, Math.round(intensity / 4.2));
        return Math.max(6, Math.round(dayCount * weights.day + nightCount * weights.night));
      }
      if (targetSeason === 'spring') {
        return Math.max(32, Math.round(intensity / 2.2));
      }
      if (targetSeason === 'winter') {
        return Math.max(18, Math.round(intensity / 4.8));
      }
      if (targetSeason === 'autumn') {
        return Math.max(10, Math.round(intensity / 7.2));
      }
      return Math.max(12, Math.round(intensity / 6));
    };
    const targetCount = () => {
      const seasonState = getSeasonState();
      const settle = getSeasonSettleState();
      if (settle.active) {
        return countForSeason(settle.to);
      }
      if (seasonState.transitioning) {
        return Math.max(countForSeason(seasonState.current), countForSeason(seasonState.next));
      }
      return countForSeason(seasonState.current);
    };

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 1.35);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * ratio);
      canvas.height = Math.floor(height * ratio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const reconcileParticles = () => {
      const count = targetCount();
      while (particles.length < count) {
        const particle = {} as SeasonalVfxParticle;
        resetParticle(particle, true);
        particles.push(particle);
      }
      const seasonState = getSeasonState();
      const settle = getSeasonSettleState();
      const isSeasonBlending = seasonState.transitioning || settle.active;
      if (!isSeasonBlending && particles.length > count) {
        particles.splice(count);
      }
      particles.forEach((particle) => {
        const weights = getThemeWeights();
        const isNightScene = weights.night >= 0.5;
        const activeSeason = seasonState.transitioning ? seasonState.next : (settle.active ? settle.to : seasonState.current);
        const transitionMix = seasonState.transitioning ? smoothStep(getSeasonTransitionProgress()) : 0;
        const keepsSummerParticle = activeSeason === 'summer'
          && ((particle.kind === 'bug' && weights.day > 0.04) || (particle.kind === 'firefly' && weights.night > 0.04));
        const isCompatibleSettlingParticle = settle.active && (
          (settle.from === 'spring' && particle.kind === 'petal')
          || (settle.from === 'summer' && (particle.kind === 'bug' || particle.kind === 'firefly'))
          || (settle.from === 'autumn' && particle.kind === 'leaf')
          || (settle.from === 'winter' && particle.kind === 'snow')
          || (settle.to === 'spring' && particle.kind === 'petal')
          || (settle.to === 'summer' && (particle.kind === 'bug' || particle.kind === 'firefly'))
          || (settle.to === 'autumn' && particle.kind === 'leaf')
          || (settle.to === 'winter' && particle.kind === 'snow')
        );
        const isCompatibleTransitionParticle = seasonState.transitioning && (
          (seasonState.next === 'spring' && particle.kind === 'petal')
          || (seasonState.next === 'summer' && (particle.kind === 'bug' || particle.kind === 'firefly'))
          || (seasonState.next === 'autumn' && particle.kind === 'leaf')
          || (seasonState.next === 'winter' && particle.kind === 'snow')
          || (seasonState.current === 'spring' && particle.kind === 'petal' && transitionMix < 0.72)
          || (seasonState.current === 'summer' && (particle.kind === 'bug' || particle.kind === 'firefly') && transitionMix < 0.72)
          || (seasonState.current === 'autumn' && particle.kind === 'leaf' && transitionMix < 0.72)
          || (seasonState.current === 'winter' && particle.kind === 'snow' && transitionMix < 0.72)
        );
        const particleSeasonAlpha = getParticleSeasonAlpha(particle.season);
        if (isSeasonBlending && particle.season !== activeSeason && particleSeasonAlpha < 0.98) {
          particle.retiring = true;
        }
        const particleShouldRetire = particle.retiring && particleSeasonAlpha <= 0.015;
        if (particleShouldRetire) {
          resetParticle(particle, true, activeSeason);
          return;
        }
        if (
          !isSeasonBlending
          && !isCompatibleTransitionParticle
          && !isCompatibleSettlingParticle
          && ((activeSeason === 'summer' && !keepsSummerParticle && !isNightScene && particle.kind !== 'bug')
          || (activeSeason === 'summer' && !keepsSummerParticle && isNightScene && particle.kind !== 'firefly')
          || (activeSeason === 'spring' && particle.kind !== 'petal')
          || (activeSeason === 'autumn' && particle.kind !== 'leaf')
          || (activeSeason === 'winter' && particle.kind !== 'snow'))
        ) {
          resetParticle(particle, true, activeSeason);
        }
      });
    };

    const drawSprite = (particle: SeasonalVfxParticle, now: number) => {
      const image = sprites[particle.sprite];
      if (!image && particle.kind !== 'bug') {
        return;
      }

      const bob = Math.sin(now * 0.0014 + particle.phase);
      const x = particle.x + bob * 18 * particle.depth;
      const y = particle.y;
      const size = particle.size * (particle.kind === 'leaf' ? 1.18 : 1);
      const weights = getThemeWeights(now);
      const sceneAlpha = particle.kind === 'firefly'
        ? weights.night
        : (particle.kind === 'bug' ? weights.day : 1);
      const alpha = particle.kind === 'firefly'
        ? particle.alpha * (0.58 + Math.sin(now * 0.003 + particle.phase) * 0.28 + 0.28)
        : particle.alpha;

      const seasonAlpha = getParticleSeasonAlpha(particle.season, now);
      if (seasonAlpha <= 0.01 || (particle.retiring && seasonAlpha <= 0.035)) {
        return;
      }

      context.save();
      context.globalAlpha = Math.max(0, Math.min(0.9, alpha * sceneAlpha * seasonAlpha));
      context.translate(x, y);
      context.rotate(particle.rotation + Math.sin(now * 0.001 + particle.phase) * 0.38);
      if (particle.kind === 'bug') {
        const wingBeat = 0.55 + Math.sin(now * 0.017 + particle.phase) * 0.25;
        context.globalAlpha = Math.max(0.02, particle.alpha * (0.62 + wingBeat * 0.18) * sceneAlpha * seasonAlpha);
        context.globalCompositeOperation = 'source-over';
        context.shadowColor = 'rgba(255, 238, 166, 0.12)';
        context.shadowBlur = size * 0.45;
        context.fillStyle = 'rgba(24, 38, 26, 0.34)';
        context.beginPath();
        context.ellipse(0, 0, size * 0.18, size * 0.38, 0, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = 'rgba(255, 242, 166, 0.18)';
        context.beginPath();
        context.ellipse(-size * 0.26, -size * 0.08, size * 0.34, size * 0.12 * wingBeat, -0.42, 0, Math.PI * 2);
        context.ellipse(size * 0.26, -size * 0.08, size * 0.34, size * 0.12 * wingBeat, 0.42, 0, Math.PI * 2);
        context.fill();
        context.restore();
        return;
      }
      if (!image) {
        context.restore();
        return;
      }
      if (particle.kind === 'firefly') {
        context.shadowColor = 'rgba(255, 236, 116, 0.72)';
        context.shadowBlur = size * 0.75;
        context.globalCompositeOperation = 'screen';
        const pulse = 0.75 + Math.sin(now * 0.004 + particle.phase) * 0.2;
        const halo = context.createRadialGradient(0, 0, 0, 0, 0, size * 1.05);
        halo.addColorStop(0, `rgba(255, 252, 156, ${0.46 * pulse})`);
        halo.addColorStop(0.42, `rgba(118, 255, 183, ${0.22 * pulse})`);
        halo.addColorStop(1, 'rgba(118, 255, 183, 0)');
        context.fillStyle = halo;
        context.beginPath();
        context.arc(0, 0, size * 1.05, 0, Math.PI * 2);
        context.fill();
        context.globalCompositeOperation = 'source-over';
        context.globalAlpha *= 0.88;
        context.fillStyle = 'rgba(255, 250, 170, 0.78)';
        context.beginPath();
        context.ellipse(0, 0, size * 0.16, size * 0.26, 0, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = 'rgba(196, 255, 220, 0.22)';
        context.beginPath();
        context.ellipse(-size * 0.24, -size * 0.04, size * 0.26, size * 0.1, -0.55, 0, Math.PI * 2);
        context.ellipse(size * 0.24, -size * 0.04, size * 0.26, size * 0.1, 0.55, 0, Math.PI * 2);
        context.fill();
        context.globalCompositeOperation = 'screen';
      }
      if (particle.kind === 'snow') {
        context.globalCompositeOperation = 'screen';
        context.shadowColor = 'rgba(222, 247, 255, 0.18)';
        context.shadowBlur = size * 0.18;
        context.strokeStyle = 'rgba(244, 253, 255, 0.74)';
        context.lineWidth = Math.max(0.55, size * 0.045);
        context.lineCap = 'round';
        context.beginPath();
        for (let arm = 0; arm < 6; arm += 1) {
          const angle = (Math.PI * 2 * arm) / 6;
          const outer = size * 0.44;
          const branch = size * 0.16;
          context.moveTo(Math.cos(angle) * size * 0.08, Math.sin(angle) * size * 0.08);
          context.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
          const bx = Math.cos(angle) * outer * 0.62;
          const by = Math.sin(angle) * outer * 0.62;
          context.moveTo(bx, by);
          context.lineTo(bx + Math.cos(angle + 0.68) * branch, by + Math.sin(angle + 0.68) * branch);
          context.moveTo(bx, by);
          context.lineTo(bx + Math.cos(angle - 0.68) * branch, by + Math.sin(angle - 0.68) * branch);
        }
        context.stroke();
        context.fillStyle = 'rgba(255, 255, 255, 0.72)';
        context.beginPath();
        context.arc(0, 0, Math.max(0.7, size * 0.06), 0, Math.PI * 2);
        context.fill();
        context.globalAlpha *= 0.35;
      }
      if (particle.kind === 'leaf') {
        context.filter = 'sepia(0.72) saturate(1.24) hue-rotate(-18deg) brightness(0.86)';
      }
      context.drawImage(image, -size / 2, -size / 2, size, size);
      context.restore();
    };

    const easeOut = (value: number) => 1 - Math.pow(1 - Math.max(0, Math.min(1, value)), 3);
    const seededUnit = (seed: number) => {
      const value = Math.sin(seed * 12.9898) * 43758.5453;
      return value - Math.floor(value);
    };

    const drawGrassBlade = (x: number, baseY: number, length: number, lean: number, color: string, alpha: number) => {
      context.save();
      context.globalAlpha = alpha;
      context.strokeStyle = color;
      context.lineWidth = Math.max(0.9, length * 0.045);
      context.lineCap = 'round';
      context.beginPath();
      context.moveTo(x, baseY);
      context.quadraticCurveTo(x + lean * 0.42, baseY - length * 0.58, x + lean, baseY - length);
      context.stroke();
      context.restore();
    };

    const drawSoftGroundGradient = (top: number, colors: [string, string, string]) => {
      const gradient = context.createLinearGradient(0, top, 0, height);
      gradient.addColorStop(0, colors[0]);
      gradient.addColorStop(0.42, colors[1]);
      gradient.addColorStop(1, colors[2]);
      context.fillStyle = gradient;
      context.fillRect(0, top, width, height - top);
    };

    const drawPetalAccumulation = (growth: number, now: number, windAway = 0) => {
      const level = Math.max(0, growth * (1 - windAway));
      const pileHeight = Math.min(54, Math.max(24, height * 0.044)) * level;
      if (pileHeight < 2) {
        return;
      }
      const top = height - pileHeight;
      context.save();
      const drift = windAway * width * 0.56;
      const fade = 1 - windAway;
      const petalShadow = context.createLinearGradient(0, height - pileHeight * 0.72, 0, height);
      petalShadow.addColorStop(0, 'rgba(255, 214, 234, 0)');
      petalShadow.addColorStop(1, `rgba(255, 220, 236, ${0.055 * fade})`);
      context.fillStyle = petalShadow;
      context.fillRect(0, height - pileHeight * 0.72, width, pileHeight * 0.72);

      const petal = sprites.petal;
      if (petal) {
        for (let index = 0; index < 620; index += 1) {
          const frac = seededUnit(index + 9.7);
          const lane = seededUnit(index + 31.4);
          const cluster = Math.floor(index / 8);
          const patch = Math.sin(cluster * 2.41) * 44;
          const x = ((index * 37 + frac * 168 + patch + drift) % (width + 170)) - 85;
          const wave = Math.sin(now * 0.0012 + index) * windAway * (18 + frac * 24);
          const y = height - (Math.pow(lane, 2.55) * pileHeight * 0.82 + 1 + seededUnit(index + 58.2) * 3) - windAway * (12 + frac * 42);
          const size = (4.6 + frac * 7.4) * (1 + level * 0.12);
          context.save();
          context.globalAlpha = (0.42 + frac * 0.38) * fade;
          context.translate(x, y + wave);
          context.rotate(frac * Math.PI * 2 + windAway * (1.2 + frac));
          context.drawImage(petal, -size / 2, -size / 2, size, size);
          context.restore();
        }
        for (let index = 0; index < 260; index += 1) {
          const frac = seededUnit(index + 211.3);
          const x = ((index * 91 + frac * 210 + drift * 0.8) % (width + 120)) - 60;
          const y = height - (2 + Math.pow(seededUnit(index + 19.6), 2.35) * pileHeight * 0.54) - windAway * (18 + frac * 52);
          const size = 6.5 + frac * 8.2;
          context.save();
          context.globalAlpha = (0.44 + frac * 0.34) * fade * level;
          context.translate(x, y + Math.sin(now * 0.001 + index) * windAway * 20);
          context.rotate(frac * Math.PI * 2.8 + windAway * 1.5);
          context.drawImage(petal, -size / 2, -size / 2, size, size);
          context.restore();
        }
      }
      context.restore();
    };

    const drawSpringGround = (growth: number, now: number, summerFlowers = false, dry = 0) => {
      const groundHeight = Math.min(summerFlowers ? 82 : 64, Math.max(summerFlowers ? 42 : 34, height * (summerFlowers ? 0.068 : 0.054))) * growth;
      const top = height - groundHeight;
      context.save();
      drawSoftGroundGradient(top, [
        summerFlowers ? 'rgba(95, 178, 92, 0)' : 'rgba(126, 203, 122, 0)',
        dry > 0.1 ? `rgba(159, 137, 64, ${0.12 * (1 - dry * 0.45)})` : (summerFlowers ? 'rgba(78, 158, 86, 0.16)' : 'rgba(93, 180, 96, 0.12)'),
        dry > 0.1 ? `rgba(94, 83, 44, ${0.22 * (1 - dry * 0.55)})` : (summerFlowers ? 'rgba(42, 112, 68, 0.28)' : 'rgba(54, 136, 74, 0.22)')
      ]);
      const haze = context.createLinearGradient(0, top - 6, 0, height);
      haze.addColorStop(0, 'rgba(117, 205, 113, 0)');
      haze.addColorStop(0.6, dry > 0.2 ? `rgba(168, 146, 62, ${0.08 * (1 - dry * 0.35)})` : (summerFlowers ? 'rgba(112, 214, 122, 0.07)' : 'rgba(142, 220, 132, 0.05)'));
      haze.addColorStop(1, dry > 0.2 ? `rgba(105, 88, 36, ${0.14 * (1 - dry * 0.45)})` : (summerFlowers ? 'rgba(58, 144, 78, 0.14)' : 'rgba(79, 155, 84, 0.1)'));
      context.fillStyle = haze;
      context.fillRect(0, top - 6, width, groundHeight + 8);
      const step = Math.max(5.5, width / (summerFlowers ? 310 : 230));
      for (let x = -20; x < width + 20; x += step) {
        const frac = seededUnit(x);
        const blade = (12 + frac * (summerFlowers ? 38 : 22)) * growth;
        const lean = Math.sin(now * 0.0011 + x * 0.02) * (summerFlowers ? 8 : 4.5);
        const hue = dry > 0 ? 82 - dry * 28 + frac * 18 : (summerFlowers ? 104 + frac * 36 : 96 + frac * 28);
        const alpha = (summerFlowers ? 0.82 : 0.66) * (1 - dry * 0.66);
        drawGrassBlade(x, height + 3, blade * (1 - dry * 0.22), lean, `hsla(${hue}, ${44 - dry * 16}%, ${summerFlowers ? 40 : 46}%, ${alpha})`, alpha);
        if (summerFlowers && frac > 0.64 && dry < 0.9) {
          context.save();
          context.globalAlpha = (0.34 + frac * 0.28) * growth * (1 - dry);
          context.fillStyle = frac > 0.92 ? 'rgba(255, 225, 126, 0.78)' : (frac > 0.82 ? 'rgba(156, 215, 255, 0.58)' : 'rgba(255, 142, 204, 0.66)');
          const flowerY = height - blade - 4;
          context.beginPath();
          context.arc(x + lean, flowerY, 1.5 + frac * 2.4, 0, Math.PI * 2);
          context.arc(x + lean + 2.5, flowerY + 1.5, 0.9 + frac * 1.2, 0, Math.PI * 2);
          context.fill();
          context.restore();
        }
      }
      context.restore();
    };

    const drawLeafAccumulation = (growth: number, sink = 0) => {
      const pileHeight = Math.min(96, Math.max(46, height * 0.082)) * growth;
      if (pileHeight < 4) {
        return;
      }
      const sinkOffset = Math.min(34, Math.max(12, height * 0.026)) * smoothStep(sink);
      context.save();
      context.translate(0, sinkOffset);
      const leafAlpha = growth * (1 - smoothStep(sink));
      const groundShadow = context.createLinearGradient(0, height - pileHeight * 0.5, 0, height);
      groundShadow.addColorStop(0, 'rgba(224, 143, 45, 0)');
      groundShadow.addColorStop(0.48, `rgba(143, 73, 28, ${0.13 * leafAlpha})`);
      groundShadow.addColorStop(1, `rgba(66, 31, 16, ${0.26 * leafAlpha})`);
      context.fillStyle = groundShadow;
      context.fillRect(0, height - pileHeight * 0.5, width, pileHeight * 0.5);

      context.save();
      context.globalCompositeOperation = 'source-over';
      for (let index = 0; index < 88; index += 1) {
        const frac = seededUnit(index + 274.9);
        const x = ((index * 41 + frac * 128) % (width + 80)) - 40;
        const y = height - Math.pow(seededUnit(index + 183.7), 3.2) * pileHeight * 0.38 - 0.8;
        context.globalAlpha = (0.2 + frac * 0.24) * leafAlpha;
        context.fillStyle = frac > 0.58 ? 'rgba(166, 76, 24, 0.76)' : 'rgba(94, 43, 19, 0.72)';
        context.beginPath();
        context.ellipse(x, y, 7.2 + frac * 13.4, 2.2 + frac * 4.8, frac * Math.PI, 0, Math.PI * 2);
        context.fill();
      }
      context.restore();

      const leafSprites: SeasonalSpriteKey[] = ['leafA', 'leafB', 'leafC'];
      context.save();
      context.filter = 'sepia(0.72) saturate(1.28) hue-rotate(-18deg) brightness(0.84)';
      for (let index = 0; index < 46; index += 1) {
        const frac = seededUnit(index + 17.2);
        const lane = seededUnit(index + 82.6);
        const sprite = sprites[leafSprites[index % leafSprites.length]];
        if (!sprite) {
          continue;
        }
        const cluster = Math.floor(index / 10);
        const patch = Math.sin(cluster * 2.17) * 36;
        const x = ((index * 53 + frac * 134 + patch) % (width + 130)) - 65;
        const y = height - Math.pow(lane, 3.15) * pileHeight * 0.44 - 1 - seededUnit(index + 49.4) * 2.6;
        const size = 9.5 + frac * 15;
        context.save();
        context.globalAlpha = (0.56 + frac * 0.4) * leafAlpha;
        context.translate(x, y);
        context.rotate(frac * Math.PI * 2);
        context.drawImage(sprite, -size / 2, -size / 2, size, size);
        context.restore();
      }
      context.restore();
      context.save();
      context.globalCompositeOperation = 'multiply';
      for (let index = 0; index < 58; index += 1) {
        const frac = seededUnit(index + 419.5);
        const x = ((index * 83 + frac * 160) % (width + 96)) - 48;
        const y = height - Math.pow(seededUnit(index + 122.4), 2.9) * pileHeight * 0.34 - 1;
        context.globalAlpha = (0.15 + frac * 0.2) * leafAlpha;
        context.fillStyle = frac > 0.55 ? 'rgba(92, 38, 18, 0.82)' : 'rgba(150, 72, 25, 0.7)';
        context.beginPath();
        context.ellipse(x, y, 4 + frac * 7.4, 1.4 + frac * 2.8, frac * Math.PI, 0, Math.PI * 2);
        context.fill();
      }
      context.restore();
      context.save();
      context.globalCompositeOperation = 'source-over';
      for (let index = 0; index < 32; index += 1) {
        const frac = seededUnit(index + 642.6);
        const x = ((index * 109 + frac * 190) % (width + 110)) - 55;
        const y = height - Math.pow(seededUnit(index + 314.8), 3.25) * pileHeight * 0.42 - 1.2;
        context.globalAlpha = (0.1 + frac * 0.17) * leafAlpha;
        context.fillStyle = frac > 0.62 ? 'rgba(190, 111, 35, 0.72)' : 'rgba(118, 55, 22, 0.68)';
        context.beginPath();
        context.ellipse(x, y, 4.6 + frac * 8.4, 1.8 + frac * 3.2, frac * Math.PI * 1.6, 0, Math.PI * 2);
        context.fill();
      }
      context.restore();
      context.restore();
    };

    const drawSweptPetals = (now: number, progress: number) => {
      const petal = sprites.petal;
      if (!petal) {
        return;
      }
      const pulse = Math.sin(progress * Math.PI);
      context.save();
      for (let index = 0; index < 30; index += 1) {
        const frac = seededUnit(index + 44.8);
        const y = height * (0.38 + seededUnit(index + 12.1) * 0.5) - progress * height * (0.08 + frac * 0.16);
        const x = -80 + progress * (width + 190) + Math.sin(now * 0.002 + index) * (28 + frac * 42) - frac * width * 0.28;
        const size = 7 + frac * 10;
        context.save();
        context.globalAlpha = pulse * (0.08 + frac * 0.18);
        context.translate(x, y);
        context.rotate(now * 0.0018 + frac * Math.PI * 4);
        context.drawImage(petal, -size / 2, -size / 2, size, size);
        context.restore();
      }
      context.restore();
    };

    const drawTransitionLeaves = (now: number, progress: number) => {
      const leafSprites: SeasonalSpriteKey[] = ['leafA', 'leafB', 'leafC'];
      const pulse = easeOut(progress);
      context.save();
      for (let index = 0; index < 34; index += 1) {
        const sprite = sprites[leafSprites[index % leafSprites.length]];
        if (!sprite) {
          continue;
        }
        const frac = seededUnit(index + 72.3);
        const start = seededUnit(index + 22.6) * width;
        const x = start + Math.sin(now * 0.001 + index) * 34 + progress * width * (0.12 + frac * 0.18);
        const y = -40 + progress * (height * 0.78) + seededUnit(index + 5.8) * height * 0.38;
        const size = 13 + frac * 16;
        context.save();
        context.globalAlpha = Math.min(0.62, pulse * (0.18 + frac * 0.36));
        context.filter = 'sepia(0.72) saturate(1.24) hue-rotate(-18deg) brightness(0.86)';
        context.translate(x, y);
        context.rotate(now * 0.0009 + frac * Math.PI * 3);
        context.drawImage(sprite, -size / 2, -size / 2, size, size);
        context.restore();
      }
      context.restore();
    };

    const drawColdLeafSnowWind = (now: number, progress: number) => {
      const leafSprites: SeasonalSpriteKey[] = ['leafA', 'leafB', 'leafC'];
      const gust = Math.sin(Math.min(1, progress) * Math.PI);
      if (gust <= 0.02) {
        return;
      }

      const windFront = -width * 0.16 + progress * width * 1.32;
      context.save();
      context.globalCompositeOperation = 'screen';
      context.filter = 'blur(5px)';
      const gustBand = context.createLinearGradient(windFront - width * 0.28, height * 0.74, windFront + width * 0.28, height);
      gustBand.addColorStop(0, 'rgba(219, 241, 255, 0)');
      gustBand.addColorStop(0.36, `rgba(224, 242, 255, ${0.11 * gust})`);
      gustBand.addColorStop(0.68, `rgba(255, 255, 255, ${0.18 * gust})`);
      gustBand.addColorStop(1, 'rgba(219, 241, 255, 0)');
      context.fillStyle = gustBand;
      context.beginPath();
      context.moveTo(windFront - width * 0.42, height);
      context.bezierCurveTo(windFront - width * 0.2, height * 0.76, windFront + width * 0.18, height * 0.82, windFront + width * 0.46, height);
      context.closePath();
      context.fill();
      context.restore();

      context.save();
      context.globalCompositeOperation = 'screen';
      for (let index = 0; index < 54; index += 1) {
        const seed = seededUnit(index + 811.2);
        const y = height * (0.7 + seededUnit(index + 27.3) * 0.24) + Math.sin(now * 0.0012 + index) * 8;
        const x = windFront - width * 0.24 + seed * width * 0.5 + Math.sin(now * 0.002 + index) * 24;
        const length = 38 + seed * 104;
        const gradient = context.createLinearGradient(x, y, x + length, y - 12);
        gradient.addColorStop(0, 'rgba(231, 245, 255, 0)');
        gradient.addColorStop(0.5, `rgba(231, 245, 255, ${0.15 + seed * 0.18})`);
        gradient.addColorStop(1, 'rgba(231, 245, 255, 0)');
        context.globalAlpha = gust * (0.24 + seed * 0.3);
        context.strokeStyle = gradient;
        context.lineWidth = 0.9 + seed * 1.2;
        context.beginPath();
        context.moveTo(x, y);
        context.lineTo(x + length, y - 8 - seed * 8);
        context.stroke();
      }
      context.restore();

      context.save();
      for (let index = 0; index < 36; index += 1) {
        const sprite = leafSprites[index % leafSprites.length];
        const image = sprites[sprite];
        if (!image) {
          continue;
        }
        const seed = seededUnit(index + 906.4);
        const x = windFront - width * 0.2 + seededUnit(index + 19.5) * width * 0.5;
        const y = height * (0.78 + seededUnit(index + 53.8) * 0.17) - progress * (12 + seed * 30);
        const size = 11 + seed * 16;
        context.save();
        context.globalAlpha = gust * (0.28 + seed * 0.38);
        context.filter = 'sepia(0.72) saturate(1.24) hue-rotate(-18deg) brightness(0.86)';
        context.translate(x + Math.sin(now * 0.0018 + index) * 32, y);
        context.rotate(now * 0.002 + seed * Math.PI * 5);
        context.drawImage(image, -size / 2, -size / 2, size, size);
        context.restore();
      }
      context.restore();
    };

    const drawNightFireflies = (now: number) => {
      const nightWeight = getThemeWeights(now).night;
      const seasonState = getSeasonState();
      const progress = seasonState.transitioning ? smoothStep(getSeasonTransitionProgress(now)) : 0;
      const currentSupportsGlow = seasonState.current === 'spring' || seasonState.current === 'summer';
      const nextSupportsGlow = seasonState.next === 'spring' || seasonState.next === 'summer';
      const glowWeight = seasonState.transitioning
        ? (currentSupportsGlow ? 1 - progress : 0) + (nextSupportsGlow ? progress : 0)
        : (currentSupportsGlow ? 1 : 0);
      if (nightWeight <= 0.02 || glowWeight <= 0.02) {
        return;
      }
      context.save();
      context.globalCompositeOperation = 'screen';
      for (let index = 0; index < 24; index += 1) {
        const seed = seededUnit(index + 135.7);
        const drift = Math.sin(now * 0.0007 + index * 1.7);
        const x = width * (0.08 + seededUnit(index + 21.9) * 0.84) + drift * (24 + seed * 36);
        const y = height * (0.28 + seededUnit(index + 77.1) * 0.5) + Math.cos(now * 0.0008 + index) * (12 + seed * 22);
        const glow = 1 + seed * 2.4;
        const alpha = (0.12 + (Math.sin(now * 0.0024 + index) * 0.5 + 0.5) * 0.18) * nightWeight * Math.min(1, glowWeight);
        const gradient = context.createRadialGradient(x, y, 0, x, y, 18 + glow * 8);
        gradient.addColorStop(0, `rgba(255, 246, 166, ${alpha + 0.18})`);
        gradient.addColorStop(0.34, `rgba(129, 255, 190, ${alpha})`);
        gradient.addColorStop(1, 'rgba(129, 255, 190, 0)');
        context.fillStyle = gradient;
        context.beginPath();
        context.arc(x, y, 18 + glow * 8, 0, Math.PI * 2);
        context.fill();
        context.globalAlpha = Math.min(0.72, alpha + 0.16);
        context.fillStyle = seed > 0.5 ? 'rgba(255, 250, 170, 0.86)' : 'rgba(166, 255, 205, 0.76)';
        context.beginPath();
        context.arc(x + Math.sin(now * 0.003 + index) * 2, y, 1.2 + seed * 1.8, 0, Math.PI * 2);
        context.fill();
      }
      context.restore();
    };

    const drawWinterFlurries = (now: number) => {
      const seasonState = getSeasonState();
      const progress = seasonState.transitioning ? smoothStep(getSeasonTransitionProgress(now)) : 0;
      const winterWeight = seasonState.current === 'winter'
        ? (seasonState.next === 'spring' ? 1 - progress : 1)
        : (seasonState.next === 'winter' ? progress : 0);
      if (winterWeight <= 0.02) {
        return;
      }
      context.save();
      context.globalCompositeOperation = 'screen';
      const weights = getThemeWeights(now);
      for (let index = 0; index < 42; index += 1) {
        const seed = seededUnit(index + 301.4);
        const lane = seededUnit(index + 18.6);
        const fall = ((now * (0.018 + seed * 0.032) + index * 47) % (height + 120)) - 70;
        const x = ((lane * width + Math.sin(now * 0.0007 + index) * (18 + seed * 42) + width) % (width + 80)) - 40;
        const y = fall;
        const radius = 2.2 + seed * 4.2;
        const alpha = (0.36 * weights.day + 0.28 * weights.night) + seed * 0.22;
        context.save();
        context.globalAlpha = alpha * winterWeight;
        context.translate(x, y);
        context.rotate(now * 0.00035 + seed * Math.PI * 2);
        context.shadowColor = 'rgba(220, 248, 255, 0.22)';
        context.shadowBlur = radius * 0.58;
        context.strokeStyle = 'rgba(238, 250, 255, 0.82)';
        context.lineWidth = 0.65 + seed * 0.35;
        context.lineCap = 'round';
        context.beginPath();
        for (let arm = 0; arm < 6; arm += 1) {
          const angle = (Math.PI * 2 * arm) / 6;
          const outer = radius * (1.4 + seed * 0.55);
          const branch = radius * 0.58;
          context.moveTo(Math.cos(angle) * radius * 0.22, Math.sin(angle) * radius * 0.22);
          context.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
          if (seed > 0.34) {
            const bx = Math.cos(angle) * outer * 0.56;
            const by = Math.sin(angle) * outer * 0.56;
            context.moveTo(bx, by);
            context.lineTo(bx + Math.cos(angle + 0.72) * branch, by + Math.sin(angle + 0.72) * branch);
            context.moveTo(bx, by);
            context.lineTo(bx + Math.cos(angle - 0.72) * branch, by + Math.sin(angle - 0.72) * branch);
          }
        }
        context.stroke();
        context.fillStyle = 'rgba(255, 255, 255, 0.8)';
        context.beginPath();
        context.arc(0, 0, Math.max(0.8, radius * 0.2), 0, Math.PI * 2);
        context.fill();
        context.restore();
      }
      context.restore();
    };

    const drawSnowAccumulation = (growth: number, melt = 0, cover = 0, thaw = 0) => {
      const level = Math.max(0, growth * (1 - melt));
      const snowHeight = Math.min(92, Math.max(42, height * 0.078)) * level;
      if (snowHeight < 3) {
        return;
      }
      const top = height - snowHeight;
      const weights = getThemeWeights();
      const coverStrength = smoothStep(cover);
      const thawStrength = smoothStep(thaw);
      context.save();
      const glow = context.createLinearGradient(0, height - snowHeight * 0.9, 0, height);
      glow.addColorStop(0, 'rgba(235, 248, 255, 0)');
      glow.addColorStop(0.34, `rgba(219, 238, 247, ${0.12 * weights.day + 0.1 * weights.night})`);
      glow.addColorStop(0.74, `rgba(184, 213, 232, ${(0.28 * weights.day + 0.22 * weights.night) + coverStrength * 0.18 - thawStrength * 0.06})`);
      glow.addColorStop(1, `rgba(134, 164, 190, ${(0.34 * weights.day + 0.26 * weights.night) + coverStrength * 0.24 - thawStrength * 0.08})`);
      context.fillStyle = glow;
      context.fillRect(0, height - snowHeight * 0.9, width, snowHeight * 0.9);

      if (sprites.snowMist) {
        context.save();
        context.globalAlpha = (0.09 * weights.day + 0.1 * weights.night) * level;
        context.globalCompositeOperation = 'screen';
        context.drawImage(sprites.snowMist, -width * 0.03, height - snowHeight * 1.12, width * 1.06, snowHeight * 0.86);
        context.restore();
      }

      context.beginPath();
      context.moveTo(0, height);
      context.lineTo(0, top + Math.sin(width * 0.001) * 1.4);
      for (let x = 0; x <= width + 48; x += 48) {
        const y = top + Math.sin(x * 0.009 + level * 2.4) * 1.8 + Math.sin(x * 0.023) * 0.9;
        context.lineTo(x, y);
      }
      context.lineTo(width, height);
      context.closePath();
      context.fillStyle = `rgba(232, 245, 252, ${(0.48 * weights.day + 0.38 * weights.night) + coverStrength * 0.32 - thawStrength * 0.1})`;
      context.fill();
      context.strokeStyle = `rgba(255, 255, 255, ${0.32 * weights.day + 0.22 * weights.night})`;
      context.lineWidth = 1.4;
      context.stroke();

      context.save();
      context.globalCompositeOperation = 'multiply';
      for (let band = 0; band < 4; band += 1) {
        const bandY = top + snowHeight * (0.22 + band * 0.17);
        const shade = context.createLinearGradient(0, bandY - 4, 0, bandY + 10);
        shade.addColorStop(0, 'rgba(138, 166, 190, 0)');
        shade.addColorStop(0.56, `rgba(120, 149, 174, ${0.045 * level})`);
        shade.addColorStop(1, 'rgba(138, 166, 190, 0)');
        context.fillStyle = shade;
        context.beginPath();
        context.moveTo(0, bandY);
        for (let x = 0; x <= width + 36; x += 36) {
          context.lineTo(x, bandY + Math.sin(x * 0.018 + band * 1.7) * 2.6);
        }
        context.lineTo(width, bandY + 14);
        context.lineTo(0, bandY + 14);
        context.closePath();
        context.fill();
      }
      context.restore();

      context.save();
      context.globalCompositeOperation = 'screen';
      for (let index = 0; index < 118; index += 1) {
        const frac = seededUnit(index + 511.8);
        const x = (index * 67 + frac * 180) % (width + 100) - 50;
        const y = height - Math.pow(seededUnit(index + 44.1), 1.55) * snowHeight * 0.92 - 1;
        const radius = 0.8 + frac * 2.35;
        context.globalAlpha = (0.16 + frac * 0.26) * level;
        context.fillStyle = frac > 0.72 ? 'rgba(255, 255, 255, 0.9)' : 'rgba(223, 241, 250, 0.82)';
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();
      }
      context.restore();

      if (coverStrength > 0.02) {
        context.save();
        context.globalCompositeOperation = 'source-over';
        const coverGradient = context.createLinearGradient(0, top - snowHeight * 0.12, 0, height);
        coverGradient.addColorStop(0, 'rgba(244, 250, 253, 0)');
        coverGradient.addColorStop(0.32, `rgba(238, 248, 253, ${0.32 * coverStrength})`);
        coverGradient.addColorStop(0.72, `rgba(229, 242, 250, ${0.58 * coverStrength})`);
        coverGradient.addColorStop(1, `rgba(214, 232, 244, ${0.78 * coverStrength})`);
        context.fillStyle = coverGradient;
        context.fillRect(0, top - snowHeight * 0.12, width, snowHeight * 1.12);
        context.restore();
      }
      if (thawStrength > 0.02) {
        context.save();
        context.globalCompositeOperation = 'source-over';
        const meltGlow = context.createLinearGradient(0, top - snowHeight * 0.05, 0, height);
        meltGlow.addColorStop(0, 'rgba(204, 238, 255, 0)');
        meltGlow.addColorStop(0.42, `rgba(184, 223, 239, ${0.14 * thawStrength})`);
        meltGlow.addColorStop(1, `rgba(92, 145, 164, ${0.2 * thawStrength})`);
        context.fillStyle = meltGlow;
        context.fillRect(0, top - snowHeight * 0.05, width, snowHeight * 1.05);
        context.globalCompositeOperation = 'screen';
        for (let run = 0; run < 18; run += 1) {
          const frac = seededUnit(run + 730.4);
          const x = ((run * 127 + frac * 220) % (width + 120)) - 60;
          const y = top + snowHeight * (0.2 + seededUnit(run + 17.8) * 0.72);
          const length = 18 + frac * 86 * thawStrength;
          context.globalAlpha = (0.08 + frac * 0.14) * thawStrength;
          context.strokeStyle = frac > 0.55 ? 'rgba(210, 244, 255, 0.8)' : 'rgba(116, 178, 196, 0.56)';
          context.lineWidth = 1 + frac * 1.6;
          context.beginPath();
          context.moveTo(x, y);
          context.bezierCurveTo(x + length * 0.32, y + 3 + frac * 5, x + length * 0.68, y - 2, x + length, y + frac * 4);
          context.stroke();
        }
        context.restore();
      }
      context.restore();
    };

    const drawGround = (now: number, transitionProgress: number) => {
      const { current, next, previous, transitioning } = getSeasonState();
      const baseGrowth = easeOut((now - effectStartedAt) / 16000);
      const transitionGrowth = transitioning ? easeOut(transitionProgress) : baseGrowth;
      const fadeIn = transitioning ? smoothStep(transitionProgress) : 1;
      const fadeOut = transitioning ? 1 - smoothStep(Math.max(0, (transitionProgress - 0.18) / 0.82)) : 1;
      const groundLevels = seasonGroundLevelsRef.current;
      if (transitioning) {
        groundLevels[current] = Math.max(groundLevels[current], baseGrowth);
        groundLevels[next] = Math.max(groundLevels[next], transitionGrowth);
      } else {
        const settle = getSeasonSettleState(now);
        const activeSeason = settle.active ? settle.to : current;
        groundLevels[activeSeason] = Math.max(groundLevels[activeSeason], baseGrowth);
      }
      const growth = Math.max(baseGrowth, groundLevels[current]);
      const nextGrowth = Math.max(transitionGrowth, groundLevels[next]);
      const drawStableSeasonGround = (targetSeason: Season, targetGrowth: number, windAway = 0, dry = 0, melt = 0, thaw = 0) => {
        if (targetSeason === 'spring') {
          drawSpringGround(targetGrowth * 0.75, now, false, 0);
          drawPetalAccumulation(targetGrowth, now, windAway);
        } else if (targetSeason === 'summer') {
          drawSpringGround(targetGrowth, now, true, dry);
        } else if (targetSeason === 'autumn') {
          drawLeafAccumulation(targetGrowth);
        } else {
          drawSnowAccumulation(targetGrowth, melt, 0.88 * (1 - smoothStep(thaw)), thaw);
        }
      };

      if (!transitioning) {
        const settle = getSeasonSettleState(now);
        if (settle.active) {
          if (settle.from === 'autumn' && settle.to === 'winter') {
            const leafSettleSink = smoothStep(Math.min(1, Math.max(0, (settle.progress - 0.08) / 0.92)));
            const snowSettleCover = Math.max(0.88, 1 - smoothStep(settle.progress) * 0.12);
            withAlpha(1, () => drawLeafAccumulation(1, leafSettleSink));
            withAlpha(1, () => drawSnowAccumulation(Math.max(1, groundLevels[settle.to]), 0, snowSettleCover));
            withAlpha(1 - smoothStep(settle.progress), () => drawColdLeafSnowWind(now, 0.54 + settle.progress * 0.28));
            return;
          }
          if (settle.from === 'winter' && settle.to === 'spring') {
            const thawProgress = smoothStep(settle.progress);
            withAlpha(1, () => {
              drawSpringGround(Math.max(baseGrowth, groundLevels[settle.to]) * (0.46 + thawProgress * 0.34), now, false, 0);
              drawPetalAccumulation(Math.max(baseGrowth, groundLevels[settle.to]) * thawProgress * 0.72, now);
            });
            withAlpha(1 - thawProgress * 0.38, () => drawSnowAccumulation(1, thawProgress, 0.88 * (1 - thawProgress), thawProgress));
            return;
          }
          withAlpha(1, () => drawStableSeasonGround(settle.to, Math.max(baseGrowth, groundLevels[settle.to])));
          return;
        }
        drawStableSeasonGround(current, growth);
        return;
      }

      if (current === 'spring') {
        const windAway = transitioning && next === 'summer' ? transitionGrowth : 0;
        withAlpha(fadeOut, () => drawStableSeasonGround('spring', growth, windAway));
      } else if (current === 'summer') {
        const dry = transitioning && next === 'autumn' ? transitionGrowth : 0;
        withAlpha(fadeOut, () => drawStableSeasonGround('summer', growth, 0, dry));
      } else if (current === 'autumn') {
        if (next !== 'winter') {
          withAlpha(1, () => drawLeafAccumulation(growth));
        }
      } else if (current === 'winter') {
        const thawProgress = next === 'spring' ? transitionGrowth : 0;
        withAlpha(next === 'spring' ? Math.max(0.34, fadeOut) : 1, () => drawSnowAccumulation(growth, thawProgress, 0.88 * (1 - thawProgress), thawProgress));
      }

      if (transitioning && next === 'spring') {
        const thawProgress = transitionGrowth;
        withAlpha(fadeIn, () => {
          drawSpringGround(nextGrowth * (0.42 + thawProgress * 0.34), now, false, 0);
          drawPetalAccumulation(nextGrowth * thawProgress, now);
        });
      } else if (transitioning && next === 'summer') {
        drawSweptPetals(now, transitionGrowth);
        withAlpha(fadeIn, () => drawSpringGround(nextGrowth, now, true, 0));
      } else if (transitioning && next === 'autumn') {
        if (previous === 'summer') {
          withAlpha(fadeOut, () => drawStableSeasonGround('summer', 1 - transitionGrowth * 0.28, 0, transitionGrowth));
        }
        drawTransitionLeaves(now, transitionGrowth);
        withAlpha(fadeIn, () => drawLeafAccumulation(nextGrowth));
      } else if (transitioning && next === 'winter') {
        if (previous === 'autumn') {
          const snowCoverProgress = smoothStep(Math.min(1, Math.max(0, transitionProgress / 0.58)));
          const leafVanishProgress = smoothStep(Math.min(1, Math.max(0, (transitionProgress - 0.68) / 0.32)));
          const coveredSnowGrowth = Math.max(nextGrowth, snowCoverProgress * 0.96);
          withAlpha(1, () => drawLeafAccumulation(growth, leafVanishProgress));
          withAlpha(1, () => drawSnowAccumulation(coveredSnowGrowth, 0, snowCoverProgress));
          drawColdLeafSnowWind(now, transitionProgress);
          return;
        }
        withAlpha(fadeIn, () => drawSnowAccumulation(nextGrowth));
      }
    };

    const drawSummer = (now: number, transitionProgress: number) => {
      const dayWeight = getThemeWeights(now).day;
      const seasonState = getSeasonState();
      const progress = seasonState.transitioning ? smoothStep(transitionProgress) : 0;
      const summerWeight = seasonState.transitioning
        ? (seasonState.current === 'summer' ? 1 - progress : 0) + (seasonState.next === 'summer' ? progress : 0)
        : (seasonState.current === 'summer' ? 1 : 0);
      if (summerWeight <= 0.02 || dayWeight <= 0.02) {
        return;
      }

      context.save();
      context.globalCompositeOperation = 'screen';
      const sway = Math.sin(now * 0.00045) * 22;
      const drawSoftBeam = (x: number, y: number, beamWidth: number, beamHeight: number, angle: number, alpha: number) => {
        context.save();
        context.globalAlpha = alpha * dayWeight * summerWeight;
        context.translate(x + sway, y);
        context.rotate(angle);
        context.filter = 'blur(2px)';
        const gradient = context.createLinearGradient(0, 0, beamWidth, 0);
        gradient.addColorStop(0, 'rgba(255, 247, 198, 0)');
        gradient.addColorStop(0.42, 'rgba(255, 247, 198, 0.14)');
        gradient.addColorStop(0.58, 'rgba(173, 239, 255, 0.1)');
        gradient.addColorStop(1, 'rgba(255, 247, 198, 0)');
        context.fillStyle = gradient;
        context.fillRect(-beamWidth / 2, 0, beamWidth, beamHeight);
        context.restore();
      };

      if (dayWeight > 0.04) {
        drawSoftBeam(width * 0.22, -height * 0.08, width * 0.16, height * 0.78, -0.2, 0.45);
        drawSoftBeam(width * 0.66, -height * 0.12, width * 0.18, height * 0.82, 0.16, 0.34);
      }
      context.restore();

      context.save();
      context.globalAlpha = 0.12 * dayWeight * summerWeight * (1 - transitionProgress * 0.35);
      context.globalCompositeOperation = 'screen';
      context.filter = 'blur(2.6px)';
      const bandHeight = Math.max(48, height * 0.064);
      for (let line = 0; line < 7; line += 1) {
        const y = height * (0.5 + line * 0.052) + Math.sin(now * 0.0015 + line) * 10;
        const offset = Math.sin(now * 0.0012 + line * 1.8) * 42;
        const gradient = context.createLinearGradient(offset, y, width + offset, y + 18);
        gradient.addColorStop(0, 'rgba(255, 224, 120, 0)');
        gradient.addColorStop(0.45, 'rgba(255, 225, 132, 0.26)');
        gradient.addColorStop(0.55, 'rgba(132, 226, 210, 0.2)');
        gradient.addColorStop(1, 'rgba(84, 199, 184, 0)');
        context.fillStyle = gradient;
        context.fillRect(0, y, width, bandHeight / 6);
      }
      context.restore();

      if (sprites.heat) {
        context.save();
        context.globalAlpha = 0.065 * dayWeight * summerWeight * (1 - transitionProgress * 0.4);
        context.globalCompositeOperation = 'screen';
        context.filter = 'blur(3px)';
        const heatY = height * 0.48 + Math.sin(now * 0.0008) * 8;
        context.drawImage(sprites.heat, -width * 0.05 + Math.sin(now * 0.0006) * 24, heatY, width * 1.1, Math.max(160, height * 0.42));
        context.restore();
      }
    };

    const drawTransition = (now: number, progress: number) => {
      const { previous, next, transitioning } = getSeasonState();
      const settle = getSeasonSettleState(now);
      if (!transitioning) {
        if (settle.active && settle.from === 'summer' && settle.to === 'autumn') {
          withAlpha(1 - settle.progress, () => {
            drawSummer(now, 1);
            drawTransitionLeaves(now, 1);
          });
        }
        if (settle.active && settle.from === 'winter' && settle.to === 'spring') {
          withAlpha(1 - settle.progress, () => drawSweptPetals(now, 1));
        }
        return;
      }

      context.save();
      const pulse = Math.sin(progress * Math.PI);
      context.globalCompositeOperation = 'screen';
      for (let index = 0; index < 7; index += 1) {
        const lane = index / 12;
        const y = height * (0.08 + lane * 0.84) + Math.sin(now * 0.0014 + index) * 14;
        const length = width * (0.12 + pulse * 0.12);
        const x = ((now * (0.08 + index * 0.006) + index * 211) % (width + length)) - length;
        const gradient = context.createLinearGradient(x, y, x + length, y);
        gradient.addColorStop(0, 'rgba(255,255,255,0)');
        gradient.addColorStop(0.5, 'rgba(255,255,255,0.045)');
        gradient.addColorStop(1, 'rgba(255,255,255,0)');
        context.globalAlpha = 0.03 * pulse;
        context.strokeStyle = gradient;
        context.lineWidth = 0.6 + (index % 3) * 0.25;
        context.beginPath();
        context.moveTo(x, y);
        context.lineTo(x + length, y + Math.sin(index) * 7);
        context.stroke();
      }

      if (previous === 'spring' && next === 'summer') {
        context.globalAlpha = pulse * 0.055;
        context.strokeStyle = 'rgba(255, 255, 255, 0.24)';
        context.lineWidth = 1.2;
        for (let index = 0; index < 5; index += 1) {
          const y = height * (0.22 + index * 0.12) + Math.sin(now * 0.0018 + index) * 12;
          context.beginPath();
          context.moveTo(-width * 0.06 + progress * width * 0.42, y);
          context.bezierCurveTo(width * 0.18, y - 24, width * 0.48, y + 20, width * (0.76 + progress * 0.16), y - 5);
          context.stroke();
        }
      }

      if (previous === 'summer' && next === 'autumn') {
        drawSummer(now, progress);
        drawTransitionLeaves(now, progress);
      }

      if (previous === 'winter' && next === 'spring') {
        drawSweptPetals(now, progress);
      }
      context.restore();
    };

    const draw = (now: number) => {
      if (now - lastFrameAt < frameIntervalMs) {
        animationId = window.requestAnimationFrame(draw);
        return;
      }
      lastFrameAt = now;
      const deltaSeconds = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      context.clearRect(0, 0, width, height);
      reconcileParticles();
      const seasonState = getSeasonState();
      const transitionProgress = seasonState.transitioning
        ? Math.min(1, (now - seasonState.startedAt) / seasonTransitionDurationMs)
        : 0;

      drawSummer(now, transitionProgress);
      drawWinterFlurries(now);
      drawNightFireflies(now);

      particles.forEach((particle) => {
        if (particle.kind === 'firefly' || particle.kind === 'bug') {
          particle.x += (particle.vx + Math.sin(now * 0.001 + particle.phase) * 6) * deltaSeconds;
          particle.y += (particle.vy + Math.cos(now * 0.0011 + particle.phase) * 5) * deltaSeconds;
          if (particle.x < -40) particle.x = width + 40;
          if (particle.x > width + 40) particle.x = -40;
          const topBound = particle.kind === 'bug' ? height * 0.2 : height * 0.12;
          const bottomBound = particle.kind === 'bug' ? height * 0.76 : height * 0.86;
          if (particle.y < topBound) particle.y = bottomBound;
          if (particle.y > bottomBound) particle.y = topBound;
        } else {
          particle.x += (particle.vx + Math.sin(now * 0.0012 + particle.phase) * 18) * deltaSeconds;
          particle.y += particle.vy * deltaSeconds;
          particle.rotation += particle.spin * deltaSeconds;
          if (particle.y > height + 80 || particle.x < -160 || particle.x > width + 180) {
            const particleAlpha = getParticleSeasonAlpha(particle.season, now);
            const seasonState = getSeasonState();
            const settle = getSeasonSettleState(now);
            const activeSeason = seasonState.transitioning ? seasonState.next : (settle.active ? settle.to : seasonState.current);
            resetParticle(particle, false, particleAlpha > 0.02 && particle.season === activeSeason ? particle.season : activeSeason);
          }
        }
        drawSprite(particle, now);
      });

      drawGround(now, transitionProgress);
      drawTransition(now, transitionProgress);
      animationId = window.requestAnimationFrame(draw);
    };

    spriteKeys.forEach((key) => {
      const image = new window.Image();
      image.onload = () => {
        loadedSprites += 1;
        if (!isDisposed && loadedSprites === spriteKeys.length) {
          resize();
          reconcileParticles();
          lastTime = performance.now();
          animationId = window.requestAnimationFrame(draw);
        }
      };
      image.src = assetPaths[key];
      sprites[key] = image;
    });

    resize();
    window.addEventListener('resize', resize);

    return () => {
      isDisposed = true;
      window.cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, [effects.enabled, intensity]);

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

    const finishDelay = prefersReducedMotion() ? 160 : themeTransitionDurationMs;
    themeBlendRef.current = {
      active: true,
      from: currentMode,
      to: targetMode,
      startedAt: performance.now(),
      duration: finishDelay
    };

    transitionTimerRef.current = window.setTimeout(() => {
      setThemeAttributes(targetMode, targetMode, 'idle');
      nightModeRef.current = targetMode === 'night';
      themeBlendRef.current = {
        active: false,
        from: targetMode,
        to: targetMode,
        startedAt: 0,
        duration: themeTransitionDurationMs
      };
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
    if (seasonSettleTimerRef.current) {
      window.clearTimeout(seasonSettleTimerRef.current);
      seasonSettleTimerRef.current = null;
    }

    const currentSeason = seasonRef.current;
    const target = targetSeason ?? getNextSeason(currentSeason);
    if (target === currentSeason) {
      return;
    }

    isSeasonTransitioningRef.current = true;
    seasonTransitionStartedAtRef.current = performance.now();
    seasonRef.current = currentSeason;
    previousSeasonRef.current = currentSeason;
    nextSeasonRef.current = target;
    seasonGroundLevelsRef.current[currentSeason] = Math.max(seasonGroundLevelsRef.current[currentSeason], 1);
    seasonGroundLevelsRef.current[target] = 0;
    setPreviousSeason(currentSeason);
    setNextSeason(target);
    setIsSeasonTransitioning(true);
    setSeasonAttributes(currentSeason, target, 'active', currentSeason);

    seasonTransitionTimerRef.current = window.setTimeout(() => {
      seasonRef.current = target;
      previousSeasonRef.current = currentSeason;
      nextSeasonRef.current = target;
      isSeasonTransitioningRef.current = false;
      seasonTransitionStartedAtRef.current = 0;
      seasonSettleRef.current = {
        active: true,
        from: currentSeason,
        to: target,
        startedAt: performance.now(),
        duration: prefersReducedMotion() ? 420 : seasonSettleDurationMs
      };
      seasonGroundLevelsRef.current[currentSeason] = 0;
      seasonGroundLevelsRef.current[target] = 1;
      setSeason(target);
      setPreviousSeason(currentSeason);
      setNextSeason(target);
      setIsSeasonTransitioning(false);
      setSeasonAttributes(target, target, 'idle', currentSeason, 'active');
      seasonTransitionTimerRef.current = null;

      seasonSettleTimerRef.current = window.setTimeout(() => {
        seasonRef.current = target;
        previousSeasonRef.current = target;
        nextSeasonRef.current = target;
        seasonSettleRef.current = {
          active: false,
          from: target,
          to: target,
          startedAt: 0,
          duration: seasonSettleDurationMs
        };
        seasonGroundLevelsRef.current[currentSeason] = 0;
        seasonGroundLevelsRef.current[target] = 1;
        setSeason(target);
        setPreviousSeason(target);
        setNextSeason(target);
        setSeasonAttributes(target, target, 'idle', target, 'idle');
        window.localStorage.setItem('xh-season-mode', target);
        seasonSettleTimerRef.current = null;
      }, prefersReducedMotion() ? 420 : seasonSettleDurationMs);
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
  const floatingCover = floatingTrack?.cover || site.heroImage;
  const floatingSubtitle = currentLyric || (isLoading
    ? '音乐电台同步中'
    : floatingTrack
      ? `${floatingTrack.artist} / ${floatingTrack.mood || 'Focus Radio'}`
      : '数据源可维护音乐封面与音频地址');
  const floatingProgress = `${Math.max(3, Math.min(100, progress || 0))}%`;

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

      <canvas
        className="xh-season-vfx-canvas"
        ref={seasonCanvasRef}
        data-season={season}
        data-scene-theme={renderedMode}
        aria-hidden="true"
      />

      <div className="xh-heat-distortion" data-season={season} data-scene-theme={renderedMode} aria-hidden="true" />

      <div className={`xh-theme-transition${isTransitioning ? ' is-active' : ''}`} data-mode={nextMode} data-phase={renderedPhase} aria-hidden="true">
        <span />
        <span />
        <span />
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

      <div className="xh-kirakira-layer" aria-hidden="true">
        {sparkles.map((item) => (
          <i key={item.id} style={{ left: item.left, top: item.top, animationDelay: item.delay }} />
        ))}
      </div>

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
        <span className="xh-theme-switch-kicker">昼夜切换</span>
        <strong>{nightMode ? '\u591c\u8272' : '\u65e5\u95f4'}</strong>
        <small>{isTransitioning ? '\u6e10\u53d8\u4e2d' : nightMode ? '\u70b9\u51fb\u5207\u5230\u65e5\u95f4' : '\u70b9\u51fb\u5207\u5230\u591c\u95f4'}</small>
      </button>

      <button
        className={`xh-season-switch is-${season}${isSeasonTransitioning ? ' is-transitioning' : ''}`}
        type="button"
        aria-label={`\u5207\u6362\u5230\u4e0b\u4e00\u4e2a\u5b63\u8282\uff0c\u5f53\u524d${seasonText.label}`}
        aria-live="polite"
        data-season={season}
        data-next-season={nextSeason}
        data-transitioning={isSeasonTransitioning ? 'true' : 'false'}
        title={isSeasonTransitioning ? `\u5207\u6362\u5230${nextSeasonText.label}` : `${seasonText.label} / ${seasonSummary}`}
        onClick={toggleSeason}
      >
        <span className="xh-season-switch-orbit" aria-hidden="true">
          <b className="xh-season-switch-icon is-current" />
          <b className="xh-season-switch-icon is-next" />
          <i />
          <i />
          <i />
        </span>
        <span className="xh-season-switch-kicker">Season Field</span>
        <strong>{isSeasonTransitioning ? nextSeasonText.label : seasonText.label}</strong>
        <small>{isSeasonTransitioning ? '\u5b63\u8282\u98ce\u573a\u6b63\u5728\u8fc7\u6e21' : seasonSummary}</small>
      </button>

      {effects.floatingCompanion ? <PixelKurisuPet /> : null}

      {!isHome ? (
        <aside
          className="xh-floating-player"
          aria-label="悬浮音乐播放器"
          data-playing={isPlaying ? 'true' : 'false'}
          data-loading={isLoading ? 'true' : 'false'}
        >
          <Link className="xh-floating-player-open" href="/music" aria-label="打开音乐栏目" />
          <span className="xh-floating-player-cover" aria-hidden="true" data-playing={isPlaying ? 'true' : 'false'}>
            <Image src={floatingCover} alt="" width={56} height={56} sizes="56px" />
          </span>
          <div className="xh-floating-player-copy">
            <span>夜航电台</span>
            <strong>{floatingTrack?.title || '\u6b4c\u5355\u5f85\u8865\u5145'}</strong>
            <small>{floatingSubtitle}</small>
          </div>
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
          <div className="xh-floating-player-meter" aria-hidden="true">
            <i style={{ width: floatingProgress }} />
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
