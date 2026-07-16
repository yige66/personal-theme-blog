'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export type HomeMediaSlide = {
  id: string;
  href: string;
  image: string;
  alt: string;
  eyebrow: string;
  title: string;
  meta?: string;
  detail?: string;
};

type HomeMediaCarouselProps = {
  ariaLabel: string;
  className: string;
  slides: HomeMediaSlide[];
  eager?: boolean;
  intervalMs?: number;
};

export function HomeMediaCarousel({ ariaLabel, className, slides, eager = false, intervalMs = 6200 }: HomeMediaCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeSlide = slides[activeIndex] ?? slides[0];

  useEffect(() => {
    setActiveIndex(0);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % slides.length);
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [intervalMs, slides.length]);

  if (!activeSlide) {
    return null;
  }

  return (
    <section className={`${className} xh-home-media-carousel`} data-motion="stack-card" aria-label={ariaLabel}>
      <Link className="xh-home-media-carousel__main-link" href={activeSlide.href} aria-label={activeSlide.title} />
      {slides.map((slide, index) => (
        <Image
          className={`xh-card-cover${index === activeIndex ? ' is-active' : ''}`}
          src={slide.image}
          alt={slide.alt}
          width={720}
          height={420}
          loading={eager && index === 0 ? 'eager' : 'lazy'}
          key={slide.id}
        />
      ))}

      <div className="xh-card-copy">
        <p className="eyebrow">{activeSlide.eyebrow}</p>
        {activeSlide.meta ? <span className="xh-card-meta">{activeSlide.meta}</span> : null}
        <h2>{activeSlide.title}</h2>
        {activeSlide.detail ? <p>{activeSlide.detail}</p> : null}
      </div>

      {slides.length > 1 ? (
        <nav className="xh-carousel-dots" aria-label={`${ariaLabel}切换`}>
          {slides.map((slide, index) => (
            <button
              className={index === activeIndex ? 'is-active' : ''}
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setActiveIndex(index);
              }}
              key={slide.id}
              aria-label={`切换到 ${slide.title}`}
              aria-current={index === activeIndex ? 'true' : undefined}
            >
              <span>{slide.title}</span>
            </button>
          ))}
        </nav>
      ) : null}
    </section>
  );
}
