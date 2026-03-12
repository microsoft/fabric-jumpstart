'use client';

import React, { useEffect, useRef } from 'react';
import { useThemeContext } from '@components/Providers/themeProvider';
import { enhanceDiagram } from './enhance';

interface MermaidDiagramProps {
  chart: string;
  className?: string;
  /** When true, renders without container styling (for embedding in previews). */
  bare?: boolean;
  /** When true, renders with background but no shadow/border (for expanded modal). */
  seamless?: boolean;
}

export default function MermaidDiagram({ chart, className, bare, seamless }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useThemeContext();
  const isDark = theme.key === 'dark';

  useEffect(() => {
    let cancelled = false;

    async function renderAndEnhance() {
      const container = containerRef.current;
      if (!container) return;

      const mermaid = (await import('mermaid')).default;
      mermaid.initialize({
        startOnLoad: false,
        theme: 'base',
        themeVariables: {
          primaryColor: isDark ? '#2a2a32' : '#f5f8fa',
          primaryTextColor: isDark ? '#e0e0e0' : '#242424',
          primaryBorderColor: isDark ? '#4a4a55' : '#c8c8c8',
          lineColor: isDark ? '#5a8a9a' : '#219580',
          fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif',
          fontSize: '13px',
        },
        flowchart: {
          useMaxWidth: false,
          htmlLabels: true,
          curve: 'basis',
          padding: 22,
          nodeSpacing: 70,
          rankSpacing: 85,
        },
      });

      const id = `mermaid-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

      try {
        // Strip :::Type from subgraph lines (Mermaid doesn't support it)
        const mermaidChart = chart.replace(/^(\s*subgraph\s+.+?):::(\w+)\s*$/gm, '$1');
        const { svg } = await mermaid.render(id, mermaidChart);
        if (cancelled) return;

        // Mount raw SVG into real DOM
        container.innerHTML = svg;

        // Enhance in the real DOM where getBBox() works — pass original chart
        const svgEl = container.querySelector('svg') as SVGSVGElement | null;
        if (svgEl) {
          requestAnimationFrame(() => {
            if (!cancelled) enhanceDiagram(svgEl, chart, isDark);
          });
        }
      } catch (err) {
        console.error('Mermaid render error:', err);
        if (!cancelled) container.innerHTML = '';
      }
    }

    renderAndEnhance();
    return () => { cancelled = true; };
  }, [chart, isDark]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={bare ? { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' } : seamless ? {
        width: '100%',
        overflow: 'auto',
        padding: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      } : {
        width: '100%',
        overflow: 'auto',
        padding: '32px',
        borderRadius: '16px',
        backgroundColor: isDark
          ? 'rgba(26,26,32,0.75)'
          : 'rgba(248,250,253,0.98)',
        border: isDark
          ? '1px solid rgba(255,255,255,0.08)'
          : '1px solid rgba(0,0,0,0.06)',
        boxShadow: isDark
          ? '0 4px 28px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(255,255,255,0.04)'
          : '0 4px 28px rgba(0,0,0,0.06), inset 0 0 0 1px rgba(255,255,255,0.8)',
        backdropFilter: 'blur(10px)',
      }}
    />
  );
}
