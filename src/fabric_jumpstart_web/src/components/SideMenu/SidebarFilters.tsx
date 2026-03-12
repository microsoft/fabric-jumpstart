'use client';

import React, { useMemo } from 'react';
import { tokens } from '@fluentui/react-components';
import { Search16Regular } from '@fluentui/react-icons';
import { useFilterContext, emptyFilters } from '@components/Providers/filterProvider';
import type { FilterState } from '@components/Providers/filterProvider';
import scenariosData from '@data/scenarios.json';
import type { ScenarioCard } from '@scenario/scenario';

const scenarios = scenariosData as ScenarioCard[];

function deriveOptions() {
  const types = [...new Set(scenarios.map((s) => s.type))].sort();
  const difficulties = ['Beginner', 'Intermediate', 'Advanced'].filter((d) =>
    scenarios.some((s) => s.difficulty === d)
  );
  const workloadTags = [...new Set(scenarios.flatMap((s) => s.workloadTags ?? []))].sort();
  const scenarioTags = [
    ...new Set(
      scenarios.flatMap((s) => (s.tags ?? []).filter((t) => !(s.workloadTags ?? []).includes(t)))
    ),
  ].sort();
  const allMinutes = scenarios.map((s) => s.minutesToComplete).filter((m) => m > 0);
  const minTime = allMinutes.length > 0 ? Math.min(...allMinutes) : 1;
  const maxTime = allMinutes.length > 0 ? Math.max(...allMinutes) : 60;
  return { types, difficulties, workloadTags, scenarioTags, minTime, maxTime };
}

