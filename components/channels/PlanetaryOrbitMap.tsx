'use client';

import Link from 'next/link';
import { useMemo, useState, type CSSProperties } from 'react';

export type PlanetaryOrbitItem = {
  id: string;
  label: string;
  meta: string;
  detail: string;
  href: string;
  eyebrow?: string;
  heat?: number;
};

type PlanetaryOrbitMapProps = {
  className: string;
  count: number;
  countLabel: string;
  items: PlanetaryOrbitItem[];
  subtitle: string;
  title: string;
  variant: 'tags' | 'moments';
  density?: 'orbit' | 'dense';
};

const planetPalettes = [
  { a: '#8ee7ff', b: '#3866ff', c: '#151a44', land: '#c9fbff', cloud: '#f7feff', glow: '#9eeeff' },
  { a: '#ffd08a', b: '#c76951', c: '#3d1737', land: '#ffe7a7', cloud: '#fff2d4', glow: '#ffe3a3' },
  { a: '#cba6ff', b: '#8459ff', c: '#22154d', land: '#f0d3ff', cloud: '#fff0ff', glow: '#dfc0ff' },
  { a: '#9ef7c8', b: '#2da77c', c: '#0d3446', land: '#d9ffe3', cloud: '#effff6', glow: '#bafbdc' },
  { a: '#ff99c9', b: '#d95393', c: '#401344', land: '#ffd2ee', cloud: '#fff4fb', glow: '#ffc0dc' },
  { a: '#f8f1bf', b: '#9b8e50', c: '#202d4f', land: '#fff8cf', cloud: '#fffdeb', glow: '#fff4b0' },
  { a: '#a9c8ff', b: '#5a7cd8', c: '#121e3f', land: '#dce8ff', cloud: '#f5f8ff', glow: '#c6d8ff' },
  { a: '#ffb18f', b: '#b75c6c', c: '#3b173d', land: '#ffd7a8', cloud: '#fff1dc', glow: '#ffd3b8' }
];

const planetSprites = [
  '/assets/space/kenney-planets/planet00.png',
  '/assets/space/kenney-planets/planet01.png',
  '/assets/space/kenney-planets/planet02.png',
  '/assets/space/kenney-planets/planet03.png',
  '/assets/space/kenney-planets/planet04.png',
  '/assets/space/kenney-planets/planet05.png',
  '/assets/space/kenney-planets/planet06.png',
  '/assets/space/kenney-planets/planet07.png',
  '/assets/space/kenney-planets/planet08.png',
  '/assets/space/kenney-planets/planet09.png'
];

const corePlanetSprites = {
  moments: '/assets/space/kenney-planets/planet08.png',
  tags: '/assets/space/kenney-planets/planet09.png'
} as const;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

const orbitCapacities = [6, 9, 12, 15, 18, 21, 24];
const orbitRingColors = [
  'rgba(179, 216, 255, 0.34)',
  'rgba(255, 225, 151, 0.31)',
  'rgba(187, 154, 255, 0.32)',
  'rgba(127, 239, 210, 0.26)',
  'rgba(255, 163, 210, 0.26)',
  'rgba(255, 245, 184, 0.22)'
];
const PLANETARY_ATLAS_THRESHOLD = 54;

type PlanetaryLayoutMode = 'orbit' | 'atlas';

type OrbitProfile = {
  capacity: number;
  radiusX: number;
  radiusY: number;
  ring: number;
  size: number;
  start: number;
};

function getLayoutMode(total: number): PlanetaryLayoutMode {
  return total > PLANETARY_ATLAS_THRESHOLD ? 'atlas' : 'orbit';
}

function getOrbitCapacity(ring: number) {
  const lastCapacity = orbitCapacities[orbitCapacities.length - 1];
  return orbitCapacities[ring] ?? lastCapacity + (ring - orbitCapacities.length + 1) * 3;
}

function getOrbitProfiles(total: number): OrbitProfile[] {
  const profiles: OrbitProfile[] = [];
  let start = 0;
  let ring = 0;

  while (start < total) {
    const capacity = getOrbitCapacity(ring);
    const size = Math.min(capacity, total - start);

    profiles.push({
      capacity,
      radiusX: 32 + ring * 11.6,
      radiusY: 22 + ring * 8.8,
      ring,
      size,
      start
    });

    start += size;
    ring += 1;
  }

  return profiles;
}

