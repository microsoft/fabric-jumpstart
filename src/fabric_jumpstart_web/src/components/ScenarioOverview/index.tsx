'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import { tokens } from '@fluentui/react-components';
import { useThemeContext } from '@components/Providers/themeProvider';
import { workloadColors } from '@components/JumpstartCard';
import itemDisplayNamesData from '@data/item-display-names.json';
import type { ScenarioCard } from '@scenario/scenario';

const itemDisplayNames = itemDisplayNamesData as Record<string, string>;

const ExpandedModal = dynamic(() => import('@components/MermaidDiagram/ExpandedModal'), { ssr: false });

const CodeBlock = dynamic(() => import('@components/Markdown/Codeblock'), {
  ssr: false,
});

const difficultyColor: Record<string, { bg: string; fg: string }> = {
  beginner: { bg: '#dff6dd', fg: '#107c10' },
  intermediate: { bg: '#fff4ce', fg: '#797600' },
  advanced: { bg: '#fde7e9', fg: '#a4262c' },
};

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
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '240px',
        overflow: 'hidden',
        borderRadius: '6px 6px 0 0',
      }}
    >
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
          backgroundColor: isDark ? '#1e1e24' : '#ffffff',
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
            {scenario.workloadTags.map((tag) => {
              const wc = workloadColors[tag];
              return (
                <span key={tag} style={{
                  fontSize: '12px',
                  padding: '4px 12px',
                  borderRadius: '12px',
                  backgroundColor: isDark
                    ? `${wc?.primary ?? '#0078d4'}25`
                    : `${wc?.primary ?? '#0078d4'}20`,
                  color: isDark
                    ? (wc?.primary ?? '#0078d4')
                    : (wc?.secondary ?? '#0078d4'),
                  fontWeight: 500,
                }}>
                  {tag}
                </span>
              );
            })}
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
              {itemDisplayNames[item] ?? item}
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
