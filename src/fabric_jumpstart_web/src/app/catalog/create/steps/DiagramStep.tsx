'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { tokens } from '@fluentui/react-components';
import { useThemeContext } from '@components/Providers/themeProvider';
import { renderMermaidSvg } from '@utils/mermaidRender';
import type { JumpstartDraft } from '../formState';
import { DIAGRAM_STARTER } from '../formState';

interface Props {
  draft: JumpstartDraft;
  onChange: (patch: Partial<JumpstartDraft>) => void;
  diagramSaved: boolean;
  onSaveDiagram: () => void;
}

export default function DiagramStep({ draft, onChange, diagramSaved, onSaveDiagram }: Props) {
  const { theme } = useThemeContext();
  const isDark = theme.key === 'dark';

  const chart = draft.mermaid_diagram || DIAGRAM_STARTER;

  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const previewRef = useRef<HTMLDivElement>(null);
  const zoomContainerRef = useRef<HTMLDivElement>(null);

  const renderPreview = useCallback(async () => {
    const container = previewRef.current;
    if (!container || !chart.trim()) return;
    setError(null);
    try {
      await renderMermaidSvg(chart, isDark, container);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid Mermaid syntax');
      container.innerHTML = '';
    }
  }, [chart, isDark]);

  useEffect(() => {
    const t = setTimeout(() => {
      renderPreview();
      setScale(1);
      setTranslate({ x: 0, y: 0 });
    }, 400);
    return () => clearTimeout(t);
  }, [renderPreview]);

  useEffect(() => {
    const el = zoomContainerRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      setScale((s) => Math.min(5, Math.max(0.2, s * (e.deltaY > 0 ? 0.9 : 1.1))));
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, []);

  const onDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setDragging(true);
    dragStart.current = { x: e.clientX - translate.x, y: e.clientY - translate.y };
  }, [translate]);

  const onMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return;
    setTranslate({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
  }, [dragging]);

  const onUp = useCallback(() => setDragging(false), []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <p style={{ margin: 0, fontSize: 14, color: tokens.colorNeutralForeground2 }}>
        Define your jumpstart&apos;s architecture diagram using{' '}
        <a href="https://mermaid.js.org/syntax/flowchart.html" target="_blank" rel="noopener noreferrer">
          Mermaid flowchart
        </a>{' '}
        syntax. Fabric item types (e.g. <code>:::Lakehouse</code>) are recognized and automatically
        styled with Fabric icons.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, minHeight: 360 }}>
        {/* Editor */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: tokens.colorNeutralForeground2 }}>
            Mermaid Syntax
          </label>
          <textarea
            value={chart}
            onChange={(e) => onChange({ mermaid_diagram: e.target.value })}
            spellCheck={false}
            style={{
              flex: 1,
              resize: 'vertical',
              minHeight: 340,
              fontFamily: 'monospace',
              fontSize: 12,
              padding: '10px 12px',
              borderRadius: 6,
              border: `1px solid ${tokens.colorNeutralStroke1}`,
              background: isDark ? '#1a1a22' : '#ffffff',
              color: isDark ? '#d0d0e0' : '#1a1a24',
              lineHeight: 1.5,
              outline: 'none',
            }}
          />
          {error && (
            <div style={{ color: tokens.colorStatusDangerForeground1, fontSize: 12 }}>
              ⚠ {error}
            </div>
          )}
        </div>

        {/* Live preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: tokens.colorNeutralForeground2 }}>
            Live Preview
          </label>
          <div
            ref={zoomContainerRef}
            onMouseDown={onDown}
            onMouseMove={onMove}
            onMouseUp={onUp}
            onMouseLeave={onUp}
            style={{
              flex: 1,
              minHeight: 340,
              overflow: 'hidden',
              border: `1px solid ${tokens.colorNeutralStroke1}`,
              borderRadius: 6,
              background: isDark ? '#1a1a22' : '#ffffff',
              cursor: dragging ? 'grabbing' : 'grab',
              position: 'relative',
            }}
          >
            <div
              ref={previewRef}
              style={{
                transform: `translate(${translate.x}px,${translate.y}px) scale(${scale})`,
                transformOrigin: '0 0',
                transition: dragging ? 'none' : 'transform 0.1s',
                padding: 16,
              }}
            />
            <div style={{ position: 'absolute', bottom: 8, right: 8, display: 'flex', gap: 4 }}>
              {[
                { label: '+', delta: 1.2 },
                { label: '−', delta: 0.8 },
                { label: '⟲', reset: true },
              ].map(({ label, delta, reset }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    if (reset) { setScale(1); setTranslate({ x: 0, y: 0 }); }
                    else setScale((s) => Math.min(5, Math.max(0.2, s * delta!)));
                  }}
                  style={{
                    background: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.07)',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.12)'}`,
                    color: isDark ? '#fff' : '#242424',
                    borderRadius: 5,
                    padding: '3px 8px',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Save Diagram button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          type="button"
          onClick={onSaveDiagram}
          disabled={!!error}
          style={{
            padding: '8px 20px',
            borderRadius: 6,
            border: 'none',
            background: error ? tokens.colorNeutralBackground3 : '#117865',
            color: error ? tokens.colorNeutralForeground3 : '#fff',
            fontWeight: 600,
            fontSize: 14,
            cursor: error ? 'not-allowed' : 'pointer',
          }}
        >
          Save Diagram
        </button>
        {diagramSaved && !error && (
          <span style={{ fontSize: 13, color: tokens.colorStatusSuccessForeground3, fontWeight: 600 }}>
            ✓ Saved — diagram will be included in manifest
          </span>
        )}
        {!diagramSaved && !error && (
          <span style={{ fontSize: 13, color: tokens.colorNeutralForeground3 }}>
            Unsaved — diagram will not appear in manifest until saved
          </span>
        )}
      </div>
    </div>
  );
}

