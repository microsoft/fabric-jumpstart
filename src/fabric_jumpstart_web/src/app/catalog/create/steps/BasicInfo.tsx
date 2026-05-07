'use client';

import React from 'react';
import {
  Field,
  Input,
  Textarea,
  Select,
  tokens,
} from '@fluentui/react-components';
import type { JumpstartDraft } from '../formState';
import { deriveLogicalId } from '../formState';

interface Props {
  draft: JumpstartDraft;
  onChange: (patch: Partial<JumpstartDraft>) => void;
}

export default function BasicInfo({ draft, onChange }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Field label="Display Name" required hint="The jumpstart's human-readable title">
        <Input
          value={draft.name}
          onChange={(_, d) => {
            const name = d.value;
            const patch: Partial<JumpstartDraft> = { name };
            // Auto-derive logical_id only if user hasn't manually edited it
            if (!draft.logical_id || draft.logical_id === deriveLogicalId(draft.name)) {
              patch.logical_id = deriveLogicalId(name);
            }
            onChange(patch);
          }}
          placeholder="e.g. Real-Time Inventory Tracker"
        />
      </Field>

      <Field
        label="Logical ID"
        required
        hint="Kebab-case identifier used in file names, URLs, and the manifest. Auto-derived from name."
      >
        <Input
          value={draft.logical_id}
          onChange={(_, d) => onChange({ logical_id: d.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
          placeholder="e.g. real-time-inventory-tracker"
        />
      </Field>

      <Field
        label="Description"
        required
        hint={`Max 250 characters. Cannot start with the jumpstart name. ${draft.description.length}/250`}
        validationState={
          draft.description.length > 250
            ? 'error'
            : draft.name && draft.description.toLowerCase().startsWith(draft.name.toLowerCase())
            ? 'warning'
            : 'none'
        }
        validationMessage={
          draft.description.length > 250
            ? 'Description must be 250 characters or fewer.'
            : draft.name && draft.description.toLowerCase().startsWith(draft.name.toLowerCase())
            ? 'Description should not start with the jumpstart name.'
            : undefined
        }
      >
        <Textarea
          value={draft.description}
          onChange={(_, d) => onChange({ description: d.value })}
          placeholder="Describe what users will build and learn with this jumpstart..."
          resize="vertical"
          rows={3}
        />
      </Field>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Field label="Type" required>
          <Select
            value={draft.type}
            onChange={(_, d) => onChange({ type: d.value as JumpstartDraft['type'] })}
          >
            <option value="" disabled>Select type…</option>
            <option value="Tutorial">📓 Tutorial</option>
            <option value="Demo">▶️ Demo</option>
            <option value="Accelerator">🚀 Accelerator</option>
          </Select>
        </Field>

        <Field label="Difficulty" required>
          <Select
            value={draft.difficulty}
            onChange={(_, d) => onChange({ difficulty: d.value as JumpstartDraft['difficulty'] })}
          >
            <option value="" disabled>Select difficulty…</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </Select>
        </Field>
      </div>

      <Field label="Date Added" required hint="Format: MM/DD/YYYY">
        <Input
          type="text"
          value={draft.date_added}
          onChange={(_, d) => onChange({ date_added: d.value })}
          placeholder="MM/DD/YYYY"
        />
      </Field>

      {draft.type && (
        <div
          style={{
            background: tokens.colorNeutralBackground2,
            borderRadius: 8,
            padding: '10px 14px',
            fontSize: 13,
            color: tokens.colorNeutralForeground2,
          }}
        >
          <strong>
            {draft.type === 'Accelerator' ? '🚀' : draft.type === 'Demo' ? '▶️' : '📓'}{' '}
            {draft.type}
          </strong>
          {' — '}
          {draft.type === 'Accelerator'
            ? 'Production-ready solution users can deploy and customize'
            : draft.type === 'Demo'
            ? 'Interactive demonstration showcasing a Fabric capability'
            : 'Step-by-step guided learning experience'}
        </div>
      )}
    </div>
  );
}
