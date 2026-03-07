'use client';

import React from 'react';
import { tokens } from '@fluentui/react-components';
import { useThemeContext } from '@components/Providers/themeProvider';

interface QuoteBlockProps {
  children: React.ReactNode;
  author?: string;
  source?: string;
}

export default function QuoteBlock({ children, author, source }: QuoteBlockProps) {
  const { theme } = useThemeContext();
  const isDark = theme.key === 'dark';

  return (
    <blockquote
      style={{
        borderLeft: `4px solid ${tokens.colorBrandForeground1}`,
        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
        borderRadius: '0 8px 8px 0',
        padding: '16px 24px',
        margin: '24px 0',
        fontStyle: 'italic',
        fontSize: '14px',
        color: tokens.colorNeutralForeground2,
      }}
    >
      <div style={{ marginBottom: author || source ? '8px' : 0 }}>{children}</div>
      {(author || source) && (
        <footer
          style={{
            fontStyle: 'normal',
            fontSize: '13px',
            fontWeight: 500,
            color: tokens.colorBrandForeground1,
          }}
        >
          {author && <span>— {author}</span>}
          {source && (
            <cite
              style={{
                marginLeft: '4px',
                fontWeight: 400,
                color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.55)',
              }}
            >
              , {source}
            </cite>
          )}
        </footer>
      )}
    </blockquote>
  );
}
