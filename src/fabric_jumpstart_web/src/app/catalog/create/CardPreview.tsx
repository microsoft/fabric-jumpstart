'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { tokens, Tooltip } from '@fluentui/react-components';
import { workloadColors, getTypeEmoji, getTypeTooltip, getDifficultyTooltip } from '@components/JumpstartCard';
import { useThemeContext } from '@components/Providers/themeProvider';
import { renderMermaidSvg } from '@utils/mermaidRender';
import type { JumpstartDraft } from './formState';

interface Props {
  draft: JumpstartDraft;
}

export default function CardPreview({ draft }: Props) {
  const { theme } = useThemeContext();
  const isDark = theme.key === 'dark';
  const diagramRef = useRef<HTMLDivElement>(null);
  const [diagramLoaded, setDiagramLoaded] = useState(false);

  const renderDiagram = useCallback(async () => {
    const el = diagramRef.current;
    if (!el) return;
    if (!draft.mermaid_diagram.trim()) {
      el.innerHTML = '';
      setDiagramLoaded(false);
      return;
    }
    try {
      await renderMermaidSvg(draft.mermaid_diagram, isDark, el);
      setDiagramLoaded(true);
    } catch {
      el.innerHTML = '';
      setDiagramLoaded(false);
    }
  }, [draft.mermaid_diagram, isDark]);

  useEffect(() => {
    setDiagramLoaded(false);
    const t = setTimeout(renderDiagram, 400);
    return () => clearTimeout(t);
  }, [renderDiagram]);

  const icons = draft.workload_tags
    .map((t) => ({ tag: t, color: workloadColors[t] }))
    .filter((c): c is { tag: string; color: typeof workloadColors[string] } => !!c.color?.icon);

  const type = draft.type || 'Tutorial';
  const difficulty = draft.difficulty || 'Beginner';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: tokens.colorNeutralForeground3 }}>
        Live Card Preview
      </div>

      {/* Outer card — matches ScenarioGrid .card style exactly */}
      <div style={{ width: 320, borderRadius: '6px', border: `1px solid ${tokens.colorNeutralStroke1}`, overflow: 'hidden' }}>
        <style>{`@keyframes skeleton-pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }`}</style>

        {/* Card header — mirrors JumpstartCard CardHeader, live mermaid instead of <img> */}
        <div style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          height: '180px',
          overflow: 'visible',
          pointerEvents: 'none',
        }}>
          {/* Diagram area — absolute fill, same as JumpstartCard */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1,
            overflow: 'hidden',
            pointerEvents: 'none',
            backgroundColor: isDark ? '#1e1e24' : '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4px',
          }}>
            {/* Skeleton while mermaid renders */}
            {!diagramLoaded && (
              <div style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: isDark ? '#2a2a30' : '#e0e0e0',
                animation: 'skeleton-pulse 1.6s ease-in-out infinite',
              }} />
            )}
            <div
              ref={diagramRef}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: diagramLoaded ? 1 : 0,
                transition: 'opacity 0.3s ease',
              }}
            />
          </div>

          {/* Workload ribbon — exactly matches JumpstartCard */}
          {icons.length > 0 && (
            <div style={{
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
              boxShadow: isDark ? '0 2px 12px rgba(0, 0, 0, 0.3)' : '0 2px 12px rgba(0, 0, 0, 0.08)',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.06)',
            }}>
              {icons.map((item) => (
                <div key={item.tag} style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.7)',
                  border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.06)',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
                }}>
                  <img src={item.color.icon} alt={item.tag} width={28} height={28} style={{ width: '28px', height: '28px' }} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Card body — exact copy of JumpstartCard CardBody */}
        <div style={{ padding: '36px 20px 20px', display: 'flex', flexDirection: 'column', flexGrow: 1, backgroundColor: isDark ? '#1a1a1a' : '#f8f8f8' }}>
          {/* Pills: Type + Difficulty */}
          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '6px', marginBottom: '10px' }}>
            <Tooltip content={getTypeTooltip(type)} relationship="description" withArrow>
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
                {getTypeEmoji(type)} {type}
              </span>
            </Tooltip>
            <Tooltip content={getDifficultyTooltip(difficulty)} relationship="description" withArrow>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '3px 8px',
                borderRadius: '999px',
                fontSize: '12px',
                fontWeight: 600,
                backgroundColor: difficulty === 'Beginner'
                  ? (isDark ? 'rgba(16,124,16,0.15)' : '#dff6dd')
                  : difficulty === 'Advanced'
                  ? (isDark ? 'rgba(164,38,44,0.15)' : '#fde7e9')
                  : (isDark ? 'rgba(121,118,0,0.15)' : '#fff4ce'),
                color: difficulty === 'Beginner'
                  ? (isDark ? '#54b054' : '#107c10')
                  : difficulty === 'Advanced'
                  ? (isDark ? '#e87979' : '#a4262c')
                  : (isDark ? '#d4d040' : '#797600'),
                border: `1px solid ${difficulty === 'Beginner'
                  ? (isDark ? 'rgba(16,124,16,0.4)' : '#b8e0b8')
                  : difficulty === 'Advanced'
                  ? (isDark ? 'rgba(164,38,44,0.4)' : '#e0b8ba')
                  : (isDark ? 'rgba(121,118,0,0.4)' : '#e0dba0')}`,
              }}>
                {difficulty}
              </span>
            </Tooltip>
          </div>

          {/* Title */}
          <div style={{
            fontSize: '18px',
            fontWeight: 600,
            color: tokens.colorNeutralForeground1,
            marginBottom: '8px',
          }}>
            {draft.name || 'Your Jumpstart Name'}
          </div>

          {/* Description */}
          <div style={{
            fontSize: '14px',
            color: tokens.colorNeutralForeground2,
            marginBottom: '16px',
            lineHeight: '20px',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical' as const,
            overflow: 'hidden',
            flexGrow: 1,
          }}>
            {draft.description || 'Your jumpstart description will appear here.'}
          </div>

          {/* Scenario tags — workload_tags are separate in draft so just show scenario_tags */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
            {draft.scenario_tags.slice(0, 3).map((tag) => (
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
            📦 {draft.minutes_to_deploy || '–'} min. deploy • ⏱️ {draft.minutes_to_complete_jumpstart || '–'} min. complete • {draft.items_in_scope.length} item types
          </div>
        </div>
      </div>
    </div>
  );
}

