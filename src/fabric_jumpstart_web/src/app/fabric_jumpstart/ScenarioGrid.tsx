'use client';
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import scenariosData from '@data/scenarios.json';
import workloadColorsData from '@data/workload-colors.json';
import { makeStyles, tokens, shorthands } from '@fluentui/react-components';
import { useThemeContext } from '@components/Providers/themeProvider';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.padding('40px', '60px'),
    maxWidth: '1400px',
    marginLeft: 'auto',
    marginRight: 'auto',
    width: '100%',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    ...shorthands.gap('24px'),
  },
  card: {
    ...shorthands.borderRadius('12px'),
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
  cardImage: {
    width: '100%',
    height: '200px',
    objectFit: 'cover',
  },
  cardHeader: {
    position: 'relative' as const,
    width: '100%',
    height: '180px',
    ...shorthands.overflow('hidden'),
  },
  cardBody: {
    ...shorthands.padding('20px'),
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
    backgroundColor: tokens.colorNeutralBackground3,
    color: tokens.colorNeutralForeground1,
  },
  workloadTag: {
    fontSize: '12px',
    ...shorthands.padding('4px', '8px'),
    ...shorthands.borderRadius('4px'),
    backgroundColor: '#deecf9',
    color: '#0078d4',
  },
  difficultyBadge: {
    fontSize: '12px',
    ...shorthands.padding('4px', '8px'),
    ...shorthands.borderRadius('4px'),
    fontWeight: 600,
  },
  beginner: {
    backgroundColor: '#dff6dd',
    color: '#107c10',
  },
  intermediate: {
    backgroundColor: '#fff4ce',
    color: '#797600',
  },
  advanced: {
    backgroundColor: '#fde7e9',
    color: '#a4262c',
  },
  deployTime: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground2,
    marginTop: '12px',
  },
  sectionTitle: {
    fontSize: '28px',
    fontWeight: 700,
    color: tokens.colorNeutralForeground1,
    marginBottom: '8px',
  },
  sectionDesc: {
    fontSize: '16px',
    color: tokens.colorNeutralForeground2,
    marginBottom: '32px',
  },
});

interface Scenario {
  id: string;
  title: string;
  description: string;
  type: string;
  difficulty: string;
  tags: string[];
  workloadTags?: string[];
  previewImage: string;
  minutesToDeploy: number;
  minutesToComplete: number;
  itemsInScope: string[];
  slug: string;
}

interface WorkloadColor {
  light: string;
  accent: string;
  mid: string;
  icon: string;
}

const workloadColors = workloadColorsData as Record<string, WorkloadColor>;

const defaultColors: WorkloadColor = {
  light: '#E8F4FD',
  accent: '#0078D4',
  mid: '#5CB8E6',
  icon: '',
};

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function CardHeader({
  scenario,
  isDark,
}: {
  scenario: Scenario;
  isDark: boolean;
}) {
  const primaryTag = scenario.workloadTags?.[0];
  const wc = primaryTag ? workloadColors[primaryTag] ?? defaultColors : defaultColors;
  const icons = (scenario.workloadTags ?? [])
    .map((t) => workloadColors[t])
    .filter((c): c is WorkloadColor => !!c && !!c.icon);

  const lightAlpha = isDark ? 0.15 : 0.45;
  const midAlpha = isDark ? 0.25 : 0.5;
  const accentAlpha = isDark ? 0.35 : 0.3;

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '180px',
        overflow: 'hidden',
        background: `
          radial-gradient(ellipse 80% 60% at 50% 40%, ${hexToRgba(wc.light, lightAlpha + 0.2)} 0%, transparent 70%),
          linear-gradient(135deg,
            ${hexToRgba(wc.light, lightAlpha)} 0%,
            ${hexToRgba(wc.mid, midAlpha)} 50%,
            ${hexToRgba(wc.accent, accentAlpha)} 100%
          )
        `,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: isDark ? 0.03 : 0.06,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: '128px 128px',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '48px',
          background: isDark
            ? 'linear-gradient(to bottom, transparent, rgba(30, 30, 36, 0.78))'
            : 'linear-gradient(to bottom, transparent, rgba(255, 255, 255, 0.82))',
        }}
      />
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
        {icons.length > 0 ? (
          icons.map((wc, i) => (
            <div
              key={i}
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '20px',
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
                src={wc.icon}
                alt=""
                width={48}
                height={48}
                style={{ width: '44px', height: '44px' }}
                unoptimized
              />
            </div>
          ))
        ) : (
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '20px',
              backgroundColor: isDark
                ? 'rgba(255, 255, 255, 0.06)'
                : 'rgba(255, 255, 255, 0.4)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
            }}
          />
        )}
      </div>
    </div>
  );
}

export default function ScenarioGrid() {
  const styles = useStyles();
  const scenarios = scenariosData as Scenario[];
  const { theme } = useThemeContext();
  const isDark = theme.key === 'dark';

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
      <h2 className={styles.sectionTitle}>All Scenarios</h2>
      <p className={styles.sectionDesc}>
        Browse and deploy production-ready scenarios with a single command.
      </p>
      <div className={styles.grid}>
        {scenarios.map((scenario) => (
          <Link
            key={scenario.id}
            href={`/fabric_jumpstart/${scenario.slug}/`}
            style={{ textDecoration: 'none' }}
          >
            <div className={styles.card}>
              <CardHeader scenario={scenario} isDark={isDark} />
              <div className={styles.cardBody}>
                <div className={styles.cardTitle}>{scenario.title}</div>
                <div className={styles.cardDesc}>{scenario.description}</div>
                <div className={styles.cardMeta}>
                  <span
                    className={`${styles.difficultyBadge} ${getDifficultyClass(scenario.difficulty)}`}
                  >
                    {scenario.difficulty}
                  </span>
                  <span className={styles.tag}>{scenario.type}</span>
                  {scenario.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className={scenario.workloadTags?.includes(tag) ? styles.workloadTag : styles.tag}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className={styles.deployTime}>
                  ⚡ {scenario.minutesToDeploy} min deploy •{' '}
                  {scenario.itemsInScope.length} Fabric items
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
