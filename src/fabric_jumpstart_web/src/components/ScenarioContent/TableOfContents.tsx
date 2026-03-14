'use client';

import React from 'react';
import useIntersectionObserver from '@hooks/useIntersectionObserver';
import { useThemeContext } from '@components/Providers/themeProvider';

interface TocItem {
  title: string;
  id: string;
  level: number;
}

function getTocEntries(items: TocItem[]): string[] {
  return items.map((item) => `#${item.id}`);
}

function TocEntry({
  items,
  active,
  isDark,
}: {
  items: TocItem[];
  active: string | null;
  isDark: boolean;
}) {
  const activeColor = isDark ? '#6dcfb8' : '#0e7a5e';
  const inactiveColor = isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.5)';

  return (
    <>
      {items.map((item) => {
        const isActive = item.id === active;
        const indent = (item.level - 2) * 16;
        return (
          <a
            key={item.id}
            href={`#${item.id}`}
            style={{
              display: 'block',
              marginTop: '10px',
              marginLeft: `${indent}px`,
              fontSize: '13px',
              color: isActive ? activeColor : inactiveColor,
              textDecoration: 'none',
              transition: 'color 150ms ease',
              lineHeight: 1.4,
            }}
          >
            {item.title}
          </a>
        );
      })}
    </>
  );
}

export default function TableOfContents({ headings }: { headings: TocItem[] }) {
  const { theme } = useThemeContext();
  const isDark = theme.key === 'dark';
  const entries = getTocEntries(headings);
  const [activeNode] = useIntersectionObserver(entries);

  const accentColor = isDark ? '#6dcfb8' : '#0e7a5e';
  const borderColor = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)';

  return (
    <nav
      style={{
        position: 'sticky',
        top: '100px',
        maxHeight: 'calc(100vh - 120px)',
        overflowY: 'auto',
        paddingLeft: '24px',
        borderLeft: `1px solid ${borderColor}`,
      }}
    >
      <h2
        style={{
          fontSize: '11px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.15em',
          color: accentColor,
          marginBottom: '8px',
        }}
      >
        Table of Contents
      </h2>
      <TocEntry items={headings} active={activeNode} isDark={isDark} />
    </nav>
  );
}

export type { TocItem };
