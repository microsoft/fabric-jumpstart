'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Button,
  Field,
  Input,
  ToggleButton,
  tokens,
} from '@fluentui/react-components';
import {
  ArrowDownload24Regular,
  Copy24Regular,
  Eye24Regular,
  WeatherMoon24Regular,
  WeatherSunny24Regular,
} from '@fluentui/react-icons';
import { useThemeContext } from '@components/Providers/themeProvider';
import { enhanceDiagram } from '@components/MermaidDiagram/enhance';

const SAMPLE_CHART = `graph LR
  NB[my_notebook]:::Notebook --> LH[my_lakehouse]:::Lakehouse
  LH --> WH[my_warehouse]:::Warehouse
  WH --> SM[my_model]:::SemanticModel
  SM --> RPT[my_report]:::Report`;

const MERMAID_CONFIG_LIGHT = {
  startOnLoad: false,
  theme: 'base' as const,
  themeVariables: {
    primaryColor: '#f5f8fa',
    primaryTextColor: '#242424',
    primaryBorderColor: '#c8c8c8',
    lineColor: '#219580',
    fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif',
    fontSize: '13px',
  },
  flowchart: {
    useMaxWidth: false,
    htmlLabels: true,
    curve: 'basis' as const,
    padding: 22,
    nodeSpacing: 70,
    rankSpacing: 85,
  },
};

const MERMAID_CONFIG_DARK = {
  ...MERMAID_CONFIG_LIGHT,
  themeVariables: {
    primaryColor: '#2a2a32',
    primaryTextColor: '#e0e0e0',
    primaryBorderColor: '#4a4a55',
    lineColor: '#5a8a9a',
    fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif',
    fontSize: '13px',
  },
};

const CODE_HEIGHT = 400;

function zoomBtnStyle(dark: boolean): React.CSSProperties {
  return {
    background: dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.07)',
    border: `1px solid ${dark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.12)'}`,
    color: dark ? '#fff' : '#242424',
    borderRadius: 5,
    padding: '3px 8px',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    lineHeight: '1',
  };
}

