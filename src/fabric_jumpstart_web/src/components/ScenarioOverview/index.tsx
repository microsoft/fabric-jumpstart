'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { tokens } from '@fluentui/react-components';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import {
  oneDark,
  oneLight,
} from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useThemeContext } from '@components/Providers/themeProvider';
import workloadColorsData from '@data/workload-colors.json';
import type { ScenarioCard } from '@scenario/scenario';

interface WorkloadColor {
  light: string;
  accent: string;
  mid: string;
  icon: string;
}

const workloadColors = workloadColorsData as Record<string, WorkloadColor>;

const defaultWc: WorkloadColor = {
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

function ScenarioHeader({ scenario, isDark }: { scenario: ScenarioCard; isDark: boolean }) {
  const primaryTag = scenario.workloadTags?.[0];
  const wc = primaryTag ? workloadColors[primaryTag] ?? defaultWc : defaultWc;
  const icons = (scenario.workloadTags ?? [])
    .map((t) => workloadColors[t])
    .filter((c): c is WorkloadColor => !!c && !!c.icon);

  const lightA = isDark ? 0.15 : 0.45;
  const midA = isDark ? 0.25 : 0.5;
  const accentA = isDark ? 0.35 : 0.3;

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '120px',
        overflow: 'hidden',
        borderRadius: '16px 16px 0 0',
        background: `
          radial-gradient(ellipse 80% 60% at 50% 40%, ${hexToRgba(wc.light, lightA + 0.2)} 0%, transparent 70%),
          linear-gradient(135deg,
            ${hexToRgba(wc.light, lightA)} 0%,
            ${hexToRgba(wc.mid, midA)} 50%,
            ${hexToRgba(wc.accent, accentA)} 100%
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
      {/* Workload icons */}
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
    </div>
  );
}

export default function ScenarioOverview({ scenario }: { scenario: ScenarioCard }) {
  const { theme } = useThemeContext();
  const isDark = theme.key === 'dark';
  const [copied, setCopied] = useState(false);
  const colors = difficultyColor[scenario.difficulty?.toLowerCase()] || difficultyColor.intermediate;

  const installCode = `import fabric_jumpstart as js\n\n# Install this scenario\njs.install("${scenario.slug}")`;

  const handleCopy = () => {
    navigator.clipboard.writeText(installCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={{
      borderRadius: '16px',
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
      backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
      backdropFilter: 'blur(20px) saturate(180%)',
      overflow: 'hidden',
      marginBottom: '32px',
    }}>
      <ScenarioHeader scenario={scenario} isDark={isDark} />
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

      {/* Tags */}
      <div style={{ marginBottom: '20px' }}>
        <h4 style={{
          fontSize: '13px',
          fontWeight: 700,
          textTransform: 'uppercase' as const,
          letterSpacing: '0.06em',
          color: tokens.colorNeutralForeground2,
          margin: '0 0 10px',
        }}>
          Tags
        </h4>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {scenario.tags.map((tag) => {
            const isWorkload = scenario.workloadTags?.includes(tag);
            return (
              <span key={tag} style={{
                fontSize: '12px',
                padding: '4px 12px',
                borderRadius: '12px',
                backgroundColor: isWorkload
                  ? (isDark ? 'rgba(0, 120, 212, 0.30)' : '#deecf9')
                  : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'),
                color: isWorkload ? '#0078d4' : tokens.colorNeutralForeground2,
                fontWeight: 500,
              }}>
                {tag}
              </span>
            );
          })}
        </div>
      </div>

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
        <div style={{
          position: 'relative',
          borderRadius: '8px',
          overflow: 'hidden',
        }}>
          <SyntaxHighlighter
            language="python"
            style={isDark ? oneDark : oneLight}
            customStyle={{
              margin: 0,
              borderRadius: '8px',
              fontSize: '13px',
              lineHeight: 1.6,
              padding: '16px 20px',
            }}
          >
            {installCode}
          </SyntaxHighlighter>
          <button
            onClick={handleCopy}
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              padding: '4px 10px',
              borderRadius: '4px',
              border: 'none',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
              color: tokens.colorNeutralForeground2,
            }}
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
      </div>
      </div>
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
