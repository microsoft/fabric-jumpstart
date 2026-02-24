'use client';

import React, { useState, useMemo } from 'react';
import { tokens } from '@fluentui/react-components';
import { useThemeContext } from '@components/Providers/themeProvider';
import scenariosData from '@data/scenarios.json';
import type { ScenarioCard } from '@scenario/scenario';

export interface FilterState {
  search: string;
  types: string[];
  difficulties: string[];
  workloadTags: string[];
}

const emptyFilters: FilterState = {
  search: '',
  types: [],
  difficulties: [],
  workloadTags: [],
};

const scenarios = scenariosData as ScenarioCard[];

function deriveOptions() {
  const types = [...new Set(scenarios.map((s) => s.type))].sort();
  const difficulties = ['Beginner', 'Intermediate', 'Advanced'].filter((d) =>
    scenarios.some((s) => s.difficulty === d)
  );
  const workloadTags = [...new Set(scenarios.flatMap((s) => s.workloadTags ?? []))].sort();
  return { types, difficulties, workloadTags };
}

interface SidebarFiltersProps {
  onApply: (filters: FilterState) => void;
  isDark?: boolean;
}

export default function SidebarFilters({ onApply }: SidebarFiltersProps) {
  const { theme } = useThemeContext();
  const isDark = theme.key === 'dark';
  const { types, difficulties, workloadTags } = useMemo(deriveOptions, []);

  const [draft, setDraft] = useState<FilterState>({ ...emptyFilters });
  const hasFilters =
    draft.search !== '' ||
    draft.types.length > 0 ||
    draft.difficulties.length > 0 ||
    draft.workloadTags.length > 0;

  const toggleArray = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];

  const chipStyle = (selected: boolean): React.CSSProperties => ({
    fontSize: '11px',
    padding: '3px 10px',
    borderRadius: '12px',
    border: `1px solid ${
      selected
        ? '#0078d4'
        : isDark
          ? 'rgba(255,255,255,0.15)'
          : 'rgba(0,0,0,0.12)'
    }`,
    backgroundColor: selected
      ? isDark
        ? 'rgba(0, 120, 212, 0.3)'
        : '#deecf9'
      : 'transparent',
    color: selected ? '#0078d4' : tokens.colorNeutralForeground2,
    cursor: 'pointer',
    fontWeight: selected ? 600 : 400,
    transition: 'all 0.15s ease',
    userSelect: 'none' as const,
  });

  const labelStyle: React.CSSProperties = {
    fontSize: '10px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: tokens.colorNeutralForeground3,
    margin: '0 0 6px',
  };

  return (
    <div
      style={{
        padding: '12px 0 16px',
        borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
        marginBottom: '8px',
      }}
    >
      {/* Search */}
      <input
        type="text"
        placeholder="Search scenarios…"
        value={draft.search}
        onChange={(e) => setDraft({ ...draft, search: e.target.value })}
        style={{
          width: '100%',
          padding: '8px 12px',
          borderRadius: '8px',
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}`,
          backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
          color: tokens.colorNeutralForeground1,
          fontSize: '13px',
          outline: 'none',
          boxSizing: 'border-box',
          marginBottom: '12px',
        }}
      />

      {/* Type */}
      <div style={{ marginBottom: '10px' }}>
        <div style={labelStyle}>Type</div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {types.map((t) => (
            <span
              key={t}
              style={chipStyle(draft.types.includes(t))}
              onClick={() => setDraft({ ...draft, types: toggleArray(draft.types, t) })}
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Difficulty */}
      <div style={{ marginBottom: '10px' }}>
        <div style={labelStyle}>Difficulty</div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {difficulties.map((d) => (
            <span
              key={d}
              style={chipStyle(draft.difficulties.includes(d))}
              onClick={() =>
                setDraft({ ...draft, difficulties: toggleArray(draft.difficulties, d) })
              }
            >
              {d}
            </span>
          ))}
        </div>
      </div>

      {/* Workload */}
      {workloadTags.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <div style={labelStyle}>Workload</div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {workloadTags.map((w) => (
              <span
                key={w}
                style={chipStyle(draft.workloadTags.includes(w))}
                onClick={() =>
                  setDraft({ ...draft, workloadTags: toggleArray(draft.workloadTags, w) })
                }
              >
                {w}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Buttons */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => onApply(draft)}
          style={{
            flex: 1,
            padding: '7px 0',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: '#0078d4',
            color: '#fff',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Apply
        </button>
        {hasFilters && (
          <button
            onClick={() => {
              const cleared = { ...emptyFilters };
              setDraft(cleared);
              onApply(cleared);
            }}
            style={{
              padding: '7px 14px',
              borderRadius: '6px',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)'}`,
              backgroundColor: 'transparent',
              color: tokens.colorNeutralForeground2,
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}

/** Returns the set of scenario slugs that match the given filters */
export function getMatchingSlugs(filters: FilterState): Set<string> | null {
  const { search, types, difficulties, workloadTags } = filters;
  const noFilters =
    search === '' &&
    types.length === 0 &&
    difficulties.length === 0 &&
    workloadTags.length === 0;
  if (noFilters) return null; // null = show all

  const matches = new Set<string>();
  for (const s of scenarios) {
    if (search && !s.title.toLowerCase().includes(search.toLowerCase())) continue;
    if (types.length > 0 && !types.includes(s.type)) continue;
    if (difficulties.length > 0 && !difficulties.includes(s.difficulty)) continue;
    if (
      workloadTags.length > 0 &&
      !workloadTags.some((wt) => s.workloadTags?.includes(wt))
    )
      continue;
    matches.add(s.slug);
  }
  return matches;
}
