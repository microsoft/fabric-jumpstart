'use client';

import React, { useState } from 'react';
import { Field, Input, tokens } from '@fluentui/react-components';
import { Dismiss12Regular } from '@fluentui/react-icons';
import type { JumpstartDraft } from '../formState';
import { WORKLOAD_TAGS, SCENARIO_TAG_SUGGESTIONS } from '../formState';

interface Props {
  draft: JumpstartDraft;
  onChange: (patch: Partial<JumpstartDraft>) => void;
}

function TagChip({
  label,
  onRemove,
  color,
}: {
  label: string;
  onRemove: () => void;
  color?: string;
}) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        background: color ?? tokens.colorBrandBackground2,
        color: color ? tokens.colorNeutralForegroundOnBrand : tokens.colorBrandForeground1,
        borderRadius: 100,
        padding: '3px 10px 3px 12px',
        fontSize: 12,
        fontWeight: 500,
        cursor: 'default',
      }}
    >
      {label}
      <button
        type="button"
        onClick={onRemove}
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          color: 'inherit',
          opacity: 0.7,
        }}
        aria-label={`Remove ${label}`}
      >
        <Dismiss12Regular />
      </button>
    </span>
  );
}

export default function Tags({ draft, onChange }: Props) {
  const [scenarioInput, setScenarioInput] = useState('');

  const toggleWorkload = (tag: string) => {
    const current = draft.workload_tags;
    if (current.includes(tag)) {
      onChange({ workload_tags: current.filter((t) => t !== tag) });
    } else {
      onChange({ workload_tags: [...current, tag] });
    }
  };

  const addScenarioTag = (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed || draft.scenario_tags.includes(trimmed)) return;
    onChange({ scenario_tags: [...draft.scenario_tags, trimmed] });
    setScenarioInput('');
  };

  const removeScenarioTag = (tag: string) => {
    onChange({ scenario_tags: draft.scenario_tags.filter((t) => t !== tag) });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Field label="Workload Tags" required hint="Select one or more Microsoft Fabric workloads">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingTop: 4 }}>
          {WORKLOAD_TAGS.map((tag) => {
            const selected = draft.workload_tags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleWorkload(tag)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 100,
                  border: `1.5px solid ${selected ? tokens.colorBrandStroke1 : tokens.colorNeutralStroke1}`,
                  background: selected ? tokens.colorBrandBackground2 : tokens.colorNeutralBackground1,
                  color: selected ? tokens.colorBrandForeground1 : tokens.colorNeutralForeground1,
                  fontWeight: selected ? 600 : 400,
                  fontSize: 13,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </Field>

      <Field
        label="Scenario Tags"
        required
        hint='Type to add custom tags, or click suggestions. Press Enter or comma to add.'
      >
        <div
          style={{
            border: `1px solid ${tokens.colorNeutralStroke1}`,
            borderRadius: 6,
            padding: '8px 10px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
            minHeight: 42,
            background: tokens.colorNeutralBackground1,
          }}
        >
          {draft.scenario_tags.map((tag) => (
            <TagChip key={tag} label={tag} onRemove={() => removeScenarioTag(tag)} />
          ))}
          <input
            value={scenarioInput}
            onChange={(e) => setScenarioInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                addScenarioTag(scenarioInput);
              } else if (e.key === 'Backspace' && !scenarioInput && draft.scenario_tags.length) {
                removeScenarioTag(draft.scenario_tags[draft.scenario_tags.length - 1]);
              }
            }}
            placeholder={draft.scenario_tags.length === 0 ? 'Add a tag…' : ''}
            style={{
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: 13,
              color: tokens.colorNeutralForeground1,
              minWidth: 80,
              flex: 1,
            }}
          />
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingTop: 8 }}>
          <span style={{ fontSize: 12, color: tokens.colorNeutralForeground3, alignSelf: 'center' }}>
            Suggestions:
          </span>
          {SCENARIO_TAG_SUGGESTIONS.filter((s) => !draft.scenario_tags.includes(s)).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => addScenarioTag(s)}
              style={{
                padding: '3px 10px',
                borderRadius: 100,
                border: `1px solid ${tokens.colorNeutralStroke1}`,
                background: tokens.colorNeutralBackground2,
                color: tokens.colorNeutralForeground2,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              + {s}
            </button>
          ))}
        </div>
      </Field>
    </div>
  );
}
