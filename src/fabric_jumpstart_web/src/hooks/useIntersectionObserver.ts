'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Scroll-spy hook: highlights the last heading whose top edge has scrolled
 * past `offset` pixels from the viewport top.  This replaces the previous
 * IntersectionObserver approach which had edge-cases with adjacent headings
 * and click-to-scroll navigation.
 *
 * Signature kept backward-compatible (_rootMargin, _threshold unused).
 */
export default function useIntersectionObserver(
  items: string[],
  _rootMargin?: string,
  _threshold?: number,
  offset: number = 100
): [string | null] {
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const rafId = useRef<number>(0);

  const scan = useCallback(() => {
    let active: string | null = null;
    for (const selector of items) {
      const el = document.querySelector(selector);
      if (el) {
        const top = el.getBoundingClientRect().top;
        if (top <= offset) {
          active = selector.replace(/^#/, '');
        }
      }
    }
    if (active !== null) {
      setActiveNode(active);
    }
  }, [items, offset]);

  const handleScroll = useCallback(() => {
    cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(scan);
  }, [scan]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Hash-link clicks may not fire scroll, so also listen for hashchange
    const handleHash = () => {
      const id = window.location.hash.replace(/^#/, '');
      if (id && items.some((s) => s === `#${id}`)) {
        setActiveNode(id);
      }
      // Also re-scan after the browser finishes scrolling to the target
      setTimeout(scan, 50);
    };
    window.addEventListener('hashchange', handleHash);

    scan();
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('hashchange', handleHash);
      cancelAnimationFrame(rafId.current);
    };
  }, [handleScroll, scan, items]);

  return [activeNode];
}
