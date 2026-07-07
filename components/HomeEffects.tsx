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

type SeasonalSpriteKey = 'petal' | 'firefly' | 'leafA' | 'leafB' | 'leafC' | 'snow' | 'heat' | 'beam' | 'beamSoft' | 'leafPile' | 'snowbank';

type SeasonalSpriteMap = Partial<Record<SeasonalSpriteKey, HTMLImageElement>>;

type SeasonalVfxParticle = {
  kind: 'petal' | 'firefly' | 'leaf' | 'snow';
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
      beam: '/assets/seasonal/summer-beam.png',
      beamSoft: '/assets/seasonal/summer-beam-soft.png',
      leafPile: '/assets/seasonal/autumn-leaf-pile.png',
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
    const effectStartedAt = performance.now();
    const particles: SeasonalVfxParticle[] = [];
    const transitionStartedAt = isSeasonTransitioning ? performance.now() : 0;

    const randomBetween = (min: number, max: number) => min + Math.random() * (max - min);
    const chooseLeafSprite = (): SeasonalSpriteKey => {
      const roll = Math.random();
      if (roll < 0.42) {
        return 'leafA';
      }
      return roll < 0.82 ? 'leafB' : 'leafC';
    };

    const resetParticle = (particle: SeasonalVfxParticle, initial = false) => {
      const sceneMode = nightMode ? 'night' : 'day';
      particle.phase = randomBetween(0, Math.PI * 2);
      particle.depth = randomBetween(0.68, 1.26);
      particle.rotation = randomBetween(-Math.PI, Math.PI);

      if (season === 'spring' && sceneMode === 'day') {
        particle.kind = 'petal';
        particle.sprite = 'petal';
        particle.size = randomBetween(14, 25) * particle.depth;
        particle.x = randomBetween(-width * 0.12, width * 1.02);
        particle.y = initial ? randomBetween(-height * 0.08, height * 0.92) : randomBetween(-120, -24);
        particle.vx = randomBetween(8, 28) * particle.depth;
        particle.vy = randomBetween(18, 46) * particle.depth;
        particle.spin = randomBetween(-0.9, 1.1);
        particle.alpha = randomBetween(0.5, 0.78);
        return;
      }

      if ((season === 'spring' && sceneMode === 'night') || (season === 'summer' && sceneMode === 'night')) {
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

      if (season === 'autumn') {
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
      particle.size = randomBetween(5, 12) * particle.depth;
      particle.x = randomBetween(-width * 0.08, width * 1.08);
      particle.y = initial ? randomBetween(-height * 0.1, height * 0.92) : randomBetween(-120, -18);
      particle.vx = randomBetween(-8, 12) * particle.depth;
      particle.vy = randomBetween(16, 34) * particle.depth;
      particle.spin = randomBetween(-0.35, 0.35);
      particle.alpha = randomBetween(0.42, 0.78);
    };

    const targetCount = () => {
      if (season === 'summer' && !nightMode) {
        return 0;
      }
      if (season === 'spring' && nightMode) {
        return Math.max(14, Math.round(intensity / 4.4));
      }
      if (season === 'winter') {
        return Math.max(20, Math.round(intensity / 3.2));
      }
      if (season === 'autumn') {
        return Math.max(16, Math.round(intensity / 4));
      }
      return Math.max(16, Math.round(intensity / 4));
    };

    const resize = () => {
      const ratio = window.devicePixelRatio || 1;
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
      if (particles.length > count) {
        particles.splice(count);
      }
      particles.forEach((particle) => {
        if (
          (season === 'summer' && !nightMode)
          || (season === 'spring' && nightMode && particle.kind !== 'firefly')
          || (season === 'spring' && !nightMode && particle.kind !== 'petal')
          || (season === 'autumn' && particle.kind !== 'leaf')
          || (season === 'winter' && particle.kind !== 'snow')
        ) {
          resetParticle(particle, true);
        }
      });
    };

    const drawSprite = (particle: SeasonalVfxParticle, now: number) => {
      const image = sprites[particle.sprite];
      if (!image) {
        return;
      }

      const bob = Math.sin(now * 0.0014 + particle.phase);
      const x = particle.x + bob * 18 * particle.depth;
      const y = particle.y;
      const size = particle.size * (particle.kind === 'leaf' ? 1.18 : 1);
      const alpha = particle.kind === 'firefly'
        ? particle.alpha * (0.58 + Math.sin(now * 0.003 + particle.phase) * 0.28 + 0.28)
        : particle.alpha;

      context.save();
      context.globalAlpha = Math.max(0, Math.min(0.9, alpha));
      context.translate(x, y);
      context.rotate(particle.rotation + Math.sin(now * 0.001 + particle.phase) * 0.38);
      if (particle.kind === 'firefly') {
        context.shadowColor = 'rgba(255, 236, 116, 0.72)';
        context.shadowBlur = size * 1.6;
        context.globalCompositeOperation = 'screen';
      }
      if (particle.kind === 'snow') {
        context.globalCompositeOperation = 'screen';
        context.filter = 'brightness(1.45) saturate(0.5)';
      } else if (particle.kind === 'leaf') {
        context.filter = 'saturate(0.92) brightness(0.96)';
      }
      context.drawImage(image, -size / 2, -size / 2, size, size);
      context.restore();
    };

    const easeOut = (value: number) => 1 - Math.pow(1 - Math.max(0, Math.min(1, value)), 3);

    const drawGrassBlade = (x: number, baseY: number, length: number, lean: number, color: string, alpha: number) => {
      context.save();
      context.globalAlpha = alpha;
      context.strokeStyle = color;
      context.lineWidth = Math.max(0.7, length * 0.035);
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

    const drawSpringGround = (growth: number, now: number, summerFlowers = false) => {
      const groundHeight = Math.min(46, Math.max(26, height * 0.042)) * growth;
      const top = height - groundHeight;
      context.save();
      drawSoftGroundGradient(top, [
        summerFlowers ? 'rgba(95, 178, 92, 0)' : 'rgba(126, 203, 122, 0)',
        summerFlowers ? 'rgba(78, 158, 86, 0.16)' : 'rgba(93, 180, 96, 0.14)',
        summerFlowers ? 'rgba(42, 112, 68, 0.34)' : 'rgba(54, 136, 74, 0.28)'
      ]);
      const step = Math.max(18, width / 96);
      for (let x = -20; x < width + 20; x += step) {
        const seed = Math.sin(x * 12.9898) * 43758.5453;
        const frac = seed - Math.floor(seed);
        const blade = (8 + frac * (summerFlowers ? 18 : 14)) * growth;
        const lean = Math.sin(now * 0.0011 + x * 0.02) * (summerFlowers ? 6 : 4);
        const hue = summerFlowers ? 104 + frac * 36 : 96 + frac * 28;
        drawGrassBlade(x, height + 3, blade, lean, `hsla(${hue}, 44%, ${summerFlowers ? 40 : 46}%, 0.44)`, 0.44);
        if (summerFlowers && frac > 0.88) {
          context.save();
          context.globalAlpha = 0.26 * growth;
          context.fillStyle = frac > 0.94 ? 'rgba(255, 214, 112, 0.58)' : 'rgba(255, 150, 205, 0.48)';
          const flowerY = height - blade - 4;
          context.beginPath();
          context.arc(x + lean, flowerY, 1.2 + frac * 1.4, 0, Math.PI * 2);
          context.fill();
          context.restore();
        }
      }
      context.restore();
    };

    const drawLeafAccumulation = (growth: number) => {
      const pileHeight = Math.min(44, Math.max(22, height * 0.04)) * growth;
      if (pileHeight < 4) {
        return;
      }
      context.save();
      drawSoftGroundGradient(height - pileHeight, [
        'rgba(224, 143, 45, 0)',
        'rgba(186, 92, 38, 0.13)',
        'rgba(82, 42, 24, 0.28)'
      ]);
      if (sprites.leafPile) {
        context.globalAlpha = 0.18 * growth;
        context.filter = nightMode ? 'saturate(0.56) brightness(0.46) blur(0.7px)' : 'saturate(0.72) brightness(0.66) blur(0.45px)';
        context.drawImage(sprites.leafPile, 0, height - pileHeight * 1.12, width, pileHeight * 1.1);
      }
      context.restore();
    };

    const drawSnowAccumulation = (growth: number, melt = 0) => {
      const level = Math.max(0, growth * (1 - melt));
      const snowHeight = Math.min(38, Math.max(20, height * 0.035)) * level;
      if (snowHeight < 3) {
        return;
      }
      const top = height - snowHeight;
      context.save();
      const glow = context.createLinearGradient(0, top - 18, 0, height);
      glow.addColorStop(0, 'rgba(235, 248, 255, 0)');
      glow.addColorStop(0.38, nightMode ? 'rgba(214, 239, 255, 0.18)' : 'rgba(250, 254, 255, 0.28)');
      glow.addColorStop(1, nightMode ? 'rgba(180, 218, 240, 0.42)' : 'rgba(236, 250, 255, 0.5)');
      context.fillStyle = glow;
      context.fillRect(0, top - 18, width, snowHeight + 24);

      context.beginPath();
      context.moveTo(0, top + Math.sin(width * 0.001) * 4);
      for (let x = 0; x <= width; x += 90) {
        const y = top + Math.sin(x * 0.008 + level * 2.4) * 3 + Math.sin(x * 0.021) * 1.6;
        context.lineTo(x, y);
      }
      context.lineTo(width, height);
      context.lineTo(0, height);
      context.closePath();
      context.fillStyle = nightMode ? 'rgba(224, 243, 255, 0.44)' : 'rgba(252, 254, 255, 0.52)';
      context.fill();
      context.strokeStyle = nightMode ? 'rgba(198, 226, 246, 0.24)' : 'rgba(255, 255, 255, 0.34)';
      context.lineWidth = 1;
      context.stroke();
      context.restore();
    };

    const drawGround = (now: number, transitionProgress: number) => {
      const isAutumn = season === 'autumn';
      const isWinter = season === 'winter';
      const growth = easeOut((now - effectStartedAt) / 16000);
      const transitionGrowth = isSeasonTransitioning ? easeOut(transitionProgress) : growth;

      if (season === 'spring') {
        drawSpringGround(growth, now);
      } else if (season === 'summer') {
        drawSpringGround(growth, now, true);
      } else if (isAutumn) {
        drawLeafAccumulation(growth);
      } else if (isWinter) {
        drawSnowAccumulation(growth);
      }

      if (isSeasonTransitioning && nextSeason === 'spring') {
        drawSnowAccumulation(1, transitionGrowth);
        drawSpringGround(transitionGrowth, now);
      } else if (isSeasonTransitioning && nextSeason === 'summer') {
        drawSpringGround(transitionGrowth, now, true);
      } else if (isSeasonTransitioning && nextSeason === 'autumn') {
        drawLeafAccumulation(transitionGrowth);
      } else if (isSeasonTransitioning && nextSeason === 'winter') {
        drawSnowAccumulation(transitionGrowth);
      }
    };

    const drawSummer = (now: number, transitionProgress: number) => {
      if (season !== 'summer' || nightMode) {
        return;
      }

      context.save();
      context.globalCompositeOperation = 'screen';
      const beam = sprites.beam;
      const beamSoft = sprites.beamSoft;
      if (beam && beamSoft) {
        const sway = Math.sin(now * 0.00045) * 22;
        context.globalAlpha = 0.22;
        context.filter = 'blur(2px) saturate(1.28)';
        context.translate(width * 0.18 + sway, -height * 0.08);
        context.rotate(-0.24);
        context.drawImage(beam, -120, 0, width * 0.32, height * 0.84);
        context.setTransform(window.devicePixelRatio || 1, 0, 0, window.devicePixelRatio || 1, 0, 0);
        context.globalAlpha = 0.18;
        context.translate(width * 0.68 - sway, -height * 0.1);
        context.rotate(0.18);
        context.drawImage(beamSoft, -90, 0, width * 0.34, height * 0.78);
      }
      context.restore();

      context.save();
      context.globalAlpha = 0.16 * (1 - transitionProgress * 0.55);
      context.globalCompositeOperation = 'screen';
      context.filter = 'blur(8px) saturate(1.35)';
      const bandHeight = Math.max(170, height * 0.26);
      for (let line = 0; line < 7; line += 1) {
        const y = height * 0.58 + line * 18 + Math.sin(now * 0.0012 + line) * 8;
        const gradient = context.createLinearGradient(0, y, width, y + 28);
        gradient.addColorStop(0, 'rgba(255, 224, 120, 0)');
        gradient.addColorStop(0.5, 'rgba(255, 224, 120, 0.42)');
        gradient.addColorStop(1, 'rgba(84, 199, 184, 0)');
        context.fillStyle = gradient;
        context.fillRect(0, y, width, bandHeight / 12);
      }
      context.restore();
    };

    const drawTransition = (now: number, progress: number) => {
      if (!isSeasonTransitioning) {
        return;
      }

      context.save();
      const pulse = Math.sin(progress * Math.PI);
      context.globalCompositeOperation = 'screen';
      for (let index = 0; index < 12; index += 1) {
        const lane = index / 12;
        const y = height * (0.08 + lane * 0.84) + Math.sin(now * 0.0014 + index) * 14;
        const length = width * (0.16 + pulse * 0.18);
        const x = ((now * (0.08 + index * 0.006) + index * 211) % (width + length)) - length;
        const gradient = context.createLinearGradient(x, y, x + length, y);
        gradient.addColorStop(0, 'rgba(255,255,255,0)');
        gradient.addColorStop(0.5, 'rgba(255,255,255,0.11)');
        gradient.addColorStop(1, 'rgba(255,255,255,0)');
        context.globalAlpha = 0.08 * pulse;
        context.strokeStyle = gradient;
        context.lineWidth = 0.8 + (index % 3) * 0.35;
        context.beginPath();
        context.moveTo(x, y);
        context.lineTo(x + length, y + Math.sin(index) * 7);
        context.stroke();
      }

      context.globalCompositeOperation = 'source-over';
      context.globalAlpha = 0.07 * pulse;
      const band = context.createLinearGradient(0, 0, width, height);
      band.addColorStop(0, 'rgba(126, 217, 255, 0.12)');
      band.addColorStop(0.48, 'rgba(255, 226, 138, 0.08)');
      band.addColorStop(1, 'rgba(255, 143, 199, 0.1)');
      context.fillStyle = band;
      context.fillRect(0, 0, width, height);

      if (previousSeason === 'spring' && nextSeason === 'summer') {
        context.globalAlpha = pulse * 0.14;
        context.strokeStyle = 'rgba(255, 255, 255, 0.38)';
        context.lineWidth = 1.2;
        for (let index = 0; index < 5; index += 1) {
          const y = height * (0.22 + index * 0.12) + Math.sin(now * 0.0018 + index) * 12;
          context.beginPath();
          context.moveTo(-width * 0.06 + progress * width * 0.42, y);
          context.bezierCurveTo(width * 0.18, y - 24, width * 0.48, y + 20, width * (0.76 + progress * 0.16), y - 5);
          context.stroke();
        }
      }

      if (previousSeason === 'summer' && nextSeason === 'autumn') {
        drawSummer(now, progress);
        context.globalAlpha = pulse * 0.08;
        context.fillStyle = 'rgba(210, 120, 54, 0.24)';
        context.fillRect(0, 0, width, height);
      }

      if (previousSeason === 'winter' && nextSeason === 'spring') {
        context.globalAlpha = pulse * 0.12;
        context.fillStyle = 'rgba(255, 170, 206, 0.32)';
        context.fillRect(0, height * 0.74, width, height * 0.26);
      }
      context.restore();
    };

    const draw = (now: number) => {
      const deltaSeconds = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      context.clearRect(0, 0, width, height);
      reconcileParticles();
      const transitionProgress = isSeasonTransitioning
        ? Math.min(1, (now - transitionStartedAt) / seasonTransitionDurationMs)
        : 0;

      drawSummer(now, transitionProgress);

      particles.forEach((particle) => {
        if (particle.kind === 'firefly') {
          particle.x += (particle.vx + Math.sin(now * 0.001 + particle.phase) * 6) * deltaSeconds;
          particle.y += (particle.vy + Math.cos(now * 0.0011 + particle.phase) * 5) * deltaSeconds;
          if (particle.x < -40) particle.x = width + 40;
          if (particle.x > width + 40) particle.x = -40;
          if (particle.y < height * 0.12) particle.y = height * 0.82;
          if (particle.y > height * 0.86) particle.y = height * 0.18;
        } else {
          particle.x += (particle.vx + Math.sin(now * 0.0012 + particle.phase) * 18) * deltaSeconds;
          particle.y += particle.vy * deltaSeconds;
          particle.rotation += particle.spin * deltaSeconds;
          if (particle.y > height + 80 || particle.x < -160 || particle.x > width + 180) {
            resetParticle(particle);
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
  }, [effects.enabled, intensity, isSeasonTransitioning, nextSeason, nightMode, previousSeason, season]);

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
        <span />
        <span />
        <span />
        <span />
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

      {!isHome ? (
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
      ) : null}

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
