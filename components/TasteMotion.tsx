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
      const portalCards = gsap.utils.toArray<HTMLElement>('[data-motion="portal-card"]');
      if (portalCards.length > 0) {
        gsap.from(portalCards, {
          autoAlpha: 0,
          y: 42,
          scale: 0.96,
          rotateX: 5,
          duration: 1.05,
          stagger: 0.08,
          ease: 'power3.out'
        });
      }

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

      // Keep horizontal reveal ownership on the shell so the card link stays stable.
      gsap.utils.toArray<HTMLElement>('[data-motion="project-card"]').forEach((element) => {
        const side = element.dataset.projectSide === 'right' ? 1 : -1;
        gsap.set(element, { visibility: 'visible' });
        gsap.fromTo(
          element,
          { x: side * 64, opacity: 0.16 },
          {
            x: 0,
            opacity: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: element,
              start: 'top 94%',
              end: 'top 58%',
              scrub: true
            }
          }
        );
      });

      gsap.utils.toArray<HTMLElement>('[data-motion="stack-card"]').forEach((element, index) => {
        gsap.set(element, { visibility: 'visible' });
        gsap.fromTo(
          element,
          { y: 42 + index * 8, scale: 0.96, opacity: 0.84 },
          {
            y: 0,
            scale: 1,
            opacity: 1,
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
