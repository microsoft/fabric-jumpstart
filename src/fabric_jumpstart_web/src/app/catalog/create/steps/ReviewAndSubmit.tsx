'use client';

import React, { useState, useRef } from 'react';
import { Button, tokens } from '@fluentui/react-components';
import { Open24Regular, Checkmark24Filled, Copy24Regular } from '@fluentui/react-icons';
import type { JumpstartDraft } from '../formState';
import { generateYaml } from '../yamlGenerator';
import { submitJumpstartPr, type SubmitStep, type StepStatus } from '../githubSubmit';
import { renderMermaidSvg } from '@utils/mermaidRender';
import { DIAGRAM_STARTER } from '../formState';

interface Props {
  draft: JumpstartDraft;
  diagramSaved: boolean;
}

const SUBMIT_STEPS: { key: SubmitStep; label: string }[] = [
  { key: 'connect', label: 'Connect to GitHub' },
  { key: 'fork', label: 'Fork repository' },
  { key: 'branch', label: 'Create branch' },
  { key: 'yaml', label: 'Commit YAML manifest' },
  { key: 'svgLight', label: 'Commit light diagram' },
  { key: 'svgDark', label: 'Commit dark diagram' },
  { key: 'pr', label: 'Open pull request' },
];

function StatusIcon({ status }: { status: StepStatus | undefined }) {
  if (!status || status === 'pending')
    return <span style={{ fontSize: 16, opacity: 0.3 }}>○</span>;
  if (status === 'running') return <span style={{ fontSize: 16 }}>⏳</span>;
  if (status === 'done') return <span style={{ fontSize: 16, color: 'green' }}>✓</span>;
  return <span style={{ fontSize: 16, color: 'red' }}>✗</span>;
}

export default function ReviewAndSubmit({ draft, diagramSaved }: Props) {
  const yamlContent = generateYaml(draft, diagramSaved);
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [stepStatuses, setStepStatuses] = useState<Partial<Record<SubmitStep, StepStatus>>>({});
  const [prUrl, setPrUrl] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const offscreenRef = useRef<HTMLDivElement>(null);

  const hasToken = !!process.env.NEXT_PUBLIC_GITHUB_PR_TOKEN;
  const canSubmit = hasToken && !submitting;

  const handleCopy = () => {
    navigator.clipboard.writeText(yamlContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async () => {
    if (!offscreenRef.current) return;
    setSubmitting(true);
    setSubmitError(null);
    setPrUrl(null);
    setStepStatuses({});

    try {
      const chart = draft.mermaid_diagram || DIAGRAM_STARTER;
      const el = offscreenRef.current;
      const svgLight = await renderMermaidSvg(chart, false, el);
      el.innerHTML = '';
      const svgDark = await renderMermaidSvg(chart, true, el);
      el.innerHTML = '';

      const result = await submitJumpstartPr(
        draft.logical_id,
        draft.name,
        draft.description,
        yamlContent,
        svgLight,
        svgDark,
        (step, status) => {
          setStepStatuses((prev) => ({ ...prev, [step]: status }));
        }
      );
      setPrUrl(result.prUrl);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* YAML Preview */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: tokens.colorNeutralForeground1 }}>
            Generated YAML Manifest
          </label>
          <Button size="small" appearance="subtle" icon={<Copy24Regular />} onClick={handleCopy}>
            {copied ? 'Copied!' : 'Copy'}
          </Button>
        </div>
        <pre
          style={{
            margin: 0,
            padding: '12px 16px',
            background: '#fff',
            borderRadius: 8,
            border: `1px solid ${tokens.colorNeutralStroke1}`,
            fontSize: 12,
            fontFamily: 'monospace',
            lineHeight: 1.55,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            maxHeight: 360,
            overflowY: 'auto',
          }}
        >
          {yamlContent}
        </pre>
      </div>

      {/* Token warning */}
      {!hasToken && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 8,
            background: tokens.colorStatusWarningBackground1,
            border: `1px solid ${tokens.colorStatusWarningForeground1}`,
            fontSize: 13,
            color: tokens.colorStatusWarningForeground3,
          }}
        >
          ⚠ No GitHub token configured. Set <code>NEXT_PUBLIC_GITHUB_PR_TOKEN</code> in{' '}
          <code>.env.local</code> to enable PR submission.
        </div>
      )}

      {/* Progress stepper */}
      {(submitting || Object.keys(stepStatuses).length > 0) && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 8,
            border: `1px solid ${tokens.colorNeutralStroke1}`,
            background: '#fff',
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 10, color: tokens.colorNeutralForeground2 }}>
            Submission Progress
          </div>
          {SUBMIT_STEPS.map(({ key, label }) => (
            <div
              key={key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '4px 0',
                fontSize: 13,
                color:
                  stepStatuses[key] === 'done'
                    ? tokens.colorStatusSuccessForeground3
                    : stepStatuses[key] === 'error'
                    ? tokens.colorStatusDangerForeground1
                    : tokens.colorNeutralForeground1,
              }}
            >
              <StatusIcon status={stepStatuses[key]} />
              {label}
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {submitError && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 8,
            background: tokens.colorStatusDangerBackground1,
            border: `1px solid ${tokens.colorStatusDangerForeground1}`,
            fontSize: 13,
            color: tokens.colorStatusDangerForeground1,
          }}
        >
          ✗ {submitError}
        </div>
      )}

      {/* Success */}
      {prUrl && (
        <div
          style={{
            padding: '14px 18px',
            borderRadius: 10,
            background: tokens.colorStatusSuccessBackground1,
            border: `1px solid ${tokens.colorStatusSuccessForeground1}`,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 700, color: tokens.colorStatusSuccessForeground3, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Checkmark24Filled /> Pull request submitted successfully!
          </div>
          <a href={prUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: tokens.colorBrandForeground1, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Open24Regular style={{ fontSize: 16 }} /> View PR on GitHub
          </a>
        </div>
      )}

      {/* Submit button */}
      <Button
        appearance="primary"
        size="large"
        onClick={handleSubmit}
        disabled={!canSubmit}
        style={{ alignSelf: 'flex-start' }}
      >
        {submitting ? 'Submitting…' : 'Submit Pull Request'}
      </Button>

      {/* Offscreen SVG render target */}
      <div
        ref={offscreenRef}
        aria-hidden="true"
        style={{ position: 'absolute', top: -9999, left: -9999, visibility: 'hidden' }}
      />
    </div>
  );
}

