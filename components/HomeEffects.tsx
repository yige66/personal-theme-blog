'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { BlogNote, BlogPost, BlogSite, MusicTrack } from '@/lib/blog';

type HomeEffectsProps = {
  site: BlogSite;
  posts: BlogPost[];
  notes: BlogNote[];
  activeTrack?: MusicTrack;
};

function uniqueMessages(values: string[]): string[] {
  const seen = new Set<string>();
  return values.map((item) => item.trim()).filter((item) => {
    if (!item || seen.has(item)) {
      return false;
    }
    seen.add(item);
    return true;
  }).slice(0, 18);
}

function isMotionReduced(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function HomeEffects({ site, posts, notes, activeTrack }: HomeEffectsProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [nightMode, setNightMode] = useState(false);
  const effects = site.effects;
  const intensity = Math.max(20, Math.min(100, effects.intensity || 72));

  const messages = useMemo(() => uniqueMessages([
    ...(effects.danmaku || []),
    site.status,
    ...notes.slice(0, 5).map((note) => note.title || note.content),
    ...posts.slice(0, 5).map((post) => post.title)
  ]), [effects.danmaku, notes, posts, site.status]);

  const fireflies = useMemo(() => Array.from({ length: Math.round(intensity / 8) }, (_item, index) => ({
    id: `firefly-${index}`,
    left: `${(index * 17 + 9) % 100}%`,
    top: `${(index * 29 + 14) % 82}%`,
    delay: `${(index % 8) * 0.62}s`,
    duration: `${7 + (index % 6)}s`
  })), [intensity]);

  const petals = useMemo(() => Array.from({ length: Math.round(intensity / 9) }, (_item, index) => ({
    id: `petal-${index}`,
    left: `${(index * 23 + 4) % 100}%`,
    delay: `${(index % 10) * 0.72}s`,
    duration: `${10 + (index % 7)}s`
  })), [intensity]);

  const sparkles = useMemo(() => Array.from({ length: 12 }, (_item, index) => ({
    id: `sparkle-${index}`,
    left: `${(index * 19 + 11) % 100}%`,
    top: `${(index * 31 + 8) % 88}%`,
    delay: `${(index % 6) * 0.54}s`
  })), []);

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
    window.localStorage.setItem('xh-theme-mode', nightMode ? 'night' : 'day');
  }, [nightMode]);

  useEffect(() => {
    if (!effects.enabled || !effects.cursorTrail || isMotionReduced()) {
      return undefined;
    }

    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) {
      return undefined;
    }

    const particles: Array<{ x: number; y: number; life: number; hue: number; size: number }> = [];
    let frame = 0;
    let animationId = 0;

    const resize = () => {
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.floor(window.innerWidth * ratio);
      canvas.height = Math.floor(window.innerHeight * ratio);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const handlePointerMove = (event: PointerEvent) => {
      frame += 1;
      if (frame % 2 !== 0) {
        return;
      }
      particles.push({
        x: event.clientX,
        y: event.clientY,
        life: 1,
        hue: 148 + Math.random() * 42,
        size: 2 + Math.random() * 4
      });
      if (particles.length > 90) {
        particles.splice(0, particles.length - 90);
      }
    };

    const draw = () => {
      context.clearRect(0, 0, window.innerWidth, window.innerHeight);
      for (let index = particles.length - 1; index >= 0; index -= 1) {
        const particle = particles[index];
        particle.life -= 0.026;
        particle.y -= 0.36;
        particle.x += Math.sin(particle.life * 9) * 0.24;

        if (particle.life <= 0) {
          particles.splice(index, 1);
          continue;
        }

        context.beginPath();
        context.fillStyle = `hsla(${particle.hue}, 78%, 72%, ${particle.life})`;
        context.shadowColor = `hsla(${particle.hue}, 78%, 60%, ${particle.life})`;
        context.shadowBlur = 14;
        context.arc(particle.x, particle.y, particle.size * particle.life, 0, Math.PI * 2);
        context.fill();
      }
      animationId = window.requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', handlePointerMove, { passive: true });

    return () => {
      window.cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', handlePointerMove);
    };
  }, [effects.cursorTrail, effects.enabled]);

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

      {messages.length > 0 ? (
        <div className="xh-danmaku-layer" aria-label="首页弹幕">
          {messages.map((message, index) => (
            <span
              className="xh-danmaku-item"
              style={{
                '--lane': index % 6,
                '--delay': `${index * -1.45}s`,
                '--speed': `${18 + (index % 5) * 2}s`
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
            <i
              key={item.id}
              style={{ left: item.left, top: item.top, animationDelay: item.delay, animationDuration: item.duration }}
            />
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
          <i key={item.id} style={{ left: item.left, top: item.top, animationDelay: item.delay }}>✦</i>
        ))}
      </div>

      <button className="xh-theme-switch" type="button" aria-pressed={nightMode} onClick={() => setNightMode((value) => !value)}>
        <span>{nightMode ? 'Firefly Night' : 'Sakura Day'}</span>
        <strong>{nightMode ? '夜间模式' : '樱花日间'}</strong>
        <small>{nightMode ? '流萤飞舞的深空' : '粉白花瓣的晴空'}</small>
      </button>

      <aside className="xh-floating-player" aria-label="悬浮音乐状态">
        <span>Cloud Music</span>
        <strong>{activeTrack?.title || '歌单待添加'}</strong>
        <small>{activeTrack ? `${activeTrack.artist} / ${activeTrack.mood}` : '后台可维护音乐封面与音频地址'}</small>
      </aside>

      {effects.floatingCompanion ? (
        <div className="xh-floating-companion" aria-label={`${site.assistantName} 浮动状态`}>
          <span>✦</span>
          <strong>{site.assistantName}</strong>
        </div>
      ) : null}

      {effects.cursorTrail ? <canvas className="xh-cursor-canvas" ref={canvasRef} aria-hidden="true" /> : null}
    </>
  );
}
