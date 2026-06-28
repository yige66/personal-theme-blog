'use client';

import { useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function TasteMotion() {
  useEffect(() => {
    if (prefersReducedMotion()) {
      return undefined;
    }

    gsap.registerPlugin(ScrollTrigger);

    const context = gsap.context(() => {
      gsap.from('[data-motion="portal-card"]', {
        autoAlpha: 0,
        y: 42,
        scale: 0.96,
        rotateX: 5,
        duration: 1.05,
        stagger: 0.08,
        ease: 'power3.out'
      });

      gsap.utils.toArray<HTMLElement>('[data-motion="image-scale"]').forEach((element) => {
        gsap.fromTo(
          element,
          { scale: 0.88, autoAlpha: 0.72 },
          {
            scale: 1,
            autoAlpha: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: element,
              start: 'top 92%',
              end: 'bottom 12%',
              scrub: true
            }
          }
        );
      });

      gsap.utils.toArray<HTMLElement>('[data-motion="stack-card"]').forEach((element, index) => {
        gsap.fromTo(
          element,
          { y: 42 + index * 8, scale: 0.96, autoAlpha: 0.84 },
          {
            y: 0,
            scale: 1,
            autoAlpha: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: element,
              start: 'top 88%',
              end: 'top 48%',
              scrub: true
            }
          }
        );
      });
    });

    return () => context.revert();
  }, []);

  return null;
}
