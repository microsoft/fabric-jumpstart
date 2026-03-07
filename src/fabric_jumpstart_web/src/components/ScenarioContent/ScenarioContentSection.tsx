'use client';

import React from 'react';
import { useThemeContext } from '@components/Providers/themeProvider';
import ScenarioContentRenderer from './ScenarioContentRenderer';

interface ScenarioContentSectionProps {
  rawMarkdown: string;
  isMdx: boolean;
  showToc: boolean;
}

export default function ScenarioContentSection({
  rawMarkdown,
  isMdx,
  showToc,
}: ScenarioContentSectionProps) {
  const { theme } = useThemeContext();
  const isDark = theme.key === 'dark';

  return (
    <>
      {/* Divider */}
      <div
        style={{
          height: '1px',
          backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
          margin: '24px 0',
        }}
      />

      {/* Styled media query for TOC sidebar visibility */}
      <style>{`
        @media (min-width: 1200px) {
          .scenario-toc-sidebar {
            display: block !important;
          }
        }
      `}</style>

      <ScenarioContentRenderer
        rawMarkdown={rawMarkdown}
        isMdx={isMdx}
        showToc={showToc}
      />
    </>
  );
}
