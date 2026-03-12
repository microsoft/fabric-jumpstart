'use client';
import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { createPortal } from 'react-dom';
import scenariosData from '@data/scenarios.json';
import workloadColorsData from '@data/workload-colors.json';
import { makeStyles, tokens, shorthands, Tooltip } from '@fluentui/react-components';
import { useThemeContext } from '@components/Providers/themeProvider';
import { useFilterContext } from '@components/Providers/filterProvider';
import { sortLabels, type SortOption } from '@components/Providers/filterProvider';
import { getMatchingSlugs } from '@components/SideMenu/SidebarFilters';
import type { ScenarioCard } from '@scenario/scenario';

const ExpandedModal = dynamic(
  () => import('@components/MermaidDiagram/ExpandedModal'),
  { ssr: false }
);

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.padding('40px', '32px'),
    width: '100%',
    minHeight: 'calc(100vh - 175px)',
    boxSizing: 'border-box',
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '24px',
    flexWrap: 'wrap',
    ...shorthands.gap('12px'),
  },
  resultCount: {
    fontSize: '14px',
    color: tokens.colorNeutralForeground2,
    fontWeight: 400,
  },
  resultCountBold: {
    fontWeight: 600,
    color: tokens.colorNeutralForeground1,
  },
  sortContainer: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
  },
  sortLabel: {
    fontSize: '14px',
    color: tokens.colorNeutralForeground2,
    whiteSpace: 'nowrap',
  },
  sortSelect: {
    fontSize: '14px',
    ...shorthands.padding('6px', '12px'),
    ...shorthands.borderRadius('6px'),
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    backgroundColor: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground1,
    cursor: 'pointer',
    outlineColor: tokens.colorBrandStroke1,
    minWidth: '180px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 350px))',
    justifyContent: 'center',
    ...shorthands.gap('24px'),
  },
  card: {
    ...shorthands.borderRadius('6px'),
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.overflow('hidden'),
    transitionDuration: '0.2s',
    transitionProperty: 'box-shadow, transform',
    cursor: 'pointer',
    ':hover': {
      boxShadow: tokens.shadow8,
      transform: 'translateY(-2px)',
    },
  },
  cardHeader: {
    position: 'relative' as const,
    width: '100%',
    height: '180px',
    ...shorthands.overflow('hidden'),
  },
  cardBody: {
    ...shorthands.padding('36px', '20px', '20px', '20px'),
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: tokens.colorNeutralForeground1,
    marginBottom: '8px',
  },
  cardDesc: {
    fontSize: '14px',
    color: tokens.colorNeutralForeground2,
    marginBottom: '16px',
    lineHeight: '20px',
  },
  cardMeta: {
    display: 'flex',
    ...shorthands.gap('8px'),
    flexWrap: 'wrap',
  },
  tag: {
    fontSize: '12px',
    ...shorthands.padding('4px', '8px'),
    ...shorthands.borderRadius('4px'),
    backgroundColor: tokens.colorNeutralBackground4,
    color: tokens.colorNeutralForeground2,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  difficultyBadge: {
    fontSize: '12px',
    ...shorthands.padding('4px', '8px'),
    ...shorthands.borderRadius('4px'),
    fontWeight: 600,
  },
  beginner: {
    backgroundColor: tokens.colorPaletteGreenBackground1,
    color: tokens.colorPaletteGreenForeground1,
  },
  intermediate: {
    backgroundColor: tokens.colorPaletteYellowBackground1,
    color: tokens.colorPaletteYellowForeground1,
  },
  advanced: {
    backgroundColor: tokens.colorStatusDangerBackground1,
    color: tokens.colorStatusDangerForeground1,
  },
  deployTime: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground2,
    marginTop: '12px',
  },
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

