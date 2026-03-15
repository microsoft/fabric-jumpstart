'use client';
import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { createPortal } from 'react-dom';
import scenariosData from '@data/scenarios.json';
import featuredSlugs from '@data/featured.json';
import { makeStyles, tokens, shorthands } from '@fluentui/react-components';
import { useThemeContext } from '@components/Providers/themeProvider';
import { useFilterContext } from '@components/Providers/filterProvider';
import { sortLabels, type SortOption } from '@components/Providers/filterProvider';
import { getMatchingSlugs } from '@components/SideMenu/SidebarFilters';
import JumpstartCard from '@components/JumpstartCard';
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
    ...shorthands.overflow('hidden'),
    transitionDuration: '0.2s',
    transitionProperty: 'box-shadow, transform',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    ':hover': {
      boxShadow: tokens.shadow8,
      transform: 'translateY(-2px)',
    },
  },
});

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
    const featuredSet = new Set(featuredSlugs as string[]);
    const secondarySort = (a: ScenarioCard, b: ScenarioCard) => {
      switch (sort) {
        case 'featured': {
          const fa = featuredSet.has(a.slug) ? 0 : 1;
          const fb = featuredSet.has(b.slug) ? 0 : 1;
          if (fa !== fb) return fa - fb;
          return b.lastUpdated.localeCompare(a.lastUpdated);
        }
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
        {filteredScenarios.map((scenario) => (
          <Link
            key={scenario.id}
            href={`/catalog/${scenario.slug}/`}
            style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column' }}
          >
            <JumpstartCard
              scenario={scenario}
              isDark={isDark}
              onExpandDiagram={() => setExpandedChart({ slug: scenario.slug, title: scenario.title })}
              className={styles.card}
            />
          </Link>
        ))}
      </div>
      )}
      {expandedChart && createPortal(
        <ExpandedModal slug={expandedChart.slug} title={expandedChart.title} onClose={() => setExpandedChart(null)} />,
        document.body,
      )}
    </div>
  );
}
