'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { BlogSite } from '@/lib/blog';

type ThemeMode = 'day' | 'night';
type ThemePhase = ThemeMode | 'dusk' | 'dawn';
type Season = 'spring' | 'summer' | 'autumn' | 'winter';

const BACKGROUND_SLIDE_INTERVAL_MS = 9000;
const BACKGROUND_FADE_MS = 1800;
const THEME_TRANSITION_RETRY_MS = 700;

const motes = Array.from({ length: 22 }, (_item, index) => ({
  id: `mote-${index}`,
  left: `${(index * 19 + 7) % 100}%`,
  top: `${(index * 31 + 11) % 100}%`,
  delay: `${(index % 9) * -0.74}s`,
  size: `${2 + (index % 4)}px`
}));

const rain = Array.from({ length: 34 }, (_item, index) => ({
  id: `glass-rain-${index}`,
  left: `${(index * 11 + 3) % 100}%`,
  delay: `${(index % 13) * -0.18}s`,
  height: `${38 + (index % 5) * 12}px`
}));

function uniqueImages(values: Array<string | undefined>): string[] {
  const seen = new Set<string>();
  return values
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value))
    .filter((value) => {
      if (seen.has(value)) {
        return false;
      }
      seen.add(value);
      return true;
    });
}

function getThemeMode(): ThemeMode {
  if (typeof document === 'undefined') {
    return 'day';
  }
  return document.documentElement.dataset.xhTheme === 'night' ? 'night' : 'day';
}

function getThemePhase(): ThemePhase {
  if (typeof document === 'undefined') {
    return 'day';
  }
  const phase = document.documentElement.dataset.xhThemePhase;
  return phase === 'dusk' || phase === 'dawn' || phase === 'night' ? phase : 'day';
}

function parseSeason(value: string | null | undefined): Season | null {
  return value === 'spring' || value === 'summer' || value === 'autumn' || value === 'winter' ? value : null;
}

function getSeason(): Season {
  if (typeof document === 'undefined') {
    return 'spring';
  }
  const root = document.documentElement;
  const isSeasonTransitioning = root.dataset.xhSeasonTransition === 'active';
  const currentSeason = parseSeason(root.dataset.xhSeason) ?? 'spring';
  const nextSeason = parseSeason(root.dataset.xhSeasonNext);

  return isSeasonTransitioning && nextSeason ? nextSeason : currentSeason;
}

function getVisibleThemeMode(): ThemeMode {
  if (typeof document === 'undefined') {
    return 'day';
  }
  return getThemeMode();
}

function isThemeTransitionActive(): boolean {
  if (typeof document === 'undefined') {
    return false;
  }
  return document.documentElement.dataset.xhThemeTransition === 'active';
}

function decodeBackgroundImage(src: string): Promise<void> {
  return new Promise((resolve) => {
    const image = new window.Image();

    const markReady = () => {
      const decode = image.decode?.();
      if (decode) {
        decode.then(() => resolve()).catch(() => resolve());
        return;
      }
      resolve();
    };

    image.onload = markReady;
    image.onerror = () => resolve();
    image.src = src;

    if (image.complete) {
      markReady();
    }
  });
}