function getCameraProfile(total: number, profiles = getOrbitProfiles(total), layoutMode = getLayoutMode(total)) {
  const outer = profiles[profiles.length - 1];
  const fitScale = outer
    ? Math.min(1, 42 / (outer.radiusX + 10), 38 / (outer.radiusY + 8))
    : 1;
  const cameraScale = layoutMode === 'atlas' ? 1 : clamp(fitScale, 0.46, 1);
  const coreScale = layoutMode === 'atlas'
    ? 0.86
    : clamp(1 - Math.max(0, profiles.length - 1) * 0.045, 0.72, 1);
  const mapHeight = layoutMode === 'atlas'
    ? 360
    : Math.min(1680, 650 + Math.max(1, profiles.length) * 118 + Math.max(0, total - 12) * 8);

  return {
    cameraScale,
    coreScale,
    mapHeight,
    zoom: layoutMode === 'atlas' || profiles.length > 4 || total > 42 ? 'deep' : profiles.length > 3 || total > 24 ? 'far' : profiles.length > 1 || total > 12 ? 'mid' : 'near'
  };
}

function getOrbitSlot(index: number, total: number, profiles = getOrbitProfiles(total)) {
  const profile = profiles.find((candidate) => index >= candidate.start && index < candidate.start + candidate.size) ?? profiles[0];
  const ring = profile?.ring ?? 0;
  const ringSize = Math.max(1, profile?.size ?? total);
  const indexInRing = profile ? index - profile.start : index;
  const singleNodeOffset = ringSize === 1 ? ring * 42 : 0;
  const ringOffset = ring % 2 === 0 ? -8 : 13;
  const angle = -90 + (360 / ringSize) * indexInRing + ringOffset + singleNodeOffset + ring * 3;
  const radians = (angle * Math.PI) / 180;
  const baseSize = total > 48 ? 31 : total > 36 ? 33 : total > 24 ? 36 : total > 12 ? 40 : 46;
  const rawX = 50 + Math.cos(radians) * (profile?.radiusX ?? 29);
  const rawY = 50 + Math.sin(radians) * (profile?.radiusY ?? 19);

  return {
    angle,
    ring,
    x: rawX,
    y: rawY,
    size: clamp(baseSize + ((index + ring) % 4) * 4 - ring * 1.4, 28, 62)
  };
}

function getNodeSide(x: number, y: number) {
  if (x < 18 && y < 60) {
    return 'above';
  }

  if ((x < 50 && y < 26) || (x > 50 && x < 60 && y > 76)) {
    return 'right';
  }

  if (x > 74 || (x > 58 && (y < 34 || y > 66))) {
    return 'left';
  }

  if (x < 28 || (x < 42 && (y < 34 || y > 66))) {
    return 'right';
  }

  if (y < 32) {
    return 'below';
  }

  if (y > 70) {
    return 'above';
  }

  if (x > 62) {
    return 'left';
  }

  if (x < 38) {
    return 'right';
  }

  return y < 50 ? 'below' : 'above';
}

