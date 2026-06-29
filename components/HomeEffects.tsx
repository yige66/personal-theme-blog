'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import type { CSSProperties, MouseEvent } from 'react';
import type { BlogNote, BlogPost, BlogSite, MusicTrack } from '@/lib/blog';

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
  '今天也有认真更新',
  'BGM 正在循环中',
  '路过打卡，晚点再来看',
  '这张封面有点心动',
  '相册区适合慢慢逛',
  '写完这篇就去听歌',
  '评论区先留个脚印',
  '灵感刚刚冒泡',
  '夜间模式适合发呆',
  '把日常收进时间线',
  '照片墙等你上传新图',
  '今天也要温柔一点'
];

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

export function HomeEffects({ site, posts, notes, activeTrack }: HomeEffectsProps) {
  const pathname = usePathname();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const transitionTimerRef = useRef<number | null>(null);
  const [nightMode, setNightMode] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const effects = site.effects;
  const intensity = Math.max(20, Math.min(100, effects.intensity || 72));
  const isHome = pathname === '/';

  const messages = useMemo(() => {
    const configured = effects.danmaku && effects.danmaku.length > 0 ? effects.danmaku : dailyDanmaku;
    const postTitles = posts.slice(0, 3).map((post) => `正在读：${post.title}`);
    const noteLines = notes.slice(0, 2).map((note) => note.title || note.content);
    return uniqueMessages([...configured, ...dailyDanmaku, ...postTitles, ...noteLines, site.status]);
  }, [effects.danmaku, notes, posts, site.status]);

  const fireflies = useMemo(() => Array.from({ length: Math.round(intensity / 9) }, (_item, index) => ({
    id: `firefly-${index}`,
    left: `${(index * 17 + 9) % 100}%`,
    top: `${(index * 29 + 14) % 82}%`,
    delay: `${(index % 8) * 0.62}s`,
    duration: `${7 + (index % 6)}s`
  })), [intensity]);

  const petals = useMemo(() => Array.from({ length: Math.round(intensity / 10) }, (_item, index) => ({
    id: `petal-${index}`,
    left: `${(index * 23 + 4) % 100}%`,
    delay: `${(index % 10) * 0.72}s`,
    duration: `${10 + (index % 7)}s`
  })), [intensity]);

  const sparkles = useMemo(() => Array.from({ length: 10 }, (_item, index) => ({
    id: `sparkle-${index}`,
    left: `${(index * 19 + 11) % 100}%`,
    top: `${(index * 31 + 8) % 88}%`,
    delay: `${(index % 6) * 0.54}s`
  })), []);

  const rainDrops = useMemo(() => Array.from({ length: Math.round(intensity / 4) }, (_item, index) => ({
    id: `rain-${index}`,
    left: `${(index * 13 + 7) % 100}%`,
    delay: `${(index % 12) * -0.22}s`,
    duration: `${0.82 + (index % 7) * 0.08}s`,
    height: `${38 + (index % 6) * 8}px`
  })), [intensity]);

  useEffect(() => {
    const savedMode = window.localStorage.getItem('xh-theme-mode');
    if (savedMode) {
      setNightMode(savedMode === 'night');
      return;
    }

    const hour = new Date().getHours();
    setNightMode(hour >= 18 || hour < 6);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.xhTheme = nightMode ? 'night' : 'day';
    document.documentElement.dataset.xhThemeTransition = isTransitioning ? 'active' : 'idle';
    window.localStorage.setItem('xh-theme-mode', nightMode ? 'night' : 'day');
  }, [isTransitioning, nightMode]);

  useEffect(() => () => {
    if (transitionTimerRef.current) {
      window.clearTimeout(transitionTimerRef.current);
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

  const toggleTheme = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (transitionTimerRef.current) {
      window.clearTimeout(transitionTimerRef.current);
    }

    setIsTransitioning(true);
    setNightMode((value) => !value);
    transitionTimerRef.current = window.setTimeout(() => {
      setIsTransitioning(false);
      document.documentElement.dataset.xhThemeTransition = 'idle';
    }, 1250);
  };

  if (!effects.enabled) {
    return null;
  }

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

      <div className={`xh-theme-transition${isTransitioning ? ' is-active' : ''}`} data-mode={nightMode ? 'night' : 'day'} aria-hidden="true">
        <span />
        <span />
        <span />
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
        <div className="xh-danmaku-layer" aria-label="站点弹幕">
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

      {effects.fireflies ? (
        <div className="xh-firefly-layer" aria-hidden="true">
          {fireflies.map((item) => (
            <i key={item.id} style={{ left: item.left, top: item.top, animationDelay: item.delay, animationDuration: item.duration }} />
          ))}
        </div>
      ) : null}

      {effects.petals ? (
        <div className="xh-petal-layer" aria-hidden="true">
          {petals.map((item) => (
            <i key={item.id} style={{ left: item.left, animationDelay: item.delay, animationDuration: item.duration }} />
          ))}
        </div>
      ) : null}

      {effects.grass ? <div className="xh-grass-layer" aria-hidden="true" /> : null}

      <div className="xh-kirakira-layer" aria-hidden="true">
        {sparkles.map((item) => (
          <i key={item.id} style={{ left: item.left, top: item.top, animationDelay: item.delay }} />
        ))}
      </div>

      <button
        className={`xh-theme-switch${isHome ? ' is-home' : ''}${isTransitioning ? ' is-transitioning' : ''}`}
        type="button"
        aria-pressed={nightMode}
        aria-live="polite"
        data-transitioning={isTransitioning ? 'true' : 'false'}
        onClick={toggleTheme}
      >
        <span>{nightMode ? 'Moonlit Scene' : 'Prism Day'}</span>
        <strong>{nightMode ? '夜色场景' : '晨光场景'}</strong>
        <small>{isTransitioning ? '场景转换中' : nightMode ? '雨幕与微光' : '晴空与虹影'}</small>
      </button>

      {!isHome ? (
        <aside className="xh-floating-player" aria-label="悬浮音乐状态">
          <span>Cloud Music</span>
          <strong>{activeTrack?.title || '歌单待补全'}</strong>
          <small>{activeTrack ? `${activeTrack.artist} / ${activeTrack.mood}` : '后台可维护音乐封面与音频地址'}</small>
        </aside>
      ) : null}

      {effects.floatingCompanion ? (
        <div className="xh-floating-companion" aria-label={`${site.assistantName} 浮动状态`}>
          <span>{site.assistantName.slice(0, 1)}</span>
          <strong>{site.assistantName}</strong>
        </div>
      ) : null}

      <canvas className="xh-click-canvas" ref={canvasRef} aria-hidden="true" />
    </>
  );
}
