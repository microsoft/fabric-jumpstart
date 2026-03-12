'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { tokens } from '@fluentui/react-components';
import { useThemeContext } from '@components/Providers/themeProvider';
import workloadColorsData from '@data/workload-colors.json';
import type { ScenarioCard } from '@scenario/scenario';

const ExpandedModal = dynamic(() => import('@components/MermaidDiagram/ExpandedModal'), { ssr: false });

const CodeBlock = dynamic(() => import('@components/Markdown/Codeblock'), {
  ssr: false,
});

interface WorkloadColor {
  primary: string;
  secondary: string;
  light: string;
  accent: string;
  mid: string;
  icon: string;
}

const workloadColors = workloadColorsData as Record<string, WorkloadColor>;

const defaultWc: WorkloadColor = {
  primary: '#0078D4',
  secondary: '#004E8C',
  light: '#E8F4FD',
  accent: '#0078D4',
  mid: '#5CB8E6',
  icon: '',
};

const difficultyColor: Record<string, { bg: string; fg: string }> = {
  beginner: { bg: '#dff6dd', fg: '#107c10' },
  intermediate: { bg: '#fff4ce', fg: '#797600' },
  advanced: { bg: '#fde7e9', fg: '#a4262c' },
};

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function mixHex(a: string, b: string, weight: number): string {
  const ar = parseInt(a.slice(1, 3), 16), ag = parseInt(a.slice(3, 5), 16), ab = parseInt(a.slice(5, 7), 16);
  const br = parseInt(b.slice(1, 3), 16), bg = parseInt(b.slice(3, 5), 16), bb = parseInt(b.slice(5, 7), 16);
  const w = weight / 100;
  const r = Math.round(ar * w + br * (1 - w));
  const g = Math.round(ag * w + bg * (1 - w));
  const bl = Math.round(ab * w + bb * (1 - w));
  return `rgb(${r},${g},${bl})`;
}

