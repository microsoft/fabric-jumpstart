'use client';

import React, { Suspense, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
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

function BackLink({ defaultHref, defaultLabel }: { defaultHref: string; defaultLabel: string }) {
  const searchParams = useSearchParams();
  const from = searchParams.get('from');

  const { href, label } = useMemo(() => {
    if (from === 'home') return { href: '/', label: '← Back to home' };
    return { href: defaultHref, label: defaultLabel };
  }, [from, defaultHref, defaultLabel]);

  return (
    <Link
      href={href}
      style={{
        color: tokens.colorBrandForeground1,
        textDecoration: 'none',
        fontSize: '14px',
        display: 'inline-block',
        marginBottom: '24px',
      }}
    >
      {label}
    </Link>
  );
}

export default function ScenarioPageClient({
  slug,
  rawMarkdown,
  isMdx,
  showToc,
}: ScenarioPageClientProps) {
  const scenario = (scenariosData as ScenarioCard[]).find((s) => s.slug === slug || s.id === slug);

  const hasContent = !!rawMarkdown;

  // Use mermaid_diagram from scenario data
  const mermaid_diagramDef = scenario?.mermaid_diagram || undefined;

  return (
    <section
      style={{
        maxWidth: hasContent && showToc ? '1200px' : '900px',
        margin: '0 auto',
        padding: '80px 24px 40px',
        lineHeight: '1.7',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <Suspense fallback={
        <Link
          href="/catalog/"
          style={{
            color: tokens.colorBrandForeground1,
            textDecoration: 'none',
            fontSize: '14px',
            display: 'inline-block',
            marginBottom: '24px',
          }}
        >
          ← Back to catalog
        </Link>
      }>
        <BackLink defaultHref="/catalog/" defaultLabel="← Back to catalog" />
      </Suspense>

      {scenario ? (
        <>
          <ScenarioOverview scenario={scenario} mermaid_diagram={mermaid_diagramDef} />
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
