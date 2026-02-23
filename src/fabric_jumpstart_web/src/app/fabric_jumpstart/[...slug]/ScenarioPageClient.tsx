'use client';

import React from 'react';
import Link from 'next/link';
import { tokens } from '@fluentui/react-components';
import ScenarioOverview from '@components/ScenarioOverview';
import MarkdownView from '@components/Markdown/main';
import { useThemeContext } from '@components/Providers/themeProvider';
import scenariosData from '@data/scenarios.json';

interface ScenarioPageClientProps {
  slug: string;
  markdownContent: string;
  basePath: string;
}

export default function ScenarioPageClient({
  slug,
  markdownContent,
  basePath,
}: ScenarioPageClientProps) {
  const { theme } = useThemeContext();
  const isDark = theme.key === 'dark';
  const scenario = (scenariosData as any[]).find((s) => s.slug === slug || s.id === slug);

  // Resolve relative image paths to public directory
  const resolvedMarkdown = markdownContent.replace(
    /!\[([^\]]*)\]\(\.\/img\/([^)]+)\)/g,
    `![$1](${basePath}/img/$2)`
  );

  return (
    <section
      style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '40px 24px',
        lineHeight: '1.7',
        width: '100%',
      }}
    >
      <Link
        href="/fabric_jumpstart/"
        style={{
          color: tokens.colorBrandForeground1,
          textDecoration: 'none',
          fontSize: '14px',
          display: 'inline-block',
          marginBottom: '24px',
        }}
      >
        ← Back to all scenarios
      </Link>

      {scenario ? (
        <>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 700,
            color: tokens.colorNeutralForeground1,
            margin: '0 0 24px',
            lineHeight: 1.3,
          }}>
            {scenario.title}
          </h1>
          <ScenarioOverview scenario={scenario} />
        </>
      ) : (
        <p>Scenario not found.</p>
      )}

      {resolvedMarkdown && (
        <div style={{ marginTop: '16px' }}>
          <MarkdownView
            markdowndata={resolvedMarkdown}
            pathToRoot={basePath}
            fullPathName={basePath}
            codeblock={{ copyText: 'Copy', ariaLabel: 'Copy code' }}
            isDarkMode={isDark}
            blockquote={{ disclaimer: 'Note' }}
          />
        </div>
      )}
    </section>
  );
}
