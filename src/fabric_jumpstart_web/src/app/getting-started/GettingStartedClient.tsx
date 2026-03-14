'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { tokens } from '@fluentui/react-components';
import ScenarioContentRenderer from '@components/ScenarioContent/ScenarioContentRenderer';

interface GettingStartedClientProps {
  content: string;
}

function BackLink() {
  const searchParams = useSearchParams();
  const from = searchParams.get('from');
  const href = from === 'home' ? '/' : '/catalog/';
  const label = from === 'home' ? '← Back to home' : '← Back to catalog';

  return (
    <Link
      href={href}
      style={{
        color: tokens.colorBrandForeground1,
        textDecoration: 'none',
        fontSize: '14px',
        display: 'inline-block',
        paddingTop: '0px',
        marginBottom: '24px',
      }}
    >
      {label}
    </Link>
  );
}

export default function GettingStartedClient({
  content,
}: GettingStartedClientProps) {
  return (
    <section
      style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '80px 24px 40px',
        lineHeight: '1.7',
        width: '100%',
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
            paddingTop: '0px',
            marginBottom: '24px',
          }}
        >
          ← Back to catalog
        </Link>
      }>
        <BackLink />
      </Suspense>

      <ScenarioContentRenderer
        rawMarkdown={content}
        isMdx={false}
        showToc={false}
      />
    </section>
  );
}