export default function SidebarFilters() {
  const { types, difficulties, workloadTags, scenarioTags, minTime, maxTime } = useMemo(deriveOptions, []);
  const { filters, setFilters, hasActiveFilters, clearFilters } = useFilterContext();

  const toggleArray = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];

  const chipStyle = (selected: boolean): React.CSSProperties => ({
    fontSize: '11px',
    padding: '3px 10px',
    borderRadius: '12px',
    border: `1px solid ${selected ? tokens.colorCompoundBrandStroke : tokens.colorNeutralStroke1}`,
    backgroundColor: selected
      ? tokens.colorSubtleBackgroundSelected
      : 'transparent',
    color: selected ? tokens.colorCompoundBrandForeground1 : tokens.colorNeutralForeground2,
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
    color: tokens.colorNeutralForeground2,
    margin: '0 0 6px',
  };

  const rangeMin = filters.minMinutesToComplete ?? minTime;
  const rangeMax = filters.maxMinutesToComplete ?? maxTime;

  return (
    <div
      style={{
        padding: '12px 0 16px',
        borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
        marginBottom: '8px',
      }}
    >
      {/* Search */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '8px 16px',
        borderRadius: '8px',
        backgroundColor: tokens.colorNeutralBackground1,
        border: `1px solid ${tokens.colorNeutralStroke1}`,
        color: tokens.colorNeutralForeground1,
        width: '100%',
        boxSizing: 'border-box',
        marginBottom: '12px',
      }}>
        <Search16Regular style={{ color: tokens.colorNeutralForeground2, flexShrink: 0 }} />
        <input
          type="text"
          placeholder="Search jumpstarts…"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          style={{
            border: 'none',
            backgroundColor: 'transparent',
            outline: 'none',
            fontSize: '14px',
            color: tokens.colorNeutralForeground1,
            width: '100%',
          }}
        />
      </div>

      {/* Jumpstart Class */}
      <div style={{ marginBottom: '10px' }}>
        <div style={labelStyle}>Class</div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {['Core', 'Community'].map((cls) => (
            <span
              key={cls}
              style={chipStyle(filters.classes.includes(cls))}
              onClick={() => setFilters({ ...filters, classes: toggleArray(filters.classes, cls) })}
            >
              {cls}
            </span>
          ))}
        </div>
      </div>

      {/* Type */}
      <div style={{ marginBottom: '10px' }}>
        <div style={labelStyle}>Type</div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {types.map((t) => (
            <span
              key={t}
              style={chipStyle(filters.types.includes(t))}
              onClick={() => setFilters({ ...filters, types: toggleArray(filters.types, t) })}
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Workload */}
      {workloadTags.length > 0 && (
        <div style={{ marginBottom: '10px' }}>
          <div style={labelStyle}>Workload</div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {workloadTags.map((w) => (
              <span
                key={w}
                style={chipStyle(filters.workloadTags.includes(w))}
                onClick={() =>
                  setFilters({ ...filters, workloadTags: toggleArray(filters.workloadTags, w) })
                }
              >
                {w}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Scenario */}
      {scenarioTags.length > 0 && (
        <div style={{ marginBottom: '10px' }}>
          <div style={labelStyle}>Scenario</div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {scenarioTags.map((st) => (
              <span
                key={st}
                style={chipStyle(filters.scenarioTags.includes(st))}
                onClick={() =>
                  setFilters({
                    ...filters,
                    scenarioTags: toggleArray(filters.scenarioTags, st),
                  })
                }
              >
                {st}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Difficulty */}
      <div style={{ marginBottom: '10px' }}>
        <div style={labelStyle}>Difficulty</div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {difficulties.map((d) => (
            <span
              key={d}
              style={chipStyle(filters.difficulties.includes(d))}
              onClick={() =>
                setFilters({ ...filters, difficulties: toggleArray(filters.difficulties, d) })
              }
            >
              {d}
            </span>
          ))}
        </div>
      </div>

      {/* Time to Complete */}
      <div style={{ marginBottom: '12px' }}>
        <div style={labelStyle}>
          Time to complete
          <span
            style={{
              fontWeight: 400,
              textTransform: 'none',
              letterSpacing: 'normal',
              marginLeft: '6px',
              color: tokens.colorNeutralForeground1,
            }}
          >
            {rangeMin}–{rangeMax} min
          </span>
        </div>
        <div style={{ position: 'relative', height: '24px', marginTop: '4px' }}>
          {/* Track background */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: 0,
              right: 0,
              height: '4px',
              transform: 'translateY(-50%)',
              borderRadius: '2px',
              backgroundColor: tokens.colorNeutralStroke1,
            }}
          />
          {/* Active range highlight */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              height: '4px',
              transform: 'translateY(-50%)',
              borderRadius: '2px',
              backgroundColor: tokens.colorCompoundBrandBackground,
              left: `${((rangeMin - minTime) / (maxTime - minTime)) * 100}%`,
              right: `${100 - ((rangeMax - minTime) / (maxTime - minTime)) * 100}%`,
            }}
          />
          {/* Min slider */}
          <input
            type="range"
            min={minTime}
            max={maxTime}
            value={rangeMin}
            onChange={(e) => {
              const val = Math.min(Number(e.target.value), rangeMax);
              setFilters({
                ...filters,
                minMinutesToComplete: val <= minTime ? null : val,
              });
            }}
            style={{
              position: 'absolute',
              width: '100%',
              top: 0,
              height: '100%',
              margin: 0,
              appearance: 'none',
              WebkitAppearance: 'none',
              background: 'transparent',
              pointerEvents: 'none',
              zIndex: 2,
              cursor: 'pointer',
            }}
            className="range-thumb"
          />
          {/* Max slider */}
          <input
            type="range"
            min={minTime}
            max={maxTime}
            value={rangeMax}
            onChange={(e) => {
              const val = Math.max(Number(e.target.value), rangeMin);
              setFilters({
                ...filters,
                maxMinutesToComplete: val >= maxTime ? null : val,
              });
            }}
            style={{
              position: 'absolute',
              width: '100%',
              top: 0,
              height: '100%',
              margin: 0,
              appearance: 'none',
              WebkitAppearance: 'none',
              background: 'transparent',
              pointerEvents: 'none',
              zIndex: 3,
              cursor: 'pointer',
            }}
            className="range-thumb"
          />
          <style>{`
            .range-thumb::-webkit-slider-thumb {
              -webkit-appearance: none;
              appearance: none;
              height: 16px;
              width: 16px;
              border-radius: 50%;
              background: ${tokens.colorCompoundBrandBackground};
              border: 2px solid ${tokens.colorNeutralBackground1};
              box-shadow: ${tokens.shadow4};
              pointer-events: auto;
              cursor: pointer;
            }
            .range-thumb::-moz-range-thumb {
              height: 16px;
              width: 16px;
              border-radius: 50%;
              background: ${tokens.colorCompoundBrandBackground};
              border: 2px solid ${tokens.colorNeutralBackground1};
              box-shadow: ${tokens.shadow4};
              pointer-events: auto;
              cursor: pointer;
            }
          `}</style>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '10px',
            color: tokens.colorNeutralForeground2,
            marginTop: '2px',
          }}
        >
          <span>{minTime} min</span>
          <span>{maxTime} min</span>
        </div>
      </div>

      {/* Clear all */}
      {hasActiveFilters && (
        <div style={{ textAlign: 'right' }}>
          <span
            onClick={clearFilters}
            style={{
              fontSize: '11px',
              color: tokens.colorCompoundBrandForeground1,
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Clear all filters
          </span>
        </div>
      )}
    </div>
  );
}

/** Returns the set of scenario slugs that match the given filters */
export function getMatchingSlugs(filters: FilterState): Set<string> | null {
  const { search, types, difficulties, workloadTags, scenarioTags, minMinutesToComplete, maxMinutesToComplete, classes } = filters;
  const noFilters =
    search === '' &&
    types.length === 0 &&
    difficulties.length === 0 &&
    workloadTags.length === 0 &&
    scenarioTags.length === 0 &&
    minMinutesToComplete === null &&
    maxMinutesToComplete === null &&
    classes.length === 0;
  if (noFilters) return null; // null = show all

  const matches = new Set<string>();
  for (const s of scenarios) {
    if (search && !s.title.toLowerCase().includes(search.toLowerCase())) continue;
    if (types.length > 0 && !types.includes(s.type)) continue;
    if (difficulties.length > 0 && !difficulties.includes(s.difficulty)) continue;
    if (classes.length > 0) {
      const scenarioClass = s.core ? 'Core' : 'Community';
      if (!classes.includes(scenarioClass)) continue;
    }
    if (
      workloadTags.length > 0 &&
      !workloadTags.some((wt) => s.workloadTags?.includes(wt))
    )
      continue;
    if (
      scenarioTags.length > 0 &&
      !scenarioTags.some((st) => s.tags?.includes(st))
    )
      continue;
    if (minMinutesToComplete !== null && s.minutesToComplete < minMinutesToComplete) continue;
    if (maxMinutesToComplete !== null && s.minutesToComplete > maxMinutesToComplete) continue;
    matches.add(s.slug);
  }
  return matches;
}
