'use client';
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import scenariosData from '@data/scenarios.json';
import { makeStyles, tokens, shorthands } from '@fluentui/react-components';

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

export default function ScenarioGrid() {
  const styles = useStyles();
  const scenarios = scenariosData as Scenario[];

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
              <Image
                src={scenario.previewImage}
                alt={scenario.title}
                width={600}
                height={200}
                className={styles.cardImage}
              />
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
