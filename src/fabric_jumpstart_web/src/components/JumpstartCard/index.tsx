'use client';

import React from 'react';
import Image from 'next/image';
import { tokens, Tooltip } from '@fluentui/react-components';
import workloadColorsData from '@data/workload-colors.json';
import type { ScenarioCard } from '@scenario/scenario';

export interface WorkloadColor {
  primary: string;
  secondary: string;
  light: string;
  accent: string;
  mid: string;
  icon: string;
}

export const workloadColors = workloadColorsData as Record<string, WorkloadColor>;

export function getTypeEmoji(type: string): string {
  switch (type) {
    case 'Accelerator': return '🚀';
    case 'Demo': return '▶️';
    case 'Tutorial': return '📓';
    default: return '';
  }
}

export function getTypeTooltip(type: string): string {
  switch (type) {
    case 'Accelerator': return 'Production-ready solution you can deploy and customize';
    case 'Demo': return 'Interactive demonstration showcasing a Fabric capability';
    case 'Tutorial': return 'Step-by-step guided learning experience';
    default: return type;
  }
}

export function getDifficultyTooltip(difficulty: string): string {
  switch (difficulty) {
    case 'Beginner': return 'No prior Fabric experience required';
    case 'Intermediate': return 'Some familiarity with Fabric recommended';
    case 'Advanced': return 'Assumes working knowledge of Fabric';
    default: return difficulty;
  }
}

interface JumpstartCardProps {
  scenario: ScenarioCard;
  isDark: boolean;
  onExpandDiagram?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

function CardHeader({
  scenario,
  isDark,
  onExpandDiagram,
}: {
  scenario: ScenarioCard;
  isDark: boolean;
  onExpandDiagram?: () => void;
}) {
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
      }}
    >
      {/* Architecture diagram */}
      <div
        onClick={onExpandDiagram ? (e) => {
          e.preventDefault();
          e.stopPropagation();
          onExpandDiagram();
        } : undefined}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1,
          overflow: 'hidden',
          cursor: onExpandDiagram ? 'zoom-in' : undefined,
          backgroundColor: isDark ? '#1e1e24' : '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '4px',
        }}
      >
        <div style={{ width: '100%', height: '100%', pointerEvents: onExpandDiagram ? 'none' : undefined, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img
            src={`/images/diagrams/${scenario.slug}_${isDark ? 'dark' : 'light'}.svg`}
            alt="Architecture diagram"
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
          />
        </div>
        {/* Expand hint — only when expandable */}
        {onExpandDiagram && (
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
        )}
      </div>
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

function CardBody({ scenario, isDark }: { scenario: ScenarioCard; isDark: boolean }) {
  return (
    <div style={{ padding: '36px 20px 20px', display: 'flex', flexDirection: 'column' as const, flexGrow: 1 }}>
      {/* Pills: Core, Type, Difficulty */}
      <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '6px', marginBottom: '10px' }}>
        {scenario.core && (
          <Tooltip content="Microsoft-sponsored jumpstart" relationship="description" withArrow>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '3px 10px 3px 8px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: 600,
              backgroundColor: isDark ? 'rgba(0,95,184,0.15)' : '#e8f2fc',
              color: isDark ? '#6db3f8' : '#0f4f8f',
              border: `1px solid ${isDark ? 'rgba(0,95,184,0.4)' : '#b8d4f0'}`,
            }}>
              ⚡️Core
            </span>
          </Tooltip>
        )}
        <Tooltip content={getTypeTooltip(scenario.type)} relationship="description" withArrow>
          <span style={{
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
          }}>
            {getTypeEmoji(scenario.type)} {scenario.type}
          </span>
        </Tooltip>
        <Tooltip content={getDifficultyTooltip(scenario.difficulty)} relationship="description" withArrow>
          <span style={{
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
          }}>
            {scenario.difficulty}
          </span>
        </Tooltip>
      </div>
      <div style={{
        fontSize: '18px',
        fontWeight: 600,
        color: tokens.colorNeutralForeground1,
        marginBottom: '8px',
      }}>
        {scenario.title}
      </div>
      <div style={{
        fontSize: '14px',
        color: tokens.colorNeutralForeground2,
        marginBottom: '16px',
        lineHeight: '20px',
        display: '-webkit-box',
        WebkitLineClamp: 3,
        WebkitBoxOrient: 'vertical' as const,
        overflow: 'hidden',
      }}>
        {scenario.description}
      </div>
      {/* Scenario tags */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
        {scenario.tags
          .filter((tag) => !scenario.workloadTags?.includes(tag))
          .slice(0, 3)
          .map((tag) => (
            <span key={tag} style={{
              fontSize: '12px',
              padding: '4px 8px',
              borderRadius: '4px',
              backgroundColor: tokens.colorNeutralBackground4,
              color: tokens.colorNeutralForeground2,
              border: `1px solid ${tokens.colorNeutralStroke2}`,
            }}>
              {tag}
            </span>
          ))}
      </div>
      {/* Bottom stats */}
      <div style={{
        fontSize: '12px',
        color: tokens.colorNeutralForeground2,
        marginTop: 'auto',
        paddingTop: '12px',
      }}>
        📦 {scenario.minutesToDeploy} min. deploy • ⏱️ {scenario.minutesToComplete} min. complete • {scenario.itemsInScope.length} item types
      </div>
    </div>
  );
}

export default function JumpstartCard({ scenario, isDark, onExpandDiagram, className, style }: JumpstartCardProps) {
  return (
    <div className={className} style={style}>
      <CardHeader scenario={scenario} isDark={isDark} onExpandDiagram={onExpandDiagram} />
      <CardBody scenario={scenario} isDark={isDark} />
    </div>
  );
}