async function renderMermaidSvg(
  chart: string,
  isDark: boolean,
  container: HTMLDivElement,
): Promise<string | null> {
  const mermaid = (await import('mermaid')).default;
  mermaid.initialize(isDark ? MERMAID_CONFIG_DARK : MERMAID_CONFIG_LIGHT);

  const id = `mermaid-gen-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  try {
    // Strip :::Type annotations from subgraph lines before Mermaid render
    const strippedChart = chart.replace(/^(\s*subgraph\s+.+?):::(\w+)\s*$/gm, '$1');
    const { svg } = await mermaid.render(id, strippedChart);
    container.innerHTML = svg;

    const svgEl = container.querySelector('svg') as SVGSVGElement | null;
    if (svgEl) {
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          enhanceDiagram(svgEl, chart, isDark);
          resolve();
        });
      });
      return svgEl.outerHTML;
    }
  } catch (err) {
    console.error('Mermaid render error:', err);
  }
  return null;
}

function downloadSvg(svgContent: string, filename: string) {
  const blob = new Blob([svgContent], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function DiagramGenerator() {
  const [chart, setChart] = useState(SAMPLE_CHART);
  const [slug, setSlug] = useState('my-jumpstart');
  const [previewDark, setPreviewDark] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const { theme } = useThemeContext();
  const isDark = theme.key === 'dark';

  const previewRef = useRef<HTMLDivElement>(null);
  const zoomContainerRef = useRef<HTMLDivElement>(null);
  const offscreenRef = useRef<HTMLDivElement>(null);

  const renderPreview = useCallback(async () => {
    const container = previewRef.current;
    if (!container || !chart.trim()) return;

    setError(null);
    try {
      const mermaid = (await import('mermaid')).default;
      mermaid.initialize(previewDark ? MERMAID_CONFIG_DARK : MERMAID_CONFIG_LIGHT);

      const id = `mermaid-preview-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      // Strip :::Type annotations from subgraph lines before Mermaid render
      const strippedChart = chart.replace(/^(\s*subgraph\s+.+?):::(\w+)\s*$/gm, '$1');
      const { svg } = await mermaid.render(id, strippedChart);
      container.innerHTML = svg;

      const svgEl = container.querySelector('svg') as SVGSVGElement | null;
      if (svgEl) {
        requestAnimationFrame(() => {
          enhanceDiagram(svgEl, chart, previewDark);
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid Mermaid syntax');
      container.innerHTML = '';
    }
  }, [chart, previewDark]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      renderPreview();
      setScale(1);
      setTranslate({ x: 0, y: 0 });
    }, 400);
    return () => clearTimeout(timeout);
  }, [renderPreview]);

  const handleDownload = async () => {
    if (!offscreenRef.current || !chart.trim()) return;
    setDownloading(true);

    try {
      const lightSvg = await renderMermaidSvg(chart, false, offscreenRef.current);
      if (lightSvg) downloadSvg(lightSvg, `${slug}_light.svg`);

      const darkSvg = await renderMermaidSvg(chart, true, offscreenRef.current);
      if (darkSvg) downloadSvg(darkSvg, `${slug}_dark.svg`);

      offscreenRef.current.innerHTML = '';
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setDownloading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(chart);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Attach non-passive wheel listener to prevent page scroll while zooming
  useEffect(() => {
    const el = zoomContainerRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      setScale(s => Math.min(5, Math.max(0.2, s * (e.deltaY > 0 ? 0.9 : 1.1))));
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, []);

  const onDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    setDragging(true);
    dragStart.current = { x: e.clientX - translate.x, y: e.clientY - translate.y };
  }, [translate]);

  const onMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return;
    setTranslate({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
  }, [dragging]);

  const onUp = useCallback(() => setDragging(false), []);

  const resetView = useCallback(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }, []);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 24px 40px' }}>
      <h1 style={{
        fontSize: 28,
        fontWeight: 600,
        marginBottom: 8,
        color: isDark ? '#e0e0e0' : '#242424',
      }}>
        Architecture Diagram Generator
      </h1>
      <p style={{
        fontSize: 14,
        color: isDark ? '#a0a0a0' : '#616161',
        marginBottom: 24,
      }}>
        Paste Mermaid syntax below to preview and download light/dark SVGs for your jumpstart.
        See the <a
          href="https://github.com/microsoft/fabric-jumpstart/blob/main/src/fabric_jumpstart/CONTRIBUTING.md#mermaid-diagrams"
          style={{ color: tokens.colorBrandForeground1 }}
          target="_blank"
          rel="noopener noreferrer"
        >contributing guide</a> for the expected format.
      </p>

      {/* Controls bar */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 20 }}>
        <Field label="Jumpstart Logical Id" style={{ flex: '0 0 300px' }}>
          <Input
            value={slug}
            onChange={(_, d) => setSlug(d.value)}
            placeholder="e.g. spark-monitoring-and-optimization"
            style={{ backgroundColor: isDark ? '#282c34' : '#ffffff' }}
          />
        </Field>

        <ToggleButton
          checked={previewDark}
          onClick={() => setPreviewDark(!previewDark)}
          icon={previewDark ? <WeatherMoon24Regular /> : <WeatherSunny24Regular />}
          size="medium"
        >
          {previewDark ? 'Dark' : 'Light'}
        </ToggleButton>

        <Button
          appearance="primary"
          icon={<ArrowDownload24Regular />}
          onClick={handleDownload}
          disabled={downloading || !chart.trim()}
          size="medium"
        >
          {downloading ? 'Generating…' : 'Download SVGs'}
        </Button>
      </div>

      {/* Preview area with zoom/drag */}
      <div style={{
        borderRadius: 12,
        backgroundColor: previewDark ? 'rgba(26,26,32,0.75)' : 'rgba(248,250,253,0.98)',
        border: previewDark
          ? '1px solid rgba(255,255,255,0.08)'
          : '1px solid rgba(0,0,0,0.06)',
        boxShadow: previewDark
          ? '0 4px 28px rgba(0,0,0,0.45)'
          : '0 4px 28px rgba(0,0,0,0.06)',
        overflow: 'hidden',
        minHeight: 450,
        marginBottom: 24,
        position: 'relative',
      }}>
        {!chart.trim() ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: isDark ? '#666' : '#999', height: 450 }}>
            <Eye24Regular />
            <span>Enter Mermaid syntax to preview</span>
          </div>
        ) : (
          <div
            ref={zoomContainerRef}
            style={{ width: '100%', height: 450, cursor: dragging ? 'grabbing' : 'grab', overflow: 'hidden' }}
            onMouseDown={onDown}
            onMouseMove={onMove}
            onMouseUp={onUp}
            onMouseLeave={onUp}
          >
            <div
              ref={previewRef}
              style={{
                transform: `translate(${translate.x}px,${translate.y}px) scale(${scale})`,
                transformOrigin: 'center center',
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 24,
              }}
            />
          </div>
        )}

        {/* Zoom controls */}
        {chart.trim() && (
          <div style={{
            position: 'absolute',
            bottom: 10,
            right: 10,
            display: 'flex',
            gap: 4,
            alignItems: 'center',
          }}>
            <span style={{
              fontSize: 11,
              color: previewDark ? '#aaa' : '#666',
              marginRight: 4,
            }}>
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={() => setScale(s => Math.min(5, s * 1.25))}
              style={zoomBtnStyle(previewDark)}
            >+</button>
            <button
              onClick={() => setScale(s => Math.max(0.2, s * 0.8))}
              style={zoomBtnStyle(previewDark)}
            >{'\u2212'}</button>
            <button
              onClick={resetView}
              style={{ ...zoomBtnStyle(previewDark), padding: '3px 8px', fontSize: 11 }}
            >Reset</button>
          </div>
        )}
      </div>

      {/* Code editor — styled like site code blocks */}
      <div style={{
        border: `1px solid ${tokens.colorNeutralStroke1}`,
        borderRadius: 8,
        overflow: 'hidden',
        marginBottom: 24,
      }}>
        {/* Code block header */}
        <div style={{
          backgroundColor: tokens.colorNeutralBackground4,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '6px 12px',
        }}>
          <span style={{
            fontSize: 12,
            fontWeight: 600,
            color: tokens.colorNeutralForeground2,
            fontFamily: 'Menlo, Monaco, Consolas, "Courier New", monospace',
          }}>
            mermaid
          </span>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <Button
              appearance="subtle"
              size="small"
              icon={<Copy24Regular />}
              onClick={handleCopy}
              style={{ fontSize: 11, minWidth: 'auto', padding: '2px 8px' }}
            >
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
        </div>

        {/* Code body */}
        <div style={{ position: 'relative' }}>
          <textarea
            value={chart}
            onChange={(e) => setChart(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Tab') {
                e.preventDefault();
                const ta = e.currentTarget;
                const start = ta.selectionStart;
                const end = ta.selectionEnd;
                const newVal = chart.substring(0, start) + '  ' + chart.substring(end);
                setChart(newVal);
                requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = start + 2; });
              }
            }}
            spellCheck={false}
            style={{
              width: '100%',
              height: CODE_HEIGHT,
              padding: '16px 20px',
              margin: 0,
              border: 'none',
              outline: 'none',
              resize: 'none',
              fontFamily: 'Menlo, Monaco, Consolas, "Courier New", monospace',
              fontSize: 13,
              lineHeight: 1.6,
              backgroundColor: isDark ? '#282c34' : '#fafafa',
              color: isDark ? '#abb2bf' : '#383a42',
              tabSize: 2,
              boxSizing: 'border-box',
              transition: 'height 0.2s ease',
            }}
            placeholder={'graph LR\n  NB[my_notebook]:::Notebook --> LH[my_lakehouse]:::Lakehouse'}
          />
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div style={{
          padding: '12px 16px',
          borderRadius: 8,
          backgroundColor: isDark ? 'rgba(200,50,50,0.15)' : 'rgba(200,50,50,0.08)',
          color: isDark ? '#ff8080' : '#c83232',
          fontSize: 13,
          fontFamily: 'Consolas, "Courier New", monospace',
          whiteSpace: 'pre-wrap',
          marginBottom: 24,
        }}>
          {error}
        </div>
      )}

      {/* Off-screen container for download rendering */}
      <div
        ref={offscreenRef}
        style={{ position: 'absolute', left: -9999, top: -9999, width: 1200, visibility: 'hidden' }}
        aria-hidden
      />
    </div>
  );
}
