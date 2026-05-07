'use client';

import React from 'react';
import { tokens } from '@fluentui/react-components';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { fabricDark, fabricLight } from '@styles/fabricPrismTheme';
import { useThemeContext } from '@components/Providers/themeProvider';
import type { JumpstartDraft } from './formState';
import { useState } from 'react';

interface Props {
  draft: JumpstartDraft;
}

function buildSnippet(draft: JumpstartDraft): string {
  const logicalId = draft.logical_id || '<logical_id>';
  const repoUrl = draft.repo_url || '<repo_url>';
  const repoRef = draft.repo_ref || '<repo_ref>';
  const entryPoint = draft.entry_point || '<entry_point>';
  const itemsInScope = draft.items_in_scope.length
    ? `[\n    "${draft.items_in_scope.join('",\n    "')}",\n  ]`
    : '[]';

  // Always show workspace_path so the user knows which folder to use.
  // If not explicitly set, show the default (logical_id + "/").
  const workspacePath = draft.workspace_path || `${logicalId}/`;

  // files params — only include when both are provided
  const filesLines =
    draft.files_source_path && draft.files_destination_lakehouse
      ? `\n  files_source_path="${draft.files_source_path}",` +
        `\n  files_destination_lakehouse="${draft.files_destination_lakehouse}",` +
        (draft.files_destination_path ? `\n  files_destination_path="${draft.files_destination_path}",` : '')
      : '';

  return `import fabric_jumpstart as jumpstart

jumpstart._install_from_github(
  logical_id="${logicalId}",
  repo_url="${repoUrl}",
  repo_ref="${repoRef}",
  workspace_path="${workspacePath}",
  entry_point="${entryPoint}",
  items_in_scope=${itemsInScope},${filesLines}
)`;
}

export default function PythonSnippet({ draft }: Props) {
  const { theme } = useThemeContext();
  const isDark = theme.key === 'dark';
  const [copied, setCopied] = useState(false);

  const snippet = buildSnippet(draft);

  const handleCopy = () => {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: tokens.colorNeutralForeground3,
        }}
      >
        Test Installation
      </div>
      <div
        style={{
          borderRadius: 8,
          border: `1px solid ${tokens.colorNeutralStroke1}`,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '6px 14px',
            background: isDark ? '#2a2a35' : '#f0f0f5',
            borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
          }}
        >
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: tokens.colorNeutralForeground2,
              fontFamily: "Menlo, Monaco, Consolas, 'Courier New', monospace",
            }}
          >
            Python
          </span>
          <button
            onClick={handleCopy}
            style={{
              padding: '2px 8px',
              borderRadius: 4,
              border: 'none',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              background: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
              color: tokens.colorNeutralForeground2,
            }}
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
        <div style={{ background: isDark ? '#1e1e1e' : '#ffffff' }}>
          <SyntaxHighlighter
            language="python"
            style={isDark ? fabricDark : fabricLight}
            showLineNumbers={false}
            customStyle={{
              margin: 0,
              padding: '12px 16px',
              background: 'none',
              backgroundColor: 'transparent',
              fontSize: 12,
              lineHeight: 1.5,
            }}
          >
            {snippet}
          </SyntaxHighlighter>
        </div>
      </div>
      <p
        style={{
          margin: 0,
          fontSize: 11,
          color: tokens.colorNeutralForeground3,
          lineHeight: 1.4,
        }}
      >
        Run this in a Fabric notebook to test your jumpstart before submitting.
      </p>
    </div>
  );
}
