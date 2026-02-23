'use client';

import React from 'react';
import Link from 'next/link';
import { tokens } from '@fluentui/react-components';
import ScenarioOverview from '@components/ScenarioOverview';
import scenariosData from '@data/scenarios.json';

interface ScenarioPageClientProps {
  slug: string;
}

export default function ScenarioPageClient({
  slug,
}: ScenarioPageClientProps) {
  const scenario = (scenariosData as any[]).find((s) => s.slug === slug || s.id === slug);

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
        <ScenarioOverview scenario={scenario} />
      ) : (
        <p>Scenario not found.</p>
      )}
    </section>
  );
}