// Fallback card header gradient colors (project brand teal palette).
// Hex values required here because they are passed to hexToRgba().
const defaultColors: WorkloadColor = {
  primary: '#219580',
  secondary: '#106960',
  light: '#C5EAE5',
  accent: '#106960',
  mid: '#219580',
  icon: '',
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

function getTypeEmoji(type: string): string {
  switch (type) {
    case 'Accelerator':
      return '🚀';
    case 'Demo':
      return '▶️';
    case 'Tutorial':
      return '📓';
    default:
      return '';
  }
}

function getTypeTooltip(type: string): string {
  switch (type) {
    case 'Accelerator':
      return 'Production-ready solution you can deploy and customize';
    case 'Demo':
      return 'Interactive demonstration showcasing a Fabric capability';
    case 'Tutorial':
      return 'Step-by-step guided learning experience';
    default:
      return type;
  }
}

function getDifficultyTooltip(difficulty: string): string {
  switch (difficulty) {
    case 'Beginner':
      return 'No prior Fabric experience required';
    case 'Intermediate':
      return 'Some familiarity with Fabric recommended';
    case 'Advanced':
      return 'Assumes working knowledge of Fabric';
    default:
      return difficulty;
  }
}

function CardHeader({
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
  const wc = primaryTag ? workloadColors[primaryTag] ?? defaultColors : defaultColors;
  const icons = (scenario.workloadTags ?? [])
    .map((t) => ({ tag: t, color: workloadColors[t] }))
    .filter((c): c is { tag: string; color: WorkloadColor } => !!c.color?.icon);

  const isNew = new Date(scenario.lastUpdated) > new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

  return (
    <div
      style={{
        position: 'relative',
        zIndex: 1,
        width: '100%',
        height: '180px',
        overflow: 'visible',
        background: `
          radial-gradient(ellipse at 30% 50%, ${hexToRgba(wc.primary, 0.65)} 0%, transparent 70%),
          linear-gradient(135deg,
            ${wc.secondary} 0%,
            ${mixHex(wc.primary, wc.secondary, 50)} 100%
          )
        `,
      }}
    >
      {/* Noise texture overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: isDark ? 0.03 : 0.06,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: '128px 128px',
        }}
      />
      {/* Architecture diagram overlay */}
      {mermaid_diagram && (
        <div
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onExpandDiagram?.();
          }}
          style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            right: '10px',
            bottom: 0,
            zIndex: 1,
            borderRadius: '4px',
            overflow: 'hidden',
            cursor: 'zoom-in',
            backgroundColor: isDark ? 'rgba(30,30,36,0.92)' : 'rgba(255,255,255,0.94)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            border: isDark
              ? '1px solid rgba(255,255,255,0.08)'
              : '1px solid rgba(255,255,255,0.5)',
            boxShadow: isDark
              ? '0 2px 12px rgba(0,0,0,0.3)'
              : '0 2px 12px rgba(0,0,0,0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4px',
          }}
        >
          <div style={{ width: '100%', height: '100%', pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img
              src={`/images/diagrams/${scenario.slug}_${isDark ? 'dark' : 'light'}.svg`}
              alt="Architecture diagram"
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
            />
          </div>
          {/* Expand hint */}
          <div style={{
            position: 'absolute',
            top: '6px',
            left: '6px',
            display: 'flex',
            alignItems: 'center',
            padding: '4px',
            borderRadius: '5px',
            backgroundColor: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.85)',
            border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
            color: isDark ? '#e0e0e0' : '#424242',
            fontSize: '10px',
            fontWeight: 600,
            opacity: 0.75,
          }}>
            <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
              <path d="M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      )}
      {/* NEW badge */}
      {isNew && (
        <div
          style={{
            position: 'absolute',
            top: '6px',
            right: '6px',
            zIndex: 2,
            backgroundColor: '#212121',
            color: '#FFFFFF',
            border: isDark ? '1px solid #e0e0e0' : 'none',
            padding: '2px 12px',
            borderRadius: '2px',
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase' as const,
            letterSpacing: '0.5px',
          }}
        >
          NEW
        </div>
      )}
      {/* Workload ribbon */}
      {icons.length > 0 && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: '8px',
            right: '8px',
            transform: 'translateY(33%)',
            zIndex: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '6px 12px',
            backgroundColor: isDark ? 'rgba(40, 40, 46, 0.55)' : 'rgba(255, 255, 255, 0.6)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            borderRadius: '10px',
            boxShadow: isDark
              ? '0 2px 12px rgba(0, 0, 0, 0.3)'
              : '0 2px 12px rgba(0, 0, 0, 0.08)',
            border: isDark
              ? '1px solid rgba(255, 255, 255, 0.1)'
              : '1px solid rgba(0, 0, 0, 0.06)',
          }}
        >
          {icons.map((item, i) => (
            <div
              key={i}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isDark
                  ? 'rgba(255, 255, 255, 0.06)'
                  : 'rgba(255, 255, 255, 0.7)',
                border: isDark
                  ? '1px solid rgba(255, 255, 255, 0.08)'
                  : '1px solid rgba(0, 0, 0, 0.06)',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
              }}
            >
              <Image
                src={item.color.icon}
                alt={item.tag}
                width={28}
                height={28}
                style={{ width: '28px', height: '28px' }}
                unoptimized
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ScenarioGrid() {
  const styles = useStyles();
  const scenarios = scenariosData as ScenarioCard[];
  const { theme } = useThemeContext();
  const isDark = theme.key === 'dark';
  const { filters, hasActiveFilters, sort, setSort } = useFilterContext();
  const [expandedChart, setExpandedChart] = useState<{ slug: string; title: string } | null>(null);

  const matchingSlugs = useMemo(() => getMatchingSlugs(filters), [filters]);
  const filteredScenarios = useMemo(() => {
    const base = matchingSlugs ? scenarios.filter((s) => matchingSlugs.has(s.slug)) : scenarios;
    const sorted = [...base];
    // Primary sort: Core first, Community second
    // Secondary sort: user-selected sort within each group
    const secondarySort = (a: ScenarioCard, b: ScenarioCard) => {
      switch (sort) {
        case 'newest':
          return b.lastUpdated.localeCompare(a.lastUpdated);
        case 'oldest':
          return a.lastUpdated.localeCompare(b.lastUpdated);
        case 'name-asc':
          return a.title.localeCompare(b.title);
        case 'name-desc':
          return b.title.localeCompare(a.title);
        default:
          return 0;
      }
    };
    sorted.sort((a, b) => {
      const coreA = a.core ? 0 : 1;
      const coreB = b.core ? 0 : 1;
      if (coreA !== coreB) return coreA - coreB;
      return secondarySort(a, b);
    });
    return sorted;
  }, [scenarios, matchingSlugs, sort]);

  const getDifficultyClass = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner':
        return styles.beginner;
      case 'advanced':
        return styles.advanced;
      default:
        return styles.intermediate;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <span className={styles.resultCount}>
          {hasActiveFilters ? (
            <>
              Showing{' '}
              <span className={styles.resultCountBold}>{filteredScenarios.length}</span>{' '}
              of {scenarios.length} jumpstarts
            </>
          ) : (
            <>
              <span className={styles.resultCountBold}>{scenarios.length}</span> jumpstarts
            </>
          )}
        </span>
        <div className={styles.sortContainer}>
          <label htmlFor="sort-select" className={styles.sortLabel}>Sort by</label>
          <select
            id="sort-select"
            className={styles.sortSelect}
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
          >
            {Object.entries(sortLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>
      {filteredScenarios.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: tokens.colorNeutralForeground3,
          }}
        >
          <p style={{ fontSize: '18px', fontWeight: 600 }}>No matching scenarios</p>
          <p style={{ fontSize: '14px' }}>Try adjusting or clearing your filters.</p>
        </div>
      ) : (
      <div className={styles.grid}>
        {filteredScenarios.map((scenario) => {
          const mermaid_diagram = scenario.mermaid_diagram || undefined;
          return (
          <Link
            key={scenario.id}
            href={`/catalog/${scenario.slug}/`}
            style={{ textDecoration: 'none' }}
          >
            <div className={styles.card}>
              <CardHeader scenario={scenario} isDark={isDark} mermaid_diagram={mermaid_diagram} onExpandDiagram={() => setExpandedChart({ slug: scenario.slug, title: scenario.title })} />
              <div className={styles.cardBody}>
                {/* Pills above title: Core (if true), Type, Difficulty */}
                <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '6px', marginBottom: '10px' }}>
                  {scenario.core && (
                    <Tooltip content="Microsoft-sponsored jumpstart" relationship="description" withArrow>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '3px 10px 3px 8px',
                      borderRadius: '999px',
                      fontSize: '12px',
                      fontWeight: 600,
                          backgroundColor: isDark ? 'rgba(0,95,184,0.15)' : '#e8f2fc',
                          color: isDark ? '#6db3f8' : '#0f4f8f',
                          border: `1px solid ${isDark ? 'rgba(0,95,184,0.4)' : '#b8d4f0'}`,
                    }}
                  >
                        ⚡️Core
                  </span>
                    </Tooltip>
                  )}
                  <Tooltip content={getTypeTooltip(scenario.type)} relationship="description" withArrow>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                        gap: '4px',
                      padding: '3px 10px 3px 8px',
                      borderRadius: '999px',
                      fontSize: '12px',
                      fontWeight: 600,
                        backgroundColor: isDark ? 'rgba(14,105,90,0.15)' : '#e6f4ef',
                        color: isDark ? '#5fd4b9' : '#0C695A',
                        border: `1px solid ${isDark ? 'rgba(14,105,90,0.4)' : '#b8e0d2'}`,
                    }}
                  >
                      {getTypeEmoji(scenario.type)} {scenario.type}
                  </span>
                  </Tooltip>
                  <Tooltip content={getDifficultyTooltip(scenario.difficulty)} relationship="description" withArrow>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '3px 8px',
                      borderRadius: '999px',
                      fontSize: '12px',
                      fontWeight: 600,
                        backgroundColor: scenario.difficulty === 'Beginner'
                          ? (isDark ? 'rgba(16,124,16,0.15)' : '#dff6dd')
                          : scenario.difficulty === 'Advanced'
                          ? (isDark ? 'rgba(164,38,44,0.15)' : '#fde7e9')
                          : (isDark ? 'rgba(121,118,0,0.15)' : '#fff4ce'),
                        color: scenario.difficulty === 'Beginner'
                          ? (isDark ? '#54b054' : '#107c10')
                          : scenario.difficulty === 'Advanced'
                          ? (isDark ? '#e87979' : '#a4262c')
                          : (isDark ? '#d4d040' : '#797600'),
                        border: `1px solid ${scenario.difficulty === 'Beginner'
                          ? (isDark ? 'rgba(16,124,16,0.4)' : '#b8e0b8')
                          : scenario.difficulty === 'Advanced'
                          ? (isDark ? 'rgba(164,38,44,0.4)' : '#e0b8ba')
                          : (isDark ? 'rgba(121,118,0,0.4)' : '#e0dba0')}`,
                    }}
                  >
                      {scenario.difficulty}
                  </span>
                  </Tooltip>
                </div>
                <div className={styles.cardTitle}>{scenario.title}</div>
                <div
                  className={styles.cardDesc}
                  style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical' as const,
                    overflow: 'hidden',
                  }}
                >
                  {scenario.description}
                </div>
                {/* Scenario tags */}
                <div className={styles.cardMeta}>
                  {scenario.tags
                    .filter((tag) => !scenario.workloadTags?.includes(tag))
                    .slice(0, 3)
                    .map((tag) => (
                      <span key={tag} className={styles.tag}>
                        {tag}
                      </span>
                    ))}
                </div>
                {/* Bottom stats */}
                <div className={styles.deployTime}>
                  📦 {scenario.minutesToDeploy} min. deploy • ⏱️ {scenario.minutesToComplete} min. complete • {scenario.itemsInScope.length} item types
                </div>
              </div>
            </div>
          </Link>
          );
        })}
      </div>
      )}
      {expandedChart && createPortal(
        <ExpandedModal slug={expandedChart.slug} title={expandedChart.title} onClose={() => setExpandedChart(null)} />,
        document.body,
      )}
    </div>
  );
}