export function BackgroundSlider({ site }: { site: BlogSite }) {
  const images = useMemo(() => {
    return uniqueImages(site.backgroundImages ?? []);
  }, [site.backgroundImages]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [exitingIndex, setExitingIndex] = useState<number | null>(null);
  const [themeMode, setThemeMode] = useState<ThemeMode>('day');
  const [themePhase, setThemePhase] = useState<ThemePhase>('day');
  const [season, setSeason] = useState<Season>('spring');
  const [themeTransitionActive, setThemeTransitionActive] = useState(false);
  const activeIndexRef = useRef(0);
  const themeTransitionActiveRef = useRef(false);
  const readyImagesRef = useRef<Set<string>>(new Set());
  const pendingImagesRef = useRef<Map<string, Promise<void>>>(new Map());

  const prepareImage = useCallback((image: string) => {
    if (readyImagesRef.current.has(image)) {
      return Promise.resolve();
    }

    const pending = pendingImagesRef.current.get(image);
    if (pending) {
      return pending;
    }

    const promise = decodeBackgroundImage(image).finally(() => {
      readyImagesRef.current.add(image);
      pendingImagesRef.current.delete(image);
    });

    pendingImagesRef.current.set(image, promise);
    return promise;
  }, []);

  useEffect(() => {
    const syncThemeState = () => {
      setThemeMode(getVisibleThemeMode());
      setThemePhase(getThemePhase());
      setSeason(getSeason());
      const transitionActive = isThemeTransitionActive();
      themeTransitionActiveRef.current = transitionActive;
      setThemeTransitionActive(transitionActive);

      if (transitionActive) {
        setExitingIndex(null);
      }
    };

    syncThemeState();

    const observer = new MutationObserver(() => {
      syncThemeState();
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-xh-theme', 'data-xh-theme-next', 'data-xh-theme-transition', 'data-xh-theme-phase', 'data-xh-season', 'data-xh-season-previous', 'data-xh-season-transition', 'data-xh-season-settle']
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  useEffect(() => {
    setActiveIndex((index) => {
      const nextIndex = images.length === 0 ? 0 : Math.min(index, images.length - 1);
      activeIndexRef.current = nextIndex;
      return nextIndex;
    });
    setExitingIndex(null);
    readyImagesRef.current = new Set();
    pendingImagesRef.current = new Map();
    const currentImage = images[activeIndexRef.current];
    const nextImage = images[(activeIndexRef.current + 1) % images.length];
    if (currentImage) {
      void prepareImage(currentImage);
    }
    if (nextImage && nextImage !== currentImage) {
      void prepareImage(nextImage);
    }
  }, [images, prepareImage]);

  useEffect(() => {
    if (images.length <= 1 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return undefined;
    }

    let cancelled = false;
    let timer: number | null = null;

    const scheduleNextSlide = (delay = BACKGROUND_SLIDE_INTERVAL_MS) => {
      timer = window.setTimeout(async () => {
        if (themeTransitionActiveRef.current) {
          scheduleNextSlide(THEME_TRANSITION_RETRY_MS);
          return;
        }

        const currentIndex = activeIndexRef.current;
        const nextIndex = (currentIndex + 1) % images.length;
        await prepareImage(images[nextIndex]);

        if (cancelled) {
          return;
        }

        if (themeTransitionActiveRef.current) {
          scheduleNextSlide(THEME_TRANSITION_RETRY_MS);
          return;
        }

        setExitingIndex(currentIndex);
        setActiveIndex(nextIndex);
        activeIndexRef.current = nextIndex;

        const nextPreloadIndex = (nextIndex + 1) % images.length;
        void prepareImage(images[nextPreloadIndex]);
        scheduleNextSlide();
      }, delay);
    };

    scheduleNextSlide();

    return () => {
      cancelled = true;
      if (timer !== null) {
        window.clearTimeout(timer);
      }
    };
  }, [images, prepareImage]);

  useEffect(() => {
    if (exitingIndex === null) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setExitingIndex(null);
    }, BACKGROUND_FADE_MS);

    return () => window.clearTimeout(timer);
  }, [exitingIndex]);

  if (images.length === 0) {
    return null;
  }

  return (
    <div className={`xh-background-slider ib-scene-shell is-${themeMode} is-phase-${themePhase} is-season-${season}${themeTransitionActive ? ' is-theme-transitioning' : ''}`} aria-hidden="true" data-scene-theme={themeMode} data-scene-phase={themePhase} data-scene-season={season} data-theme-transitioning={themeTransitionActive ? 'true' : 'false'} data-loading-scene="ready">
      <div className="ib-stage">
        {images.map((image, index) => (
          <span
            className={`xh-background-image ib-scene-texture${index === activeIndex ? ' is-active' : ''}${!themeTransitionActive && index === exitingIndex && index !== activeIndex ? ' is-exiting' : ''}`}
            style={{ '--bg-image': `url("${image}")` } as CSSProperties}
            key={image}
          />
        ))}

        <div className="ib-scene ib-scene-day">
          <div className="ib-sky-field" />
          <div className="ib-day-bloom" />
        </div>

        <div className="ib-scene ib-scene-night">
          <div className="ib-star-field" />
          <div className="ib-night-bloom" />
        </div>

        <div className="ib-season-sky" />

        <div className="ib-season-landscape">
          <span />
          <span />
          <span />
        </div>

        <div className="ib-season-glow">
          <span />
          <span />
          <span />
        </div>

        <div className="ib-light-beams">
          <span />
          <span />
          <span />
        </div>

        <div className="ib-rain-layer">
          {rain.map((drop) => (
            <i
              key={drop.id}
              style={{
                '--rain-left': drop.left,
                '--rain-delay': drop.delay,
                '--rain-height': drop.height
              } as CSSProperties}
            />
          ))}
        </div>

        <div className="ib-dust-field">
          {motes.map((mote) => (
            <i
              key={mote.id}
              style={{
                left: mote.left,
                top: mote.top,
                width: mote.size,
                height: mote.size,
                animationDelay: mote.delay
              }}
            />
          ))}
        </div>

        <div className="ib-transition-wipe" />
        <div className="ib-horizon-glow" />
        <i className="ib-scene-vignette" />
      </div>
    </div>
  );
}
