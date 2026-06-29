'use client';

import { useEffect, useState } from 'react';

export function useTypewriter(text: string, speed = 28): string {
  const [typed, setTyped] = useState('');

  useEffect(() => {
    setTyped('');

    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setTyped(text);
      return undefined;
    }

    let cursor = 0;
    const timer = window.setInterval(() => {
      cursor += 1;
      setTyped(text.slice(0, cursor));

      if (cursor >= text.length) {
        window.clearInterval(timer);
      }
    }, speed);

    return () => window.clearInterval(timer);
  }, [speed, text]);

  return typed;
}
