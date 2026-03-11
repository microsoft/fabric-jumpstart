'use client';

import React from 'react';
import Link from 'next/link';
import { tokens } from '@fluentui/react-components';
import ScenarioOverview from '@components/ScenarioOverview';
import ScenarioContentSection from '@components/ScenarioContent/ScenarioContentSection';
import scenariosData from '@data/scenarios.json';
import type { ScenarioCard } from '@scenario/scenario';

interface ScenarioPageClientProps {
  slug: string;
  rawMarkdown?: string;
  isMdx: boolean;
  showToc: boolean;
}

export default function ScenarioPageClient({
  slug,
  rawMarkdown,
  isMdx,
  showToc,
}: ScenarioPageClientProps) {
  const scenario = (scenariosData as ScenarioCard[]).find((s) => s.slug === slug || s.id === slug);

  const hasContent = !!rawMarkdown;

  return (
    <section
      style={{
        maxWidth: hasContent && showToc ? '1200px' : '900px',
        margin: '0 auto',
        padding: '80px 24px 40px',
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
          <ScenarioOverview scenario={scenario} />
          {hasContent && (
            <ScenarioContentSection
              rawMarkdown={rawMarkdown!}
              isMdx={isMdx}
              showToc={showToc}
            />
          )}
        </>
      ) : (
        <p>Scenario not found.</p>
      )}
    </section>
  );
}
