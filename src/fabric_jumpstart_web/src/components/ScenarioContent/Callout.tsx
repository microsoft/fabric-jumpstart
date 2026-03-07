'use client';

import React from 'react';
import { tokens } from '@fluentui/react-components';
import { useThemeContext } from '@components/Providers/themeProvider';

export default function Callout({ children }: { children: React.ReactNode }) {
  const { theme } = useThemeContext();
  const isDark = theme.key === 'dark';

  return (
    <aside
      style={{
        borderLeft: `3px solid ${tokens.colorBrandForeground1}`,
        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
        paddingLeft: '20px',
        paddingRight: '12px',
        paddingTop: '8px',
        paddingBottom: '8px',
        borderRadius: '0 6px 6px 0',
        fontSize: '14px',
        lineHeight: 1.7,
        margin: '16px 0',
      }}
    >
      {children}
    </aside>
  );
}