function ScenarioHeader({
  scenario,
  isDark,
  mermaid_diagram,
  onExpandDiagram,
}: {
  scenario: ScenarioCard;
  isDark: boolean;
  mermaid_diagram?: string;
  onExpandDiagram?: () => void;
}) {
  const primaryTag = scenario.workloadTags?.[0];
  const wc = primaryTag ? workloadColors[primaryTag] ?? defaultWc : defaultWc;
  const icons = (scenario.workloadTags ?? [])
    .map((t) => workloadColors[t])
    .filter((c): c is WorkloadColor => !!c && !!c.icon);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        minHeight: mermaid_diagram ? '240px' : '120px',
        height: mermaid_diagram ? undefined : '120px',
        overflow: 'hidden',
        borderRadius: '6px 6px 0 0',
        background: `
          radial-gradient(ellipse at 30% 50%, ${hexToRgba(wc.primary, 0.65)} 0%, transparent 70%),
          linear-gradient(135deg,
            ${wc.secondary} 0%,
            ${mixHex(wc.primary, wc.secondary, 50)} 100%
          )
        `,
      }}
    >
      {/* Noise overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: isDark ? 0.03 : 0.06,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: '128px 128px',
        }}
      />
      {/* Bottom fade into card body */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '40px',
          background: isDark
            ? 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.04))'
            : 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.02))',
        }}
      />

      {mermaid_diagram ? (
        <>
          {/* Invisible in-flow image to size the container for tall diagrams */}
          <img
            src={`/images/diagrams/${scenario.slug}_${isDark ? 'dark' : 'light'}.svg`}
            alt=""
            aria-hidden
            style={{ display: 'block', width: '100%', maxHeight: '500px', visibility: 'hidden', padding: '6px' }}
          />
          {/* Diagram panel — absolute to fill the area */}
          <div
            onClick={onExpandDiagram}
            style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            overflow: 'hidden',
            cursor: 'zoom-in',
            backgroundColor: isDark ? 'rgba(30,30,36,0.96)' : 'rgba(255,255,255,0.97)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ width: '100%', height: '100%', pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}>
            <img
              src={`/images/diagrams/${scenario.slug}_${isDark ? 'dark' : 'light'}.svg`}
              alt="Architecture diagram"
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
            />
          </div>
          {/* Expand hint */}
          <div style={{
            position: 'absolute',
            bottom: '8px',
            right: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '4px 10px',
            borderRadius: '6px',
            backgroundColor: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(4px)',
            border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
            color: isDark ? '#e0e0e0' : '#424242',
            fontSize: '11px',
            fontWeight: 600,
            opacity: 0.75,
            pointerEvents: 'none',
          }}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <path d="M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Expand
          </div>
        </div>
        </>
      ) : (
        /* Workload icons (default) */
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
          }}
        >
          {icons.map((ic, i) => (
            <div
              key={i}
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isDark
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(255, 255, 255, 0.55)',
                backdropFilter: 'blur(16px) saturate(180%)',
                WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                border: isDark
                  ? '1px solid rgba(255, 255, 255, 0.12)'
                  : '1px solid rgba(255, 255, 255, 0.6)',
                boxShadow: isDark
                  ? '0 4px 24px rgba(0, 0, 0, 0.3)'
                  : '0 4px 24px rgba(0, 0, 0, 0.08)',
              }}
            >
              <Image
                src={ic.icon}
                alt=""
                width={48}
                height={48}
                style={{ width: '36px', height: '36px' }}
                unoptimized
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ScenarioOverview({ scenario, mermaid_diagram }: { scenario: ScenarioCard; mermaid_diagram?: string }) {
  const { theme } = useThemeContext();
  const isDark = theme.key === 'dark';
  const [diagramExpanded, setDiagramExpanded] = useState(false);
  const colors = difficultyColor[scenario.difficulty?.toLowerCase()] || difficultyColor.intermediate;

  const installCode = `import fabric_jumpstart as jumpstart\n\n# Install this scenario\njumpstart.install("${scenario.slug}")`;

  return (
    <div style={{
      borderRadius: '6px',
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
      backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
      backdropFilter: 'blur(20px) saturate(180%)',
      overflow: 'hidden',
      marginBottom: '32px',
    }}>
      <ScenarioHeader scenario={scenario} isDark={isDark} mermaid_diagram={mermaid_diagram} onExpandDiagram={() => setDiagramExpanded(true)} />
      <div style={{ padding: '28px 32px' }}>
      {/* Title */}
      <h1 style={{
        fontSize: '22px',
        fontWeight: 600,
        margin: '0 0 16px',
        lineHeight: 1.3,
        color: tokens.colorNeutralForeground1,
      }}>
        {scenario.title}
      </h1>

      {/* Overview label — same style as section headers below */}
      <h4 style={{
        fontSize: '13px',
        fontWeight: 700,
        textTransform: 'uppercase' as const,
        letterSpacing: '0.06em',
        color: tokens.colorNeutralForeground2,
        margin: '0 0 10px',
      }}>
        Overview
      </h4>

      {/* Description */}
      <p style={{
        fontSize: '14px',
        lineHeight: 1.7,
        color: tokens.colorNeutralForeground2,
        margin: '0 0 24px',
      }}>
        {scenario.description}
      </p>

      {/* Property grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '12px',
        marginBottom: '24px',
      }}>
        <PropertyCard label="Class" value={scenario.core ? 'Core' : 'Community'} isDark={isDark} />
        <PropertyCard label="Type" value={scenario.type} isDark={isDark} />
        <PropertyCard
          label="Difficulty"
          value={
            <span style={{
              fontSize: '12px',
              fontWeight: 600,
              padding: '3px 10px',
              borderRadius: '4px',
              backgroundColor: colors.bg,
              color: colors.fg,
            }}>
              {scenario.difficulty}
            </span>
          }
          isDark={isDark}
        />
        <PropertyCard label="Deploy Time" value={`~${scenario.minutesToDeploy} min`} isDark={isDark} />
        <PropertyCard label="Complete Time" value={`~${scenario.minutesToComplete} min`} isDark={isDark} />
      </div>

      {/* Workloads */}
      {scenario.workloadTags && scenario.workloadTags.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{
            fontSize: '13px',
            fontWeight: 700,
            textTransform: 'uppercase' as const,
            letterSpacing: '0.06em',
            color: tokens.colorNeutralForeground2,
            margin: '0 0 10px',
          }}>
            Workloads
          </h4>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {scenario.workloadTags.map((tag) => (
              <span key={tag} style={{
                fontSize: '12px',
                padding: '4px 12px',
                borderRadius: '12px',
                backgroundColor: isDark ? 'rgba(0, 120, 212, 0.30)' : '#deecf9',
                color: '#0078d4',
                fontWeight: 500,
              }}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Fabric Items Deployed */}
      <div style={{ marginBottom: '20px' }}>
        <h4 style={{
          fontSize: '13px',
          fontWeight: 700,
          textTransform: 'uppercase' as const,
          letterSpacing: '0.06em',
          color: tokens.colorNeutralForeground2,
          margin: '0 0 10px',
        }}>
          Fabric Items Deployed
        </h4>
        <ul style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}>
          {scenario.itemsInScope.map((item) => (
            <li key={item} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              color: tokens.colorNeutralForeground1,
            }}>
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: tokens.colorPaletteBlueForeground2,
                flexShrink: 0,
              }} />
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Scenarios */}
      {(() => {
        const workloadSet = new Set(scenario.workloadTags ?? []);
        const scenarioOnly = scenario.tags.filter((t) => !workloadSet.has(t));
        if (scenarioOnly.length === 0) return null;
        return (
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{
              fontSize: '13px',
              fontWeight: 700,
              textTransform: 'uppercase' as const,
              letterSpacing: '0.06em',
              color: tokens.colorNeutralForeground2,
              margin: '0 0 10px',
            }}>
              Scenarios
            </h4>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {scenarioOnly.map((tag) => (
                <span key={tag} style={{
                  fontSize: '12px',
                  padding: '4px 12px',
                  borderRadius: '12px',
                  backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                  color: tokens.colorNeutralForeground2,
                  fontWeight: 500,
                }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Quick Start */}
      <div>
        <h4 style={{
          fontSize: '13px',
          fontWeight: 700,
          textTransform: 'uppercase' as const,
          letterSpacing: '0.06em',
          color: tokens.colorNeutralForeground2,
          margin: '0 0 10px',
        }}>
          Quick Start
        </h4>
        <a
          href="/getting-started/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '10px',
            fontSize: '13px',
            fontWeight: 500,
            color: tokens.colorCompoundBrandForeground1,
            textDecoration: 'none',
          }}
        >
          🚀 New to Jumpstart? Read the Getting Started guide →
        </a>
        <div style={{
          borderRadius: '6px',
          overflow: 'hidden',
        }}>
          <CodeBlock isDarkMode={isDark}>
            <code className="language-python">
              {installCode}
            </code>
          </CodeBlock>
        </div>
      </div>
      </div>
      {diagramExpanded && mermaid_diagram && createPortal(
        <ExpandedModal slug={scenario.slug} title={scenario.title} onClose={() => setDiagramExpanded(false)} />,
        document.body,
      )}
    </div>
  );
}

function PropertyCard({
  label,
  value,
  isDark,
}: {
  label: string;
  value: React.ReactNode;
  isDark: boolean;
}) {
  return (
    <div style={{
      padding: '12px 16px',
      borderRadius: '8px',
      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
    }}>
      <div style={{
        fontSize: '11px',
        fontWeight: 600,
        textTransform: 'uppercase' as const,
        letterSpacing: '0.06em',
        color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)',
        marginBottom: '4px',
      }}>
        {label}
      </div>
      <div style={{
        fontSize: '14px',
        fontWeight: 600,
        color: isDark ? '#ffffff' : '#1a1a1a',
      }}>
        {value}
      </div>
    </div>
  );
}
