'use client';

import { useState, useEffect, useRef } from 'react';

export default function useIntersectionObserver(
  items: string[],
  rootMargin: string = '0% 0% -55% 0%',
  threshold: number = 1
): [string | null] {
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const observer = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observer.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 1) {
            setActiveNode(entry.target.getAttribute('id'));
          }
        });
      },
      { root: null, rootMargin, threshold }
    );

    items.forEach((item) => {
      if (item !== '#') {
        const target = document.querySelector(item);
        if (target) observer.current?.observe(target);
      }
    });

    return () => {
      if (observer.current) observer.current.disconnect();
    };
  }, [activeNode, items, rootMargin, threshold]);

  return [activeNode];
}
