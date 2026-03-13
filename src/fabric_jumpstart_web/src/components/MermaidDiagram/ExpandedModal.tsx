'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useThemeContext } from '@components/Providers/themeProvider';

interface Props {
  slug: string;
  chart?: string;
  title?: string;
  onClose: () => void;
}

export default function DiagramExpandedModal({ slug, title, onClose }: Props) {
  const { theme } = useThemeContext();
  const isDark = theme.key === 'dark';

  const diagramSrc = `/images/diagrams/${slug}_${isDark ? 'dark' : 'light'}.svg`;

  const panelBg = isDark ? '#1a1a20' : '#f8fafd';
  const titleBarBg = isDark ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.06)';
  const titleColor = isDark ? '#fff' : '#242424';
  const borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const btnBg = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.07)';
  const btnBorder = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.12)';
  const btnColor = isDark ? '#fff' : '#242424';

  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const start = useRef({ x: 0, y: 0 });

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Escape to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setScale(s => Math.min(5, Math.max(0.2, s * (e.deltaY > 0 ? 0.9 : 1.1))));
  }, []);

  const onDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    setDragging(true);
    start.current = { x: e.clientX - translate.x, y: e.clientY - translate.y };
  }, [translate]);

  const onMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return;
    setTranslate({ x: e.clientX - start.current.x, y: e.clientY - start.current.y });
  }, [dragging]);

  const onUp = useCallback(() => setDragging(false), []);

  const reset = useCallback(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }, []);

  const btn: React.CSSProperties = {
    background: btnBg,
    border: `1px solid ${btnBorder}`,
    color: btnColor,
    borderRadius: '6px',
    padding: '6px 14px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
    lineHeight: '1',
  };

  return (
    /* Backdrop — click to close */
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(6px)',
      }}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Modal panel */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '92vw',
          maxWidth: '92vw',
          height: '90vh',
          maxHeight: '90vh',
          borderRadius: '14px',
          overflow: 'hidden',
          backgroundColor: panelBg,
          border: `1px solid ${borderColor}`,
          boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 20px',
          backgroundColor: titleBarBg,
          color: titleColor,
          flexShrink: 0,
          borderBottom: `1px solid ${borderColor}`,
        }}>
          <span style={{ fontSize: '14px', fontWeight: 600 }}>
            {title ? `${title} \u2014 Architecture` : 'Architecture Diagram'}
          </span>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <button onClick={() => setScale(s => Math.min(5, s * 1.25))} style={btn}>+</button>
            <button onClick={() => setScale(s => Math.max(0.2, s * 0.8))} style={btn}>{'\u2212'}</button>
            <button onClick={reset} style={btn}>Reset</button>
            <div style={{ width: '1px', height: '18px', backgroundColor: borderColor, margin: '0 6px' }} />
            <button onClick={onClose} style={{ ...btn, fontSize: '16px', padding: '6px 10px' }}>{'\u2715'}</button>
          </div>
        </div>

        {/* Zoomable / pannable area */}
        <div
          style={{ flex: 1, overflow: 'hidden', cursor: dragging ? 'grabbing' : 'grab', position: 'relative' }}
          onWheel={onWheel}
          onMouseDown={onDown}
          onMouseMove={onMove}
          onMouseUp={onUp}
          onMouseLeave={onUp}
        >
          <div style={{
            transform: `translate(${translate.x}px,${translate.y}px) scale(${scale})`,
            transformOrigin: 'center center',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '32px',
          }}>
            <img
              src={diagramSrc}
              alt={title ? `${title} — Architecture` : 'Architecture Diagram'}
              draggable={false}
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', userSelect: 'none' }}
            />
          </div>

          {/* Zoom indicator */}
          <div style={{
            position: 'absolute',
            bottom: '12px',
            right: '12px',
            backgroundColor: isDark ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0.08)',
            color: isDark ? '#fff' : '#444',
            padding: '3px 10px',
            borderRadius: '5px',
            fontSize: '11px',
            pointerEvents: 'none',
          }}>
            {Math.round(scale * 100)}%
          </div>
        </div>
      </div>
    </div>
  );
}
