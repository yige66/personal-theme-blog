'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { PlanetaryOrbitMap, type PlanetaryOrbitItem } from '@/components/channels/PlanetaryOrbitMap';
import { MomentComments } from '@/components/comments/MomentComments';
import type { BlogNote, CommentConfig } from '@/lib/blog';

const allMood = '全部';
const minZoomScale = 0.5;
const maxZoomScale = 3;
const zoomStep = 0.25;

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
}

function noteImages(note: BlogNote): string[] {
  if (note.images?.length) {
    return note.images.slice(0, 6);
  }

  return [];
}

type MomentsBoardProps = {
  authorName: string;
  avatar?: string;
  comments: CommentConfig;
  notes: BlogNote[];
};

type MomentLightboxState = {
  images: string[];
  index: number;
  title: string;
};

export function MomentsBoard({ authorName, avatar, comments, notes }: MomentsBoardProps) {
  const [query, setQuery] = useState('');
  const [activeMood, setActiveMood] = useState(allMood);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const displayName = authorName.trim() || '博客作者';
  const displayAvatar = avatar || '/assets/img/avatar-orbit.svg';
  const [lightbox, setLightbox] = useState<MomentLightboxState | null>(null);
  const [zoomScale, setZoomScale] = useState(1);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const lightboxRef = useRef<HTMLDivElement | null>(null);
  const lightboxOpen = lightbox !== null;
  const lightboxImageCount = lightbox?.images.length ?? 0;

const resetZoom = useCallback(() => setZoomScale(1), []);
  const zoomIn = useCallback(() => setZoomScale((current) => Math.min(maxZoomScale, current + zoomStep)), []);
  const zoomOut = useCallback(() => setZoomScale((current) => Math.max(minZoomScale, current - zoomStep)), []);
  const closeLightbox = useCallback(() => {
    setLightbox(null);
    resetZoom();
  }, [resetZoom]);
  const showPreviousImage = useCallback(() => {
    setLightbox((current) => current ? {
      ...current,
      index: (current.index - 1 + current.images.length) % current.images.length
    } : current);
    resetZoom();
  }, [resetZoom]);
  const showNextImage = useCallback(() => {
    setLightbox((current) => current ? {
      ...current,
      index: (current.index + 1) % current.images.length
    } : current);
    resetZoom();
  }, [resetZoom]);

  useEffect(() => {
    if (!lightboxOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeLightbox();
        return;
      }
      if (event.key === 'ArrowLeft' && lightboxImageCount > 1) {
        event.preventDefault();
        showPreviousImage();
        return;
      }
      if (event.key === 'ArrowRight' && lightboxImageCount > 1) {
        event.preventDefault();
        showNextImage();
        return;
      }
      if ((event.key === '+' || event.key === '=') && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        zoomIn();
        return;
      }
      if ((event.key === '-' || event.key === '_') && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        zoomOut();
        return;
      }
      if (event.key === '0' && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        resetZoom();
        return;
      }
      if (event.key !== 'Tab') {
        return;
      }

      const focusable = Array.from(lightboxRef.current?.querySelectorAll<HTMLElement>('button, [href], [tabindex]:not([tabindex="-1"])') ?? [])
        .filter((element) => !element.hasAttribute('disabled'));
      if (focusable.length === 0) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!lightboxRef.current?.contains(document.activeElement)) {
        event.preventDefault();
        first.focus();
        return;
      }
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [closeLightbox, lightboxImageCount, lightboxOpen, resetZoom, showNextImage, showPreviousImage, zoomIn, zoomOut]);


  const moods = useMemo(
    () => [allMood, ...Array.from(new Set(notes.map((note) => note.mood).filter(Boolean))) as string[]],
    [notes]
  );
  const filteredNotes = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return notes
      .filter((note) => {
        const matchesMood = activeMood === allMood || note.mood === activeMood;
        const searchable = `${note.title || ''} ${note.content} ${note.mood ?? ''}`.toLowerCase();
        const matchesQuery = !keyword || searchable.includes(keyword);
        return matchesMood && matchesQuery;
      })
      .sort((a, b) => {
        const left = new Date(a.date).getTime();
        const right = new Date(b.date).getTime();
        return sortOrder === 'desc' ? right - left : left - right;
      });
  }, [activeMood, notes, query, sortOrder]);
  const orbitItems = useMemo<PlanetaryOrbitItem[]>(() => filteredNotes.map((note, index) => ({
    id: note.id,
    eyebrow: String(index + 1).padStart(2, '0'),
    label: note.title || note.mood || '日常碎片',
    meta: formatDate(note.date).slice(0, 10),
    detail: note.content,
    href: `#moment-${note.id}`,
    heat: note.mood ? 2 : 1
  })), [filteredNotes]);

  return (
    <section className="main-shell moments-board moments-starchart xh-reference-surface" aria-label="说说动态频道">
      <div className="moments-board-toolbar xh-reference-toolbar">
        <label>
          <span>Search</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索动态..." />
        </label>
        <div className="moments-mood-filter" aria-label="心情筛选">
          {moods.map((mood) => (
            <button className={activeMood === mood ? 'is-active' : ''} type="button" onClick={() => setActiveMood(mood)} key={mood}>
              {mood}
            </button>
          ))}
        </div>
        <div className="moments-sort-toggle" aria-label="排序方式">
          <button className={sortOrder === 'desc' ? 'is-active' : ''} type="button" onClick={() => setSortOrder('desc')}>最新</button>
          <button className={sortOrder === 'asc' ? 'is-active' : ''} type="button" onClick={() => setSortOrder('asc')}>最早</button>
        </div>
      </div>

      <PlanetaryOrbitMap
        className="moment-constellation"
        count={filteredNotes.length}
        countLabel="moments"
        items={orbitItems}
        subtitle="Moment Planet"
        title="动态星图"
        variant="moments"
      />

      <div className="moments-stream">
        {filteredNotes.map((note, index) => {
          const images = noteImages(note);
          return (
            <article className="moment-post" id={`moment-${note.id}`} key={note.id}>
              <header>
                <span className="moment-avatar">
                  <Image src={displayAvatar} alt="" width={64} height={64} />
                </span>
                <span>
                  <strong>{displayName}</strong>
                  <time>{formatDate(note.date)}</time>
                </span>
              </header>
              {note.title ? <h3>{note.title}</h3> : null}
              <p>{note.content}</p>
              {images.length ? (
                <div className={`moment-image-grid count-${images.length}`} aria-label="动态配图">
                  {images.map((src, imageIndex) => (
                    <button
                      type="button"
                      id={`moment-image-${note.id}-${imageIndex}`}
                      aria-label={`放大查看 ${note.title || '动态'} 的第 ${imageIndex + 1} 张配图`}
                      onClick={() => {
                        setLightbox({ images, index: imageIndex, title: note.title || `动态 ${index + 1}` });
                      }}
                      key={`${src}-${imageIndex}`}
                    >
                      <Image src={src} alt={`${note.title || '动态'} 配图 ${imageIndex + 1}`} width={280} height={200} />
                    </button>
                  ))}
                </div>
              ) : null}
              <details className="moment-comment-dock">
                <summary aria-label={`评论 ${note.title || note.id}`}>评论</summary>
                <MomentComments config={comments} term={`/moments/${note.id}`} title={note.title || `日常碎片 ${index + 1}`} />
              </details>
            </article>
          );
        })}
      </div>

      {lightbox ? createPortal((
        <div
          className="moment-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`${lightbox.title} 图片预览`}
          ref={lightboxRef}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeLightbox();
            }
          }}
        >
          <button className="moment-lightbox__close" type="button" onClick={closeLightbox} ref={closeButtonRef}>
            关闭
          </button>
          <div className="moment-lightbox__zoom" aria-label="图片缩放控制">
            <button type="button" onClick={zoomOut} disabled={zoomScale <= minZoomScale} aria-label="缩小图片" title="缩小图片">
              −
            </button>
            <output aria-live="polite">{Math.round(zoomScale * 100)}%</output>
            <button type="button" onClick={zoomIn} disabled={zoomScale >= maxZoomScale} aria-label="放大图片" title="放大图片">
              +
            </button>
            <button type="button" onClick={resetZoom} disabled={zoomScale === 1} aria-label="重置图片比例" title="重置图片比例">
              ↺
            </button>
          </div>
          <div className="moment-lightbox__stage">
            <Image
              className="moment-lightbox__image"
              src={lightbox.images[lightbox.index]}
              alt={`${lightbox.title} 配图 ${lightbox.index + 1}`}
              width={1600}
              height={1200}
              style={{ '--moment-zoom-scale': zoomScale } as React.CSSProperties}
              priority
            />
          </div>
          {lightbox.images.length > 1 ? (
            <>
              <button className="moment-lightbox__nav moment-lightbox__previous" type="button" onClick={showPreviousImage} aria-label="查看上一张图片" title="上一张">
                ‹
              </button>
              <button className="moment-lightbox__nav moment-lightbox__next" type="button" onClick={showNextImage} aria-label="查看下一张图片" title="下一张">
                ›
              </button>
            </>
          ) : null}
          <p className="moment-lightbox__caption">
            <strong>{lightbox.title}</strong>
            <span>{lightbox.index + 1} / {lightbox.images.length}</span>
          </p>
        </div>
      ), document.body) : null}

      {filteredNotes.length === 0 ? <p className="moments-empty">没有找到这类动态。</p> : null}
    </section>
  );
}