export function PlanetaryOrbitMap({ className, count, countLabel, density = 'orbit', items, subtitle, title, variant }: PlanetaryOrbitMapProps) {
  const [mode, setMode] = useState<'minimal' | 'detail'>('detail');
  const [activeId, setActiveId] = useState<string | null>(items[0]?.id ?? null);
  const layoutMode = getLayoutMode(items.length);
  const orbitProfiles = useMemo(() => getOrbitProfiles(items.length), [items.length]);
  const nodes = useMemo(() => items.map((item, index) => ({
    ...item,
    palette: planetPalettes[index % planetPalettes.length],
    sprite: planetSprites[index % planetSprites.length],
    slot: getOrbitSlot(index, items.length, orbitProfiles)
  })), [items, orbitProfiles]);
  const activeNodeId = nodes.some((item) => item.id === activeId) ? activeId : nodes[0]?.id ?? null;
  const resolvedDensity = layoutMode === 'atlas' || density === 'dense' || items.length > 18 ? 'dense' : 'orbit';
  const camera = getCameraProfile(items.length, orbitProfiles, layoutMode);
  const mapStyle = {
    '--planet-camera-scale': camera.cameraScale.toFixed(3),
    '--planet-core-scale': camera.coreScale.toFixed(3),
    '--planet-core-sprite': `url("${corePlanetSprites[variant]}")`,
    '--planet-map-height': `${camera.mapHeight}px`
  } as CSSProperties;

  return (
    <section
      className={`planetary-orbit-map ${className}`}
      data-density={resolvedDensity}
      data-layout={layoutMode}
      data-mode={mode}
      data-ring-count={orbitProfiles.length}
      data-variant={variant}
      data-zoom={camera.zoom}
      id="xh-outer-frame-removal"
      style={mapStyle}
      aria-label={title}
    >
      <div className="planetary-modebar" aria-label="星图显示模式">
        <span>{variant === 'tags' ? '标签星图' : '动态星图'}</span>
        <div>
          <button className={mode === 'minimal' ? 'is-active' : ''} type="button" onClick={() => setMode('minimal')}>
            极简模式
          </button>
          <button className={mode === 'detail' ? 'is-active' : ''} type="button" onClick={() => setMode('detail')}>
            详细模式
          </button>
        </div>
      </div>

      <div className="planetary-spacefield">
        <div className="planetary-ring-set" aria-hidden="true">
          {orbitProfiles.map((profile) => (
            <span
              data-ring={profile.ring}
              key={profile.ring}
              style={{
                '--planet-ring-color': orbitRingColors[profile.ring % orbitRingColors.length],
                '--planet-ring-delay': `${profile.ring * -0.8}s`,
                '--planet-ring-height': `${profile.radiusY * 2}%`,
                '--planet-ring-opacity': clamp(0.88 - profile.ring * 0.052, 0.46, 0.88).toFixed(2),
                '--planet-ring-rotate': `${profile.ring % 2 === 0 ? -10 - profile.ring * 4 : 12 + profile.ring * 4}deg`,
                '--planet-ring-width': `${profile.radiusX * 2}%`
              } as CSSProperties}
            />
          ))}
        </div>

        <div className="planetary-core" aria-label={`${count} ${countLabel}`}>
          <span className="planetary-core-texture" aria-hidden="true" />
          <small>{subtitle}</small>
          <strong>{count}</strong>
          <span>{countLabel}</span>
        </div>

        <div className="planetary-node-layer" aria-label={`${title} 小星球`}>
          {nodes.map((item, index) => {
            const style = {
              '--planet-a': item.palette.a,
              '--planet-b': item.palette.b,
              '--planet-c': item.palette.c,
              '--planet-cloud': item.palette.cloud,
              '--planet-glow': item.palette.glow,
              '--planet-index': index,
              '--planet-land': item.palette.land,
              '--planet-size': `${item.slot.size}px`,
              '--planet-sprite': `url("${item.sprite}")`,
              '--planet-x': `${item.slot.x}%`,
              '--planet-y': `${item.slot.y}%`,
              '--planet-angle': `${item.slot.angle}deg`,
              '--planet-delay': `${index * 72}ms`,
              '--planet-float': `${6 + (index % 4) * 0.7}s`,
              '--planet-phase': `${index * -0.55}s`,
              '--planet-ring-tilt': `${item.slot.angle * -0.14}deg`,
              '--planet-ring': item.slot.ring,
              '--planet-spin': `${13 + (index % 6) * 2.4}s`
            } as CSSProperties;
            const content = (
              <>
                <span className="planetary-mini-planet" aria-hidden="true">
                  <i className="planetary-mini-ring" />
                  <b className="planetary-mini-atmosphere" />
                  <b className="planetary-mini-terrain" />
                  <b className="planetary-mini-clouds" />
                  <b className="planetary-mini-shine" />
                </span>
                <span className="planetary-node-info">
                  <small>{item.eyebrow ?? String(index + 1).padStart(2, '0')}</small>
                  <strong>{item.label}</strong>
                  <em>{item.meta}</em>
                  <span>{item.detail}</span>
                </span>
              </>
            );
            const interactionProps = {
              'aria-current': activeNodeId === item.id ? 'true' as const : undefined,
              'data-active': activeNodeId === item.id ? 'true' : 'false',
              onClick: () => setActiveId(item.id),
              onFocus: () => setActiveId(item.id),
              onMouseEnter: () => setActiveId(item.id)
            };

            if (item.href.startsWith('/')) {
              return (
                <Link
                  className={`planetary-node heat-${item.heat ?? 1}`}
                  href={item.href}
                  key={item.id}
                  style={style}
                  data-side={getNodeSide(item.slot.x, item.slot.y)}
                  aria-label={`${item.label}，${item.meta}，${item.detail}`}
                  {...interactionProps}
                >
                  {content}
                </Link>
              );
            }

            return (
              <a
                className={`planetary-node heat-${item.heat ?? 1}`}
                href={item.href}
                key={item.id}
                style={style}
                data-side={getNodeSide(item.slot.x, item.slot.y)}
                aria-label={`${item.label}，${item.meta}，${item.detail}`}
                {...interactionProps}
              >
                {content}
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
