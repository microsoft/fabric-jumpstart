'use client';

import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { useThemeContext } from '@components/Providers/themeProvider';
import { tokens } from '@fluentui/react-components';

let mermaidIdCounter = 0;

interface MermaidDiagramProps {
  chart: string;
}

export default function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string>('');
  const { theme } = useThemeContext();
  const isDark = theme.key === 'dark';

  useEffect(() => {
    const id = `mermaid-${++mermaidIdCounter}`;

    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'loose',
      fontFamily: "Inter, 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
      fontSize: 13,
      theme: 'base',
      themeVariables: isDark
        ? {
            // ── Dark: mint-on-dark, matching site Callout/QuoteBlock bg tones ──
            background: 'transparent',
            primaryColor: '#19433c',
            primaryTextColor: '#e0e0e0',
            primaryBorderColor: '#8be8a4',
            secondaryColor: '#1e2d3d',
            secondaryTextColor: '#e0e0e0',
            secondaryBorderColor: '#7beadd',
            tertiaryColor: '#2a1e3d',
            tertiaryTextColor: '#e0e0e0',
            tertiaryBorderColor: '#b39ddb',
            lineColor: 'rgba(139,232,164,0.6)',
            textColor: '#e0e0e0',
            mainBkg: '#19433c',
            nodeBorder: '#8be8a4',
            clusterBkg: 'rgba(139,232,164,0.06)',
            clusterBorder: 'rgba(139,232,164,0.2)',
            titleColor: '#8be8a4',
            edgeLabelBackground: '#141414',
            nodeTextColor: '#e0e0e0',
            // Sequence
            actorBkg: '#19433c',
            actorBorder: '#8be8a4',
            actorTextColor: '#8be8a4',
            actorLineColor: 'rgba(139,232,164,0.35)',
            signalColor: 'rgba(139,232,164,0.5)',
            signalTextColor: '#e0e0e0',
            labelBoxBkgColor: '#19433c',
            labelBoxBorderColor: '#8be8a4',
            labelTextColor: '#e0e0e0',
            loopTextColor: '#8be8a4',
            noteBkgColor: '#1e2d3d',
            noteBorderColor: '#7beadd',
            noteTextColor: '#e0e0e0',
            activationBkgColor: 'rgba(139,232,164,0.12)',
            activationBorderColor: '#8be8a4',
            // Journey
            sectionBkgColor: '#19433c',
            altSectionBkgColor: '#1e2d3d',
            sectionBkgColor2: '#2a1e3d',
            taskBkgColor: '#219580',
            taskBorderColor: '#8be8a4',
            taskTextColor: '#ffffff',
            taskTextDarkColor: '#ffffff',
            taskTextOutsideColor: '#e0e0e0',
            activeTaskBkgColor: '#8be8a4',
            activeTaskBorderColor: '#219580',
            doneTaskBkgColor: '#106960',
            doneTaskBorderColor: '#8be8a4',
            // Pie
            pie1: '#219580',
            pie2: '#7beadd',
            pie3: '#8be8a4',
            pie4: '#b39ddb',
            pie5: '#4fc3f7',
            pie6: '#ffb74d',
            pieTitleTextColor: '#e0e0e0',
            pieSectionTextColor: '#141414',
            pieLegendTextColor: '#e0e0e0',
            pieStrokeColor: '#141414',
          }
        : {
            // ── Light: teal-on-cream, matching site Callout/QuoteBlock bg tones ──
            background: 'transparent',
            primaryColor: '#e0f5f0',
            primaryTextColor: '#1a1a1a',
            primaryBorderColor: '#219580',
            secondaryColor: '#e8f4fd',
            secondaryTextColor: '#1a1a1a',
            secondaryBorderColor: '#0078d4',
            tertiaryColor: '#f3e8fd',
            tertiaryTextColor: '#1a1a1a',
            tertiaryBorderColor: '#7b1fa2',
            lineColor: 'rgba(33,149,128,0.45)',
            textColor: '#1a1a1a',
            mainBkg: '#e0f5f0',
            nodeBorder: '#219580',
            clusterBkg: 'rgba(33,149,128,0.04)',
            clusterBorder: 'rgba(33,149,128,0.2)',
            titleColor: '#106960',
            edgeLabelBackground: '#ffffff',
            nodeTextColor: '#1a1a1a',
            // Sequence
            actorBkg: '#e0f5f0',
            actorBorder: '#219580',
            actorTextColor: '#106960',
            actorLineColor: 'rgba(33,149,128,0.25)',
            signalColor: 'rgba(33,149,128,0.4)',
            signalTextColor: '#1a1a1a',
            labelBoxBkgColor: '#e0f5f0',
            labelBoxBorderColor: '#219580',
            labelTextColor: '#1a1a1a',
            loopTextColor: '#106960',
            noteBkgColor: '#e8f4fd',
            noteBorderColor: '#0078d4',
            noteTextColor: '#1a1a1a',
            activationBkgColor: 'rgba(33,149,128,0.08)',
            activationBorderColor: '#219580',
            // Journey
            sectionBkgColor: '#e0f5f0',
            altSectionBkgColor: '#e8f4fd',
            sectionBkgColor2: '#f3e8fd',
            taskBkgColor: '#219580',
            taskBorderColor: '#106960',
            taskTextColor: '#ffffff',
            taskTextDarkColor: '#ffffff',
            taskTextOutsideColor: '#1a1a1a',
            activeTaskBkgColor: '#106960',
            activeTaskBorderColor: '#219580',
            doneTaskBkgColor: '#7beadd',
            doneTaskBorderColor: '#219580',
            // Pie
            pie1: '#219580',
            pie2: '#7beadd',
            pie3: '#8be8a4',
            pie4: '#b39ddb',
            pie5: '#4fc3f7',
            pie6: '#ffb74d',
            pieTitleTextColor: '#1a1a1a',
            pieSectionTextColor: '#ffffff',
            pieLegendTextColor: '#1a1a1a',
            pieStrokeColor: '#ffffff',
          },
      sequence: {
        actorFontWeight: '600',
        messageFontWeight: '500',
        noteFontSize: 12,
        messageAlign: 'center' as const,
        mirrorActors: false,
        bottomMarginAdj: 2,
        useMaxWidth: true,
      },
    });

    mermaid
      .render(id, chart.trim())
      .then(({ svg: rendered }) => {
        setSvg(rendered);
        setError('');
      })
      .catch((err) => {
        setError(String(err));
        setSvg('');
      });
  }, [chart, isDark]);

  // Post-render: apply refined styling to SVG elements
  useEffect(() => {
    if (!svg || !containerRef.current) return;
    const svgEl = containerRef.current.querySelector('svg');
    if (!svgEl) return;

    // Round all rects (actor boxes, nodes, labels, notes)
    svgEl.querySelectorAll('rect').forEach((rect) => {
      if (!rect.getAttribute('rx')) rect.setAttribute('rx', '6');
      if (!rect.getAttribute('ry')) rect.setAttribute('ry', '6');
    });

    // Soften lines — use round linecaps/joins
    svgEl.querySelectorAll('line, path, polyline').forEach((el) => {
      const stroke = el.getAttribute('stroke');
      if (stroke && stroke !== 'none') {
        el.setAttribute('stroke-linecap', 'round');
        el.setAttribute('stroke-linejoin', 'round');
      }
    });

    // Refine text rendering
    svgEl.querySelectorAll('text').forEach((t) => {
      t.style.letterSpacing = '0.01em';
    });
  }, [svg]);

  // ── zoom / pan state ──────────────────────────────────────
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);
  const [copied, setCopied] = useState(false);

  // Measure the SVG's intrinsic dimensions once rendered
  useEffect(() => {
    if (!svg || !containerRef.current) return;
    const svgEl = containerRef.current.querySelector('svg');
    if (!svgEl) return;

    // Remove any width/height attrs mermaid sets so we can measure the viewBox
    svgEl.removeAttribute('height');
    svgEl.style.width = '100%';
    svgEl.style.height = 'auto';
    svgEl.style.maxWidth = '100%';

    const vb = svgEl.getAttribute('viewBox');
    if (vb) {
      const parts = vb.split(/[\s,]+/).map(Number);
      if (parts.length === 4) {
        setNaturalSize({ w: parts[2], h: parts[3] });
        return;
      }
    }
    // Fallback — measure bounding rect
    const bbox = svgEl.getBoundingClientRect();
    if (bbox.width && bbox.height) {
      setNaturalSize({ w: bbox.width, h: bbox.height });
    }
  }, [svg]);

  // Reset pan/zoom when diagram changes
  useEffect(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }, [svg]);

  const zoomIn = () => setScale((s) => Math.min(s * 1.25, 5));
  const zoomOut = () => setScale((s) => Math.max(s / 1.25, 0.25));
  const resetView = () => { setScale(1); setTranslate({ x: 0, y: 0 }); };

  const copySvg = () => {
    navigator.clipboard.writeText(svg).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  // ── mouse drag handlers ────────────────────────────────────
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, tx: translate.x, ty: translate.y };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    setTranslate({
      x: dragStart.current.tx + (e.clientX - dragStart.current.x),
      y: dragStart.current.ty + (e.clientY - dragStart.current.y),
    });
  };
  const onPointerUp = () => setDragging(false);

  // ── wheel zoom ─────────────────────────────────────────────
  const onWheel = (e: React.WheelEvent) => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
    setScale((s) => Math.min(Math.max(s * factor, 0.25), 5));
  };

  // ── shared styles ──────────────────────────────────────────
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const bgColor = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';
  const toolbarBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
  const btnStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    border: `1px solid ${borderColor}`,
    borderRadius: 6,
    backgroundColor: 'transparent',
    color: tokens.colorNeutralForeground2,
    cursor: 'pointer',
    fontSize: 14,
    lineHeight: 1,
    padding: 0,
  };
  const separatorStyle: React.CSSProperties = {
    width: 1,
    height: 16,
    backgroundColor: borderColor,
    margin: '0 4px',
  };

  const containerHeight = naturalSize
    ? naturalSize.h + 48 // padding only, no inflation
    : 200;

  if (error) {
    return (
      <div
        style={{
          margin: '16px 0',
          padding: '16px 20px',
          borderRadius: '8px',
          backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
          color: tokens.colorNeutralForeground2,
          fontSize: '13px',
          fontFamily: 'monospace',
          whiteSpace: 'pre-wrap',
        }}
      >
        <strong>Mermaid error:</strong> {error}
      </div>
    );
  }

  return (
    <div style={{ margin: '16px 0', borderRadius: 8, border: `1px solid ${borderColor}`, backgroundColor: bgColor, overflow: 'hidden' }}>
      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: '6px 8px',
          backgroundColor: toolbarBg,
          borderBottom: `1px solid ${borderColor}`,
        }}
      >
        <button style={btnStyle} onClick={zoomIn} title="Zoom in" aria-label="Zoom in">+</button>
        <button style={btnStyle} onClick={zoomOut} title="Zoom out" aria-label="Zoom out">−</button>
        <button style={{ ...btnStyle, width: 'auto', padding: '0 8px', fontSize: 11, fontWeight: 500 }} onClick={resetView} title="Reset view" aria-label="Reset view">
          {Math.round(scale * 100)}%
        </button>
        <div style={separatorStyle} />
        <button style={btnStyle} onClick={copySvg} title={copied ? 'Copied!' : 'Copy diagram'} aria-label="Copy diagram">
          {copied ? '✓' : '⎘'}
        </button>
      </div>

      {/* Diagram viewport */}
      <div
        style={{
          height: containerHeight,
          overflow: 'hidden',
          cursor: dragging ? 'grabbing' : 'grab',
          touchAction: 'none',
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
      >
        <div
          ref={containerRef}
          style={{
            transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
            transformOrigin: 'center top',
            transition: dragging ? 'none' : 'transform 0.15s ease',
            padding: 24,
            textAlign: 'center',
          }}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>
    </div>
  );
}
