'use client';

import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import type { BlogSite } from '@/lib/blog';

type ThemeMode = 'day' | 'night';

const motes = Array.from({ length: 22 }, (_item, index) => ({
  id: `mote-${index}`,
  left: `${(index * 19 + 7) % 100}%`,
  top: `${(index * 31 + 11) % 100}%`,
  delay: `${(index % 9) * -0.74}s`,
  size: `${2 + (index % 4)}px`
}));

const panes = Array.from({ length: 8 }, (_item, index) => `pane-${index}`);
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
    })
    .slice(0, 7);
}

function getThemeMode(): ThemeMode {
  if (typeof document === 'undefined') {
    return 'day';
  }
  return document.documentElement.dataset.xhTheme === 'night' ? 'night' : 'day';
}

export function BackgroundSlider({ site }: { site: BlogSite }) {
  const images = useMemo(() => {
    const galleryImages = site.gallery.flatMap((item) => [
      item.image,
      ...(item.items?.map((child) => child.image) ?? [])
    ]);
    return uniqueImages([site.heroImage, ...galleryImages, site.avatar]);
  }, [site.avatar, site.gallery, site.heroImage]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [themeMode, setThemeMode] = useState<ThemeMode>('day');

  useEffect(() => {
    setThemeMode(getThemeMode());

    const observer = new MutationObserver(() => {
      setThemeMode(getThemeMode());
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-xh-theme']
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (images.length <= 1 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % images.length);
    }, 9000);

    return () => window.clearInterval(timer);
  }, [images.length]);

  if (images.length === 0) {
    return null;
  }

  return (
    <div className={`xh-background-slider ib-scene-shell is-${themeMode}`} aria-hidden="true" data-scene-theme={themeMode} data-loading-scene="ready">
      <div className="ib-stage">
        {images.map((image, index) => (
          <span
            className={`xh-background-image ib-scene-texture${index === activeIndex ? ' is-active' : ''}`}
            style={{ '--bg-image': `url("${image}")` } as CSSProperties}
            key={image}
          />
        ))}

        <div className="ib-scene ib-scene-day">
          <div className="ib-sky-field" />
          <div className="ib-window-grid" aria-hidden="true">
            {panes.map((pane) => <span key={pane} />)}
          </div>
          <div className="ib-desk-line" />
          <div className="ib-day-bloom" />
        </div>

        <div className="ib-scene ib-scene-night">
          <div className="ib-star-field" />
          <div className="ib-moon-halo" />
          <div className="ib-window-grid" aria-hidden="true">
            {panes.map((pane) => <span key={`night-${pane}`} />)}
          </div>
          <div className="ib-desk-line" />
          <div className="ib-night-bloom" />
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

        <div className="ib-crystal-glow">
          <span />
          <span />
        </div>
        <div className="ib-candle-row">
          <span />
          <span />
          <span />
        </div>
        <div className="ib-transition-wipe" />
        <div className="ib-horizon-glow" />
        <div className="ib-glass-refraction" />
        <i className="ib-scene-vignette" />
      </div>
    </div>
  );
}
