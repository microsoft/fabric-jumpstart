'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { tokens } from '@fluentui/react-components';
import { useThemeContext } from '@components/Providers/themeProvider';
import { renderMermaidSvg } from '@utils/mermaidRender';
import type { JumpstartDraft } from './formState';

interface Props {
  draft: JumpstartDraft;
}

export default function MermaidPreview({ draft }: Props) {
  const { theme } = useThemeContext();
  const isDark = theme.key === 'dark';
  const containerRef = useRef<HTMLDivElement>(null);
  const diagram = draft.mermaid_diagram;

  const render = useCallback(async () => {
    const el = containerRef.current;
    if (!el || !diagram.trim()) {
      if (el) el.innerHTML = '';
      return;
    }
    try {
      await renderMermaidSvg(diagram, isDark, el);
    } catch {
      el.innerHTML = '';
    }
  }, [diagram, isDark]);

  useEffect(() => {
    const t = setTimeout(render, 400);
    return () => clearTimeout(t);
  }, [render]);

  if (!diagram.trim()) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: tokens.colorNeutralForeground3,
        }}
      >
        Architecture Preview
      </div>
      <div
        style={{
          borderRadius: 8,
          border: `1px solid ${tokens.colorNeutralStroke1}`,
          overflow: 'hidden',
          background: isDark ? '#1a1a22' : '#f8f8fa',
          padding: 12,
          minHeight: 60,
        }}
      >
        <div ref={containerRef} />
      </div>
    </div>
  );
}
