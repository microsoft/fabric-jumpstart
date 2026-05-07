'use client';

import React from 'react';
import { Field, Input, tokens } from '@fluentui/react-components';
import type { JumpstartDraft } from '../formState';

interface Props {
  draft: JumpstartDraft;
  onChange: (patch: Partial<JumpstartDraft>) => void;
}

export default function TimingAndLinks({ draft, onChange }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Field
        label="Owner Email"
        required
        hint="A mail-enabled security group with at least two owners"
      >
        <Input
          type="email"
          value={draft.owner_email}
          onChange={(_, d) => onChange({ owner_email: d.value })}
          placeholder="your-group@example.com"
        />
      </Field>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Field
          label="Minutes to Deploy"
          required
          hint="Approximate time to fully deploy the jumpstart"
        >
          <Input
            type="number"
            min={0}
            value={draft.minutes_to_deploy === '' ? '' : String(draft.minutes_to_deploy)}
            onChange={(_, d) =>
              onChange({ minutes_to_deploy: d.value === '' ? '' : Number(d.value) })
            }
            placeholder="e.g. 15"
          />
        </Field>

        <Field
          label="Minutes to Complete"
          required
          hint="End-to-end time to work through the jumpstart"
        >
          <Input
            type="number"
            min={0}
            value={
              draft.minutes_to_complete_jumpstart === ''
                ? ''
                : String(draft.minutes_to_complete_jumpstart)
            }
            onChange={(_, d) =>
              onChange({
                minutes_to_complete_jumpstart: d.value === '' ? '' : Number(d.value),
              })
            }
            placeholder="e.g. 60"
          />
        </Field>
      </div>

      <Field label="Documentation URL" hint="Optional link to external docs or blog post">
        <Input
          type="url"
          value={draft.jumpstart_docs_uri}
          onChange={(_, d) => onChange({ jumpstart_docs_uri: d.value })}
          placeholder="https://..."
        />
      </Field>

      <Field label="Video URL" hint="Optional YouTube or Stream link for a walkthrough video">
        <Input
          type="url"
          value={draft.video_url}
          onChange={(_, d) => onChange({ video_url: d.value })}
          placeholder="https://youtube.com/watch?v=..."
        />
      </Field>

      <Field label="Last Updated" hint="Leave blank to default to today's date">
        <Input
          type="date"
          value={draft.last_updated}
          onChange={(_, d) => onChange({ last_updated: d.value })}
        />
      </Field>
    </div>
  );
}
