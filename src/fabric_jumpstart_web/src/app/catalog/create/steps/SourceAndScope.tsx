'use client';

import React from 'react';
import { Field, Input, tokens } from '@fluentui/react-components';
import type { JumpstartDraft } from '../formState';
import { ITEMS_IN_SCOPE_OPTIONS } from '../formState';

interface Props {
  draft: JumpstartDraft;
  onChange: (patch: Partial<JumpstartDraft>) => void;
}

export default function SourceAndScope({ draft, onChange }: Props) {
  const toggleItem = (item: string) => {
    const current = draft.items_in_scope;
    if (current.includes(item)) {
      onChange({ items_in_scope: current.filter((i) => i !== item) });
    } else {
      onChange({ items_in_scope: [...current, item] });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Field
        label="Repository URL"
        required
        hint="Public GitHub repository containing your jumpstart source files"
      >
        <Input
          value={draft.repo_url}
          onChange={(_, d) => onChange({ repo_url: d.value })}
          placeholder="https://github.com/your-org/your-repo"
          type="url"
        />
      </Field>

      <Field
        label="Repository Ref"
        required
        hint="A specific tag or commit SHA — do not use a branch name (e.g. v1.0.0 or a1b2c3d)"
      >
        <Input
          value={draft.repo_ref}
          onChange={(_, d) => onChange({ repo_ref: d.value })}
          placeholder="v1.0.0 or a1b2c3d4e5f6..."
        />
      </Field>

      <Field
        label="Workspace Path"
        required
        hint="Path within the repo that contains the Fabric workspace items"
      >
        <Input
          value={draft.workspace_path}
          onChange={(_, d) => onChange({ workspace_path: d.value })}
          placeholder="fabric/workspace"
        />
      </Field>

      <Field
        label="Entry Point"
        required
        hint="The first item a user should open, e.g. MyNotebook.Notebook or a URL"
      >
        <Input
          value={draft.entry_point}
          onChange={(_, d) => onChange({ entry_point: d.value })}
          placeholder="GettingStarted.Notebook"
        />
      </Field>

      <Field label="Items in Scope" required hint="Select all Fabric item types included in this jumpstart">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingTop: 4 }}>
          {ITEMS_IN_SCOPE_OPTIONS.map((item) => {
            const selected = draft.items_in_scope.includes(item);
            return (
              <button
                key={item}
                type="button"
                onClick={() => toggleItem(item)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 6,
                  border: `1.5px solid ${selected ? tokens.colorBrandStroke1 : tokens.colorNeutralStroke1}`,
                  background: selected ? tokens.colorBrandBackground2 : tokens.colorNeutralBackground1,
                  color: selected ? tokens.colorBrandForeground1 : tokens.colorNeutralForeground1,
                  fontWeight: selected ? 600 : 400,
                  fontSize: 12,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  fontFamily: 'monospace',
                }}
              >
                {item}
              </button>
            );
          })}
        </div>
        {draft.items_in_scope.length > 0 && (
          <div style={{ marginTop: 8, fontSize: 12, color: tokens.colorNeutralForeground2 }}>
            Selected: {draft.items_in_scope.join(', ')}
          </div>
        )}
      </Field>

      <div style={{ borderTop: `1px solid ${tokens.colorNeutralStroke2}`, paddingTop: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: tokens.colorNeutralForeground2, marginBottom: 4 }}>
          Binary Data Upload <span style={{ fontWeight: 400, fontSize: 12 }}>(optional)</span>
        </div>
        <div style={{ fontSize: 12, color: tokens.colorNeutralForeground3, marginBottom: 16 }}>
          If your jumpstart includes data files that need to be copied into a Lakehouse,
          provide the source folder path and destination Lakehouse below.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field
            label="Files Source Path"
            hint="Path within the repo to the folder of data/binary files to upload (e.g. data/)"
          >
            <Input
              value={draft.files_source_path}
              onChange={(_, d) => onChange({ files_source_path: d.value })}
              placeholder="data/"
            />
          </Field>
          <Field
            label="Destination Lakehouse"
            hint="Name of the Lakehouse item in scope that will receive the files"
          >
            <Input
              value={draft.files_destination_lakehouse}
              onChange={(_, d) => onChange({ files_destination_lakehouse: d.value })}
              placeholder="my_lakehouse"
            />
          </Field>
          <Field
            label="Destination Path"
            hint="Sub-path within the Lakehouse Files section (leave blank for root)"
          >
            <Input
              value={draft.files_destination_path}
              onChange={(_, d) => onChange({ files_destination_path: d.value })}
              placeholder="raw/"
            />
          </Field>
        </div>
      </div>
    </div>
  );
}
